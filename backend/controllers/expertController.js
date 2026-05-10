const Expert = require("../models/Expert");

// GET /experts?page=1&limit=6&category=Technology&search=John
const getExperts = async (req, res, next) => {
  try {
    const { page = 1, limit = 6, category, search } = req.query;

    const filter = {};

    if (category && category !== "All") {
      filter.category = category;
    }

    if (search && search.trim()) {
      // Case-insensitive name search
      filter.name = { $regex: search.trim(), $options: "i" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Expert.countDocuments(filter);

    const experts = await Expert.find(filter)
      .select("-availableSlots") // Don't send slots in listing (heavy)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ rating: -1 });

    res.json({
      success: true,
      data: experts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
        hasNext: skip + experts.length < total,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /experts/:id
const getExpertById = async (req, res, next) => {
  try {
    const expert = await Expert.findById(req.params.id);

    if (!expert) {
      return res.status(404).json({
        success: false,
        message: "Expert not found",
      });
    }

    res.json({ success: true, data: expert });
  } catch (error) {
    next(error);
  }
};

module.exports = { getExperts, getExpertById };
