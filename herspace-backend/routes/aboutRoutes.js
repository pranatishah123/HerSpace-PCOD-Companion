const express  = require("express");
const router   = express.Router();
const { saveAboutYou, getAboutYou, updateAboutYou } = require("../controllers/aboutController");
const  protect  = require("../middleware/authMiddleware");

// All routes protected 🔒
router.post("/",   protect, saveAboutYou);   // POST /api/about       → first time save
router.get("/me",  protect, getAboutYou);    // GET  /api/about/me    → fetch profile
router.put("/",    protect, updateAboutYou); // PUT  /api/about       → edit from settings
module.exports = router;