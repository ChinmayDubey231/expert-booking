const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Expert = require("../models/Expert");
const { isPastSlot } = require("../utils/slots");

const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

// Allowed status changes. Completed and Cancelled are final — un-cancelling would
// re-activate a booking whose slot may already belong to someone else.
const TRANSITIONS = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Completed", "Cancelled"],
  Completed: [],
  Cancelled: [],
};

const emitSlotEvent = (req, event, booking) => {
  req.app.get("io").to(`expert_${booking.expertId}`).emit(event, {
    expertId: booking.expertId.toString(),
    date: booking.date,
    timeSlot: booking.timeSlot,
    bookingId: booking._id,
  });
};

// Runs fn inside a transaction. withTransaction retries on transient errors such as
// the write conflict two users get when racing for the same slot.
const inTransaction = async (fn) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};

// Marks the matching booking cancelled and frees its slot atomically
const cancelBookingWhere = (filter) =>
  inTransaction(async (session) => {
    const booking = await Booking.findOne(filter).session(session);
    if (!booking) throw httpError(404, "Booking not found");
    if (!TRANSITIONS[booking.status].includes("Cancelled")) {
      throw httpError(409, `This booking is already ${booking.status.toLowerCase()}.`);
    }
    if (isPastSlot(booking.date, booking.timeSlot)) {
      throw httpError(409, "This session has already started and can't be cancelled.");
    }

    booking.status = "Cancelled";
    await booking.save({ session });

    await Expert.updateOne(
      {
        _id: booking.expertId,
        availableSlots: { $elemMatch: { date: booking.date, time: booking.timeSlot } },
      },
      { $set: { "availableSlots.$.isBooked": false } },
      { session }
    );
    return booking;
  });

// POST /bookings
const createBooking = async (req, res, next) => {
  const { expertId, userName, email, phone, date, timeSlot, notes } = req.body;

  if (isPastSlot(date, timeSlot)) {
    return res.status(409).json({
      success: false,
      message: "This slot has already passed. Please choose another slot.",
    });
  }

  try {
    const booking = await inTransaction(async (session) => {
      // Reserve the slot. $elemMatch makes all three conditions apply to the SAME
      // array element, so the positional `$` updates exactly that slot — and only
      // if it is still free (optimistic lock).
      const expert = await Expert.findOneAndUpdate(
        {
          _id: expertId,
          availableSlots: { $elemMatch: { date, time: timeSlot, isBooked: false } },
        },
        { $set: { "availableSlots.$.isBooked": true } },
        { session, projection: { name: 1 } }
      );

      if (!expert) {
        const exists = await Expert.exists({ _id: expertId }).session(session);
        throw exists
          ? httpError(409, "This slot is no longer available. Please choose another slot.")
          : httpError(404, "Expert not found");
      }

      // The partial unique index on (expertId, date, timeSlot) is the final safety net
      const [created] = await Booking.create(
        [{ expertId, expertName: expert.name, userName, email, phone, date, timeSlot, notes }],
        { session }
      );
      return created;
    });

    // Notify everyone watching this expert so the slot disappears in real time
    emitSlotEvent(req, "slot_booked", booking);

    res.status(201).json({
      success: true,
      message: "Booking confirmed successfully!",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// GET /bookings?email=user@example.com
const getBookingsByEmail = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ email: String(req.query.email).toLowerCase() })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

// PATCH /bookings/:id/cancel  { email }
// The email must match the booking — a lightweight ownership check until the app has auth.
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await cancelBookingWhere({
      _id: req.params.id,
      email: String(req.body.email).toLowerCase(),
    });
    emitSlotEvent(req, "slot_freed", booking);
    res.json({ success: true, message: "Booking cancelled", data: booking });
  } catch (error) {
    next(error);
  }
};

// PATCH /bookings/:id/status  { status }  (admin / testing)
const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status === "Cancelled") {
      const booking = await cancelBookingWhere({ _id: id });
      emitSlotEvent(req, "slot_freed", booking);
      return res.json({ success: true, message: "Status updated", data: booking });
    }

    // Only update if the current status may move to the requested one (atomic check)
    const allowedFrom = Object.keys(TRANSITIONS).filter((s) => TRANSITIONS[s].includes(status));
    const booking = await Booking.findOneAndUpdate(
      { _id: id, status: { $in: allowedFrom } },
      { status },
      { new: true, runValidators: true }
    );

    if (!booking) {
      const existing = await Booking.findById(id).select("status").lean();
      if (!existing) throw httpError(404, "Booking not found");
      throw httpError(409, `Cannot change status from ${existing.status} to ${status}`);
    }

    res.json({ success: true, message: "Status updated", data: booking });
  } catch (error) {
    next(error);
  }
};

module.exports = { createBooking, getBookingsByEmail, cancelBooking, updateBookingStatus };
