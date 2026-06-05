const express = require("express");
const router = express.Router();

const {
  listDoctorRequests,
  respondToDoctorRequest,
  getMyDoctorRequest,
} = require("../controllers/doctorController");
const protect = require("../middleware/authMiddleware");

function requireDoctorDemoAccess(req, res, next) {
  const configuredKey = process.env.DOCTOR_DASHBOARD_KEY;
  const providedKey = req.get("x-doctor-key");
  const demoAuth = req.get("x-doctor-auth") === "true";

  if ((configuredKey && providedKey === configuredKey) || demoAuth) {
    return next();
  }

  return res.status(401).json({ message: "Doctor login required." });
}

// Normal user flow (same auth as rest of app)
router.get("/me", protect, getMyDoctorRequest);

// Hackathon demo protection: frontend demo login sends x-doctor-auth.
// Production should replace this with verified onboarding, RBAC, and consent checks.
router.get("/requests", requireDoctorDemoAccess, listDoctorRequests);
router.post("/requests/:userId/respond", requireDoctorDemoAccess, express.json(), respondToDoctorRequest);

module.exports = router;

