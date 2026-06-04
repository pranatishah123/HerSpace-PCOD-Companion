const mongoose = require("mongoose");

const SkinEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // ── Image ─────────────────────────────────────────────────────────────────
  imageUrl:  { type: String, required: true }, // Cloudinary URL
  publicId:  { type: String, required: true }, // Cloudinary public_id (for deletion)

  // ── AI Analysis ───────────────────────────────────────────────────────────
  condition:      { type: String, default: "" },
  severity:       { type: String, default: "" }, // Low / Moderate / High
  severityScore:  { type: Number, default: 0  }, // 1–10
  possibleCauses: [{ type: String }],
  careTips:       [{ type: String }],
  doctorConsult:  { type: Boolean, default: false },
  hormonalLink:   { type: Boolean, default: false },
  hormonalNote:   { type: String,  default: "" },
  aiNote:         { type: String,  default: "" },

  // ── Cycle Context (linked from PeriodTracker) ─────────────────────────────
  cycleDay:   { type: Number, default: null }, // e.g. 14
  cyclePhase: { type: String, default: "" },   // Menstrual / Follicular / Ovulation / Luteal

  // ── Moderation ────────────────────────────────────────────────────────────
  moderationPassed: { type: Boolean, default: true },

}, { timestamps: true });

module.exports = mongoose.model("SkinEntry", SkinEntrySchema);