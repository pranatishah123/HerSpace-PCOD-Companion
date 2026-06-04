const express = require("express");
const router  = express.Router();
const { saveRapidFire, getRapidFire, getRapidFireHistory } = require("../controllers/rapidFireController");
const  protect  = require("../middleware/authMiddleware");

router.post("/",        protect, saveRapidFire);
router.get("/me",       protect, getRapidFire);
router.get("/history",  protect, getRapidFireHistory);  // ← new

module.exports = router;