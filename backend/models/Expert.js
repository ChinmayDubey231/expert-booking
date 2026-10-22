const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
  date: { type: String, required: true },       // "YYYY-MM-DD"
  time: { type: String, required: true },       // "10:00 AM"
  isBooked: { type: Boolean, default: false },
});

const expertSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["Technology", "Business", "Design", "Marketing", "Finance", "Health", "Legal", "Education"],
    },
    experience: { type: Number, required: true, min: 0 }, // years
    rating: { type: Number, required: true, min: 1, max: 5 },
    bio: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    hourlyRate: { type: Number, default: 0 },
    availableSlots: [slotSchema],
  },
  { timestamps: true }
);

expertSchema.index({ category: 1, rating: -1 });

module.exports = mongoose.model("Expert", expertSchema);
