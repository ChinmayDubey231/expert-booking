const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    expertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expert",
      required: true,
    },
    expertName: { type: String, required: true },
    userName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    phone: {
      type: String,
      required: true,
      match: [/^[6-9]\d{9}$/, "Invalid Indian phone number"],
    },
    date: { type: String, required: true },  // "YYYY-MM-DD"
    timeSlot: { type: String, required: true }, // "10:00 AM"
    notes: { type: String, default: "", trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Completed", "Cancelled"],
      // The slot is reserved atomically at creation and there is no approval step
      default: "Confirmed",
    },
  },
  { timestamps: true }
);

// Unique per slot among non-cancelled bookings — the DB-level double-booking safeguard.
// Partial so that a cancelled booking doesn't block the freed slot from being rebooked.
bookingSchema.index(
  { expertId: 1, date: 1, timeSlot: 1 },
  {
    unique: true,
    name: "one_active_booking_per_slot",
    partialFilterExpression: { status: { $in: ["Pending", "Confirmed", "Completed"] } },
  }
);

// GET /bookings?email=
bookingSchema.index({ email: 1, createdAt: -1 });

module.exports = mongoose.model("Booking", bookingSchema);
