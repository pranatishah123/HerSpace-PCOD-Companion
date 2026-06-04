const mongoose = require("mongoose");

const symptomAnswerSchema = new mongoose.Schema({
  symptom:  { type: String, required: true },
  present:  { type: Boolean, required: true },
  severity: { type: Number, default: 0, min: 0, max: 4 }, // ✅ FIXED: was max:3, now max:4 (4 severity levels)
}, { _id: false });

const lifestyleAnswerSchema = new mongoose.Schema({
  id:       { type: String },                              // ✅ ADDED: frontend sends id field
  question: { type: String, required: true },
  answer:   { type: String, required: true },
}, { _id: false });

const rapidFireSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  ageGroup:         { type: String, required: true },
  symptomAnswers:   [symptomAnswerSchema],
  lifestyleAnswers: [lifestyleAnswerSchema],
  baseScore:        { type: Number, required: true },
  combinationBonus: { type: Number, default: 0 },
  ageMultiplier:    { type: Number, default: 1.0 },
  finalScore:       { type: Number, required: true },
  confidencePct:    { type: Number, required: true },
  detectedSymptoms: [{ type: String }],
  zone:             { type: String, enum: ["healthy", "mild", "moderate", "high"], required: true },
  recommendations:  [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model("RapidFire", rapidFireSchema);