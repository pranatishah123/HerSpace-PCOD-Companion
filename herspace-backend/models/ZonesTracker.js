const mongoose = require("mongoose");

const miniCheckinSchema = new mongoose.Schema({
  energy:     { type: String, required: true }, // "Improved" | "Same" | "Worse"
  symptoms:   { type: String, required: true }, // "Reduced" | "Same" | "Increased"
  skin:       { type: String, required: true }, // "Better" | "Same" | "Worse"
  stress:     { type: String, required: true }, // "Lower" | "Same" | "Higher"
  overall:    { type: String, required: true }, // "Better" | "Same" | "Worse"
  submittedAt: { type: Date, default: Date.now },
}, { _id: false });

const actionPlanSchema = new mongoose.Schema({
  diet:       [{ type: String }],
  movement:   [{ type: String }],
  selfCare:   [{ type: String }],
  insight:    { type: String },
  stabilityScore: { type: String, enum: ["Improving", "Stable", "Worsening"] },
  submittedAt: { type: Date, default: Date.now },
}, { _id: false });

const zoneSnapshotSchema = new mongoose.Schema({
  zone:           { type: String, enum: ["healthy","mild","moderate","high"] },
  finalScore:     { type: Number },
  confidencePct:  { type: Number },
  detectedSymptoms: [{ type: String }],
  savedAt:        { type: Date, default: Date.now },
}, { _id: false });

const riskEventSchema = new mongoose.Schema({
  source:      { type: String, enum: ["monthly", "mini"], required: true },
  level:       { type: String, enum: ["normal", "high"], required: true },
  summary:     { type: String, default: "" },
  recordedAt:  { type: Date, default: Date.now },
}, { _id: false });

const ZonesTrackerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },

  // Latest zone snapshot (from RapidFire)
  current: { type: zoneSnapshotSchema },

  // History of all zone snapshots
  history: [zoneSnapshotSchema],

  // Mini check-in (Day 6)
  miniCheckin: { type: miniCheckinSchema},

  // Rolling mini check-in history for the weekly loop
  miniCheckins: { type: [miniCheckinSchema], default: [] },

  // AI action plan
  actionPlan: { type: actionPlanSchema, default: null },

  // Tracks risky mini/monthly loop events used for doctor escalation
  riskEvents: { type: [riskEventSchema], default: [] },

  // Doctor escalation
  doctorRequest: {
    triggered:       { type: Boolean, default: false },
    triggeredAt:     { type: Date },
    summary:         { type: String },
    doctorResponse:  { type: String, default: "Our wellness team will review your symptoms and respond within 24 hours. Meanwhile, please avoid self-medication and maintain your current lifestyle plan." },
    status:          { type: String, enum: ["pending","responded"], default: "pending" },
  },

}, { timestamps: true });

module.exports = mongoose.model("ZonesTracker", ZonesTrackerSchema);