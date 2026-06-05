const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { getMyTimeline } = require("../controllers/timelineController");

router.get("/me", protect, getMyTimeline);

module.exports = router;