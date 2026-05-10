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
    notes: { type: String, default: "", maxlength: 500 },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Completed", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

// Compound unique index — prevents double booking at DB level
// This is the critical race-condition safeguard
bookingSchema.index(
  { expertId: 1, date: 1, timeSlot: 1 },
  { unique: true, name: "prevent_double_booking" }
);

module.exports = mongoose.model("Booking", bookingSchema);
