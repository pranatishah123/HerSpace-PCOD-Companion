// routes/wellnessRoutes.js
const express = require("express");
const router  = express.Router();
const protect = require("../middleware/authMiddleware");

const {
  getWellnessScore,
  refreshWellnessScore,
  getScoreHistory,
  generateDashboardAIInsight,
} = require("../controllers/wellnessScoreController");

// GET  /api/wellness/score         → get current dynamic score (always recalculates)
router.get("/score", protect, getWellnessScore);

// POST /api/wellness/score/refresh → force recalculate (call after rapidfire, mini, skin)
router.post("/score/refresh", protect, refreshWellnessScore);

// GET  /api/wellness/score/history → score history for trend charts
router.get("/score/history", protect, getScoreHistory);

// POST /api/wellness/ai-dashboard-insight -> secure AI dashboard plan
router.post("/ai-dashboard-insight", protect, generateDashboardAIInsight);

module.exports = router;
