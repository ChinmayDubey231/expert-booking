const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Expert = require("../models/Expert");

// POST /bookings
const createBooking = async (req, res, next) => {
  // Use a MongoDB session for atomic transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { expertId, userName, email, phone, date, timeSlot, notes } =
      req.body;

    // 1. Verify expert exists
    const expert = await Expert.findById(expertId).session(session);
    if (!expert) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: "Expert not found" });
    }

    // 2. Find the slot and check availability (atomic within transaction)
    const slotIndex = expert.availableSlots.findIndex(
      (s) => s.date === date && s.time === timeSlot && !s.isBooked,
    );

    if (slotIndex === -1) {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        message:
          "This slot is no longer available. Please choose another slot.",
      });
    }

    // 3. Mark the slot as booked atomically
    await Expert.findOneAndUpdate(
      {
        _id: expertId,
        "availableSlots.date": date,
        "availableSlots.time": timeSlot,
        "availableSlots.isBooked": false, // Optimistic locking condition
      },
      {
        $set: { "availableSlots.$.isBooked": true },
      },
      { session, new: true },
    );

    // 4. Create the booking record
    // The unique index on (expertId, date, timeSlot) is the final safety net
    const booking = new Booking({
      expertId,
      expertName: expert.name,
      userName,
      email,
      phone,
      date,
      timeSlot,
      notes,
    });

    await booking.save({ session });
    await session.commitTransaction();

    // 5. Emit real-time update to all clients watching this expert
    const io = req.app.get("io");
    io.to(`expert_${expertId}`).emit("slot_booked", {
      expertId,
      date,
      timeSlot,
      bookingId: booking._id,
      socketId: req.body.socketId || null,
    });

    res.status(201).json({
      success: true,
      message: "Booking confirmed successfully!",
      data: booking,
    });
  } catch (error) {
    await session.abortTransaction();

    // MongoDB duplicate key error — race condition caught at DB level
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "This slot was just booked by someone else. Please choose another slot.",
      });
    }
    next(error);
  } finally {
    session.endSession();
  }
};

// GET /bookings?email=user@example.com
const getBookingsByEmail = async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email query parameter is required",
      });
    }

    const bookings = await Booking.find({ email: email.toLowerCase() })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

// PATCH /bookings/:id/status
const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["Pending", "Confirmed", "Completed", "Cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${allowedStatuses.join(", ")}`,
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true },
    );

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // If cancelled, free up the slot
    if (status === "Cancelled") {
      await Expert.findOneAndUpdate(
        {
          _id: booking.expertId,
          "availableSlots.date": booking.date,
          "availableSlots.time": booking.timeSlot,
        },
        { $set: { "availableSlots.$.isBooked": false } },
      );

      const io = req.app.get("io");
      io.to(`expert_${booking.expertId}`).emit("slot_freed", {
        expertId: booking.expertId.toString(),
        date: booking.date,
        timeSlot: booking.timeSlot,
      });
    }

    res.json({ success: true, message: "Status updated", data: booking });
  } catch (error) {
    next(error);
  }
};

module.exports = { createBooking, getBookingsByEmail, updateBookingStatus };
