const User   = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const axios  = require("axios");

// ── COOKIE OPTIONS ────────────────────────────────────────────────────────────
const isProduction = process.env.NODE_ENV === "production";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  // Cross-site cookies require "none" + secure=true in production.
  sameSite: isProduction ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const MAX_LOGIN_ATTEMPTS = 3;           // lock after 3 failed attempts
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function shouldSkipCaptcha() {
  return process.env.SKIP_CAPTCHA === "true";
}

const verifyTurnstileToken = async ({ token, ip }) => {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    throw new Error("TURNSTILE_SECRET_KEY is not configured");
  }
  const body = new URLSearchParams({
    secret,
    response: token,
  });

  if (ip) {
    body.append("remoteip", ip);
  }

  const response = await axios.post(TURNSTILE_VERIFY_URL, body.toString(), {
    validateStatus: () => true,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (response.status < 200 || response.status >= 300) {
    console.error("Turnstile verify failed with status:", response.status);
    return { success: false };
  }

  return { success: Boolean(response.data?.success) };
};
async function validateCaptcha({ captchaToken, req }) {
  if (shouldSkipCaptcha()) return null;
  if (!captchaToken) return "Please complete captcha verification.";

  const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress;
  const captcha = await verifyTurnstileToken({ token: captchaToken, ip: clientIp });
  return captcha.success ? null : "Captcha verification failed. Please try again.";
}

// ── SIGNUP ────────────────────────────────────────────────────────────────────
const signup = async (req, res) => {
  try {
    const { name, email, password, captchaToken } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Please fill in all fields!" });

    const captchaError = await validateCaptcha({ captchaToken, req });
    if (captchaError) {
      return res.status(400).json({ message: captchaError });
    }

    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters!" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered. Please login!" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "Account created! Please login." });

  } catch (error) {
    console.error("Signup error:", error.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password, captchaToken } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Please fill in all fields!" });

    const captchaError = await validateCaptcha({ captchaToken, req });
    if (captchaError) {
      return res.status(400).json({ message: captchaError });
    }

    const user = await User.findOne({ email });

    // ✅ User not found — generic message (don't reveal if email exists)
    if (!user)
      return res.status(401).json({ message: "Wrong email or password!" });

    // ✅ Account locked — block immediately before checking password
    if (user.isLocked)
      return res.status(403).json({
        message: "Your account has been locked after 3 failed attempts. Please contact support.",
        isLocked: true,
      });

    // ✅ Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      const newAttempts = user.loginAttempts + 1;

      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        // 🔒 3rd wrong attempt — lock the account now
        await User.findByIdAndUpdate(user._id, {
          loginAttempts: newAttempts,
          isLocked: true,
        });
        return res.status(403).json({
          message: "Your account has been locked after 3 failed attempts. Please contact support.",
          isLocked: true,
        });
      }

      // ⚠️ Wrong but not locked yet — increment and warn
      await User.findByIdAndUpdate(user._id, { loginAttempts: newAttempts });
      const attemptsLeft = MAX_LOGIN_ATTEMPTS - newAttempts;
      return res.status(401).json({
        message: `Wrong password! ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining before account is locked.`,
        attemptsLeft,
      });
    }

    // ✅ Correct password — reset failed attempts
    await User.findByIdAndUpdate(user._id, {
      loginAttempts: 0,
      isLocked: false,
    });

    const token = jwt.sign(
      { id: user._id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(200).json({
      message: "Login successful!",
      user: {
        id:                    user._id,
        name:                  user.name,
        email:                 user.email,
        hasCompletedAbout:     user.hasCompletedAbout,
        hasCompletedRapidFire: user.hasCompletedRapidFire,
      },
    });

  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Login failed due to a server configuration error. Please try again." });
  }
};

// ── LOGOUT ────────────────────────────────────────────────────────────────────
const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });
  res.status(200).json({ message: "Logged out successfully." });
  };

// ── ME ────────────────────────────────────────────────────────────────────────
const me = async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token)
      return res.status(401).json({ message: "Not authenticated." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user)
      return res.status(401).json({ message: "User not found." });

    res.status(200).json({
      id:                    user._id,
      name:                  user.name,
      email:                 user.email,
      hasCompletedAbout:     user.hasCompletedAbout,
      hasCompletedRapidFire: user.hasCompletedRapidFire,
    });

  } catch (error) {
    res.status(401).json({ message: "Session expired. Please login again." });
  }
};

module.exports = { signup, login, logout, me };
