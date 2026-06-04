const AboutYou = require("../models/AboutYou");
const User     = require("../models/User");

// ── POST /api/about ───────────────────────────────────────────────────────────
// First-time onboarding submission only
// If already completed → 409 (use PUT to update later)
const saveAboutYou = async (req, res) => {
  try {
    const { name, ageGroup, lifeStage, supportType, sleep, stress } = req.body;

    // Basic validation
    if (!name || !ageGroup || !lifeStage || !sleep || !stress)
      return res.status(400).json({ message: "Please complete all fields!" });

    // ✅ Double protection — flag check AND document check
    const user = await User.findById(req.user.id);
    if (user.hasCompletedAbout)
      return res.status(409).json({ message: "Profile already completed. Use edit profile to update." });

    // ✅ Extra safety — check if document already exists in DB
    const existing = await AboutYou.findOne({ userId: req.user.id });
    if (existing)
      return res.status(409).json({ message: "Profile already exists." });

    // ✅ First time — create profile
    const profile = await AboutYou.create({
      userId: req.user.id,
      name, ageGroup, lifeStage,
      supportType: supportType || [],
      sleep, stress,
    });

    // ✅ Set flag so user moves to RapidFire next
    await User.findByIdAndUpdate(req.user.id, { hasCompletedAbout: true });

    res.status(201).json({ message: "Profile saved!", profile });

  } catch (error) {
    console.error("SaveAboutYou error:", error.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// ── GET /api/about/me ─────────────────────────────────────────────────────────
// Fetch this user's profile — used by Dashboard, Profile page
const getAboutYou = async (req, res) => {
  try {
    const profile = await AboutYou.findOne({ userId: req.user.id });

    if (!profile)
      return res.status(404).json({ hasProfile: false });

    res.status(200).json({ hasProfile: true, profile });

  } catch (error) {
    console.error("GetAboutYou error:", error.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// ── PUT /api/about ────────────────────────────────────────────────────────────
// Update profile from Settings page (future use)
// Only allowed if onboarding already completed
const updateAboutYou = async (req, res) => {
  try {
    const { name, ageGroup, lifeStage, supportType, sleep, stress } = req.body;

    const profile = await AboutYou.findOneAndUpdate(
      { userId: req.user.id },
      { name, ageGroup, lifeStage, supportType, sleep, stress },
      { returnDocument: "after" }
    );

    if (!profile)
      return res.status(404).json({ message: "Profile not found. Complete onboarding first." });

    res.status(200).json({ message: "Profile updated!", profile });

  } catch (error) {
    console.error("UpdateAboutYou error:", error.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

module.exports = { saveAboutYou, getAboutYou, updateAboutYou };