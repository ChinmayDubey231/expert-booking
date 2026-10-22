const express = require("express");
const router = express.Router();
const { body, param, query, validationResult } = require("express-validator");
const Booking = require("../models/Booking");
const {
  createBooking,
  getBookingsByEmail,
  cancelBooking,
  updateBookingStatus,
} = require("../controllers/bookingController");

const STATUSES = Booking.schema.path("status").enumValues;
const TIME_SLOT = /^(0[1-9]|1[0-2]):[0-5]\d (AM|PM)$/;

// Validation middleware runner
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const bookingIdParam = param("id").isMongoId().withMessage("Invalid booking ID");

// POST /bookings
router.post(
  "/",
  [
    body("expertId").isMongoId().withMessage("Invalid expert ID"),
    body("userName")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be 2–100 characters"),
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email address")
      .toLowerCase(),
    body("phone")
      .trim()
      .notEmpty()
      .withMessage("Phone is required")
      .matches(/^[6-9]\d{9}$/)
      .withMessage("Enter a valid 10-digit Indian mobile number"),
    body("date")
      .notEmpty()
      .withMessage("Date is required")
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage("Date must be in YYYY-MM-DD format"),
    body("timeSlot")
      .trim()
      .matches(TIME_SLOT)
      .withMessage("Time slot must look like 10:00 AM"),
    body("notes")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Notes cannot exceed 500 characters"),
  ],
  validate,
  createBooking
);

// GET /bookings?email=
router.get(
  "/",
  [query("email").trim().isEmail().withMessage("A valid email query param is required")],
  validate,
  getBookingsByEmail
);

// PATCH /bookings/:id/cancel — used by the app; requires the booking's email
router.patch(
  "/:id/cancel",
  [bookingIdParam, body("email").trim().isEmail().withMessage("Email is required to cancel")],
  validate,
  cancelBooking
);

// PATCH /bookings/:id/status — admin / testing
router.patch(
  "/:id/status",
  [
    bookingIdParam,
    body("status").isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(", ")}`),
  ],
  validate,
  updateBookingStatus
);

module.exports = router;
