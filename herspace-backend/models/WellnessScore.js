const mongoose = require("mongoose");

const WellnessScoreSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    // Final composite score 0–100
    score: { type: Number, default: 0 },

    // Component scores (each 0–100)
    components: {
      zoneScore:        { type: Number, default: 0 }, // 35% weight — PCOD risk
      cycleScore:       { type: Number, default: 0 }, // 30% weight — cycle health
      consistencyScore: { type: Number, default: 0 }, // 25% weight — habit consistency
      skinScore:        { type: Number, default: 0 }, // 10% weight — skin health
    },

    // Raw inputs used to calculate (for transparency)
    inputs: {
      zone:             { type: String },
      stabilityTrend:   { type: String },
      cycleRegularity:  { type: String },
      cycleLength:      { type: Number },
      miniCheckinScore: { type: Number },
      daysSinceMini:    { type: Number },
      skinCondition:    { type: String },
      totalScans:       { type: Number },
    },

    // History of past scores
    history: [
      {
        score:      { type: Number },
        components: {
          zoneScore:        Number,
          cycleScore:       Number,
          consistencyScore: Number,
          skinScore:        Number,
        },
        recordedAt: { type: Date, default: Date.now },
      },
    ],

    lastCalculatedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WellnessScore", WellnessScoreSchema);