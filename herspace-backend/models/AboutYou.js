const mongoose = require("mongoose");

const aboutYouSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one profile per user
    },
    name:        { type: String, required: true, trim: true },
    ageGroup:    { type: String, required: true }, // teen / young / adult / hormonal
    lifeStage:   { type: String, required: true },
    supportType: { type: [String], default: [] },  // array e.g. ["Structure", "Energy Boost"]
    sleep:       { type: String, required: true },
    stress:      { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AboutYou", aboutYouSchema);