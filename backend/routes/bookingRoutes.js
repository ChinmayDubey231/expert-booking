const express = require("express");
const router = express.Router();
const { body, query, validationResult } = require("express-validator");
const {
  createBooking,
  getBookingsByEmail,
  updateBookingStatus,
} = require("../controllers/bookingController");

// Validation middleware runner
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// POST /bookings
router.post(
  "/",
  [
    body("expertId").notEmpty().withMessage("Expert ID is required"),
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
      .withMessage("Invalid email address"),
    body("phone")
      .notEmpty()
      .withMessage("Phone is required")
      .matches(/^[6-9]\d{9}$/)
      .withMessage("Enter a valid 10-digit Indian mobile number"),
    body("date")
      .notEmpty()
      .withMessage("Date is required")
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage("Date must be in YYYY-MM-DD format"),
    body("timeSlot").notEmpty().withMessage("Time slot is required"),
    body("notes")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Notes cannot exceed 500 characters"),
  ],
  validate,
  createBooking
);

// GET /bookings?email=
router.get(
  "/",
  [query("email").notEmpty().withMessage("Email query param is required").isEmail()],
  validate,
  getBookingsByEmail
);

// PATCH /bookings/:id/status
router.patch(
  "/:id/status",
  [body("status").notEmpty().withMessage("Status is required")],
  validate,
  updateBookingStatus
);

module.exports = router;
