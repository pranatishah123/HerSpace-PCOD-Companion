const express = require("express");
const router  = express.Router();
const {
  getZonesStatus,
  syncRapidFire,
  submitMiniCheckin,
  getActionPlan,
  getZonesHistory,
  generateZoneAIInsight,
  enableDoctorCtaTest,
} = require("../controllers/zonesTrackerController");
const protect = require("../middleware/authMiddleware");

router.get("/me",          protect, getZonesStatus);    // GET  — status + trigger
router.post("/sync",       protect, syncRapidFire);     // POST — sync after RapidFire
router.post("/mini",       protect, submitMiniCheckin); // POST — Day 6 mini check-in
router.get("/action-plan", protect, getActionPlan);     // GET  — latest action plan
router.get("/history",     protect, getZonesHistory);   // GET  — full history
router.post("/ai-insight", protect, generateZoneAIInsight); // POST - secure AI insight/action plan
router.post("/doctor-cta-test", protect, enableDoctorCtaTest); // POST — test helper

module.exports = router;
