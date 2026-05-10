const express = require("express");
const router = express.Router();
const { getExperts, getExpertById } = require("../controllers/expertController");

// GET /experts
router.get("/", getExperts);

// GET /experts/:id
router.get("/:id", getExpertById);

module.exports = router;
