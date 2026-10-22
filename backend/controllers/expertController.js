const Expert = require("../models/Expert");
const { isPastSlot } = require("../utils/slots");

const MAX_LIMIT = 50;

const toInt = (value, fallback, min, max) => {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? fallback : Math.min(Math.max(n, min), max);
};

// User input goes into $regex, so escape it (prevents regex injection / ReDoS)
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /experts?page=1&limit=6&category=Technology&search=react
const getExperts = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const page = toInt(req.query.page, 1, 1, 10000);
    const limit = toInt(req.query.limit, 6, 1, MAX_LIMIT);

    const filter = {};

    if (category && category !== "All") {
      filter.category = category;
    }

    if (typeof search === "string" && search.trim()) {
      // Case-insensitive match on name or bio, so "react" or "tax" finds relevant experts
      const pattern = { $regex: escapeRegex(search.trim()), $options: "i" };
      filter.$or = [{ name: pattern }, { bio: pattern }];
    }

    const skip = (page - 1) * limit;
    const [total, experts] = await Promise.all([
      Expert.countDocuments(filter),
      Expert.find(filter)
        .select("-availableSlots") // Don't send slots in listing (heavy)
        // _id tiebreak keeps the order stable across pages (many experts share a rating)
        .sort({ rating: -1, _id: 1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.json({
      success: true,
      data: experts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + experts.length < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /experts/:id
const getExpertById = async (req, res, next) => {
  try {
    const expert = await Expert.findById(req.params.id).lean();

    if (!expert) {
      return res.status(404).json({
        success: false,
        message: "Expert not found",
      });
    }

    // Only bookable slots: hide ones that have already started
    const now = new Date();
    expert.availableSlots = expert.availableSlots.filter(
      (s) => !isPastSlot(s.date, s.time, now)
    );

    res.json({ success: true, data: expert });
  } catch (error) {
    next(error);
  }
};

module.exports = { getExperts, getExpertById };
