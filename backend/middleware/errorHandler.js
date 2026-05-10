const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid ID format" });
  }

  // Mongoose ValidationError
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(422).json({
      success: false,
      message: "Validation error",
      errors: messages,
    });
  }

  // MongoDB duplicate key
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "This slot has already been booked.",
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

module.exports = errorHandler;
