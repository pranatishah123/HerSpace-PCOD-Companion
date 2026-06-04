const express = require("express");
const router  = express.Router();
const {
  savePeriodTracker,
  getCycleDashboard,
  getPeriodTracker,
  submitWeeklyCheckin,
  getActionPlan,
} = require("../controllers/periodTrackerController");
const protect = require("../middleware/authMiddleware");

// POST   /api/period              — save (new) or update (returning monthly) tracker
router.post("/",              protect, savePeriodTracker);

// GET    /api/period/me           — check tracker status + trigger flags
router.get("/me",             protect, getPeriodTracker);

// GET    /api/period/dashboard    — full cycle dashboard data
router.get("/dashboard",      protect, getCycleDashboard);

// POST   /api/period/weekly       — submit weekly mini check-in + generate AI action plan
router.post("/weekly",        protect, submitWeeklyCheckin);

// GET    /api/period/action-plan  — fetch latest AI action plan
router.get("/action-plan",    protect, getActionPlan);

module.exports = router;