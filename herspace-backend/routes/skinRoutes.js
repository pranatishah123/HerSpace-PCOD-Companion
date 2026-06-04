const express  = require("express");
const router   = express.Router();
const multer   = require("multer");
const protect  = require("../middleware/authMiddleware");
const { analyzeSkin, getSkinHistory } = require("../controllers/skinController");

// ── Multer — memory storage, 5MB limit, images only ──────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max (reduced from 10MB)
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG and WEBP images are allowed."));
    }
  },
});

// POST /api/skin/analyze  — upload + moderate + analyze + save
router.post("/analyze", protect, (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Image is too large. Max size is 5MB." });
    }

    return res.status(400).json({
      message: err.message || "Invalid image upload.",
    });
  });
}, analyzeSkin);

// GET  /api/skin/history  — fetch all skin entries + pattern insight
router.get("/history",  protect, getSkinHistory);

module.exports = router;