const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },

    // ✅ Onboarding flags — prevents repeating setup screens
    hasCompletedAbout:     { type: Boolean, default: false },
    hasCompletedRapidFire: { type: Boolean, default: false },

    // ✅ Account lockout — blocks after 3 failed login attempts
    loginAttempts: { type: Number,  default: 0     },
    isLocked:      { type: Boolean, default: false  },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);