const mongoose = require("mongoose");

// ── Reusable snapshot schema (used for both current + history) ────────────────
const CycleSnapshotSchema = new mongoose.Schema({
  lastPeriod:  { type: Date,   required: true },
  regularity:  { type: String, required: true },
  cycleLength: { type: String, required: true },
  flow:        { type: String, required: true },
  spotting:    { type: String, required: true },
  skin:        { type: String, default: "" },
  hair:        { type: String, default: "" },
  weight:      { type: String, default: "" },
  sleep:       { type: String, default: "" },
  ovulation:   { type: String, default: "" },
  pain:        { type: String, default: "" },
  conditions:  [{ type: String }],
  cycleLengthDays: { type: Number, default: 28 },
  savedAt:     { type: Date, default: Date.now },
}, { _id: false });

// ── Weekly check-in schema ────────────────────────────────────────────────────
const WeeklyCheckinSchema = new mongoose.Schema({
  // Step 1 — action follow-up rating
  actionRating: {
    type: String,
    enum: ["Done", "Partial", "Skipped", ""],
    default: "",
  },

  // Step 2 — 5 mini health questions
  answers: {
    regularity: { type: String, default: "" }, // cycle regularity this week
    acne:       { type: String, default: "" }, // new acne / skin changes
    energy:     { type: String, default: "" }, // energy levels
    symptoms:   { type: String, default: "" }, // unusual symptoms (spotting, pain)
    weight:     { type: String, default: "" }, // weight / bloating changes
  },

  submittedAt: { type: Date, default: Date.now },
}, { _id: false });

// ── Action plan schema (AI-generated weekly plan) ─────────────────────────────
const ActionPlanSchema = new mongoose.Schema({
  diet:     [{ type: String }], // diet recommendations
  movement: [{ type: String }], // movement / exercise tips
  selfCare: [{ type: String }], // self-care tips

  // Comparison insight generated alongside the plan
  comparisonInsight: { type: String, default: "" },

  // Consistency score (0–100) based on action rating
  consistencyScore: { type: Number, default: 0 },

  generatedAt: { type: Date, default: Date.now },
}, { _id: false });

// ── Main schema ───────────────────────────────────────────────────────────────
const PeriodTrackerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },

  ageGroup: { type: String, default: "young" },

  // ── CURRENT (latest 12-question answers) ─────────────────────────────────
  current: { type: CycleSnapshotSchema, required: true },

  // ── HISTORY (all past snapshots — pushed before each monthly update) ──────
  history: [CycleSnapshotSchema],

  // ── WEEKLY CHECK-IN (latest mini check-in — overwritten each week) ────────
  weeklyCheckin: { type: WeeklyCheckinSchema, default: null },

  // ── ACTION PLAN (latest AI-generated plan — overwritten each week) ────────
  actionPlan: { type: ActionPlanSchema, default: null },

}, { timestamps: true }); // createdAt + updatedAt auto-managed

module.exports = mongoose.model("PeriodTracker", PeriodTrackerSchema);