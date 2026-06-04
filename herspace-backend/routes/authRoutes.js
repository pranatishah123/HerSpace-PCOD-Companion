const express = require("express");
const router  = express.Router();
const { signup, login, logout, me } = require("../controllers/authController");

// ── PUBLIC ROUTES (no auth needed) ───────────────────────────────────────────
router.post("/signup", signup);   // create account
router.post("/login",  login);    // login → sets cookie
router.post("/logout", logout);   // logout → clears cookie
router.get("/me",      me);       // check if logged in (called on every app load)

module.exports = router;