const express = require("express");
const router = express.Router();

const {
  listDoctorRequests,
  respondToDoctorRequest,
  getMyDoctorRequest,
} = require("../controllers/doctorController");
const protect = require("../middleware/authMiddleware");

// Normal user flow (same auth as rest of app)
router.get("/me", protect, getMyDoctorRequest);

// Optional protection by x-doctor-key header (DOCTOR_DASHBOARD_KEY env)
router.get("/requests", listDoctorRequests);
router.post("/requests/:userId/respond", express.json(), respondToDoctorRequest);

module.exports = router;

