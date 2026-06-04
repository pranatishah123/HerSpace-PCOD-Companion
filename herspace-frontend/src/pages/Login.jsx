import React, { useEffect, useRef, useState } from "react";
import bg from "../assets/bg.jpg";

export default function Login({ onLoginSuccess, onLoginFail, onGoSignup }) {
  const [form, setForm]       = useState({ email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaReady, setCaptchaReady] = useState(false);
  const captchaRef = useRef(null);
  const widgetIdRef = useRef(null);
  const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "YOUR_TURNSTILE_SITE_KEY";

  useEffect(() => {
    if (!captchaRef.current) return;

    const renderTurnstile = () => {
      if (!window.turnstile || !captchaRef.current) return;
      if (widgetIdRef.current !== null) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }

      widgetIdRef.current = window.turnstile.render(captchaRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token) => {
          setCaptchaToken(token);
          setError("");
        },
        "expired-callback": () => {
          setCaptchaToken("");
        },
        "error-callback": () => {
          setCaptchaToken("");
          setError("Captcha failed. Please retry.");
        },
      });
      setCaptchaReady(true);
    };

    if (window.turnstile) {
      renderTurnstile();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = renderTurnstile;
    document.head.appendChild(script);

    return () => {
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [TURNSTILE_SITE_KEY]);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      setError("Please fill in all fields! 🌸");
      return;
    }
    if (TURNSTILE_SITE_KEY === "YOUR_TURNSTILE_SITE_KEY") {
      setError("Captcha is not configured yet. Add VITE_TURNSTILE_SITE_KEY.");
      return;
    }
    if (!captchaToken) {
      setError("Please complete captcha verification.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ allows cookie to be saved from backend
        body: JSON.stringify({ email: form.email, password: form.password, captchaToken }),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ Cookie is automatically saved by browser — no localStorage needed!
        onLoginSuccess();
      } else {
        if (window.turnstile && widgetIdRef.current !== null) {
          window.turnstile.reset(widgetIdRef.current);
        }
        setCaptchaToken("");
        // ❌ Wrong details → show error → back to Home
        setError(data.message || "Wrong email or password!");
        setTimeout(() => {
          onLoginFail();
        }, 2000);
      }

    } catch {
      if (window.turnstile && widgetIdRef.current !== null) {
        window.turnstile.reset(widgetIdRef.current);
      }
      setCaptchaToken("");
      setError("Cannot connect to server. Is backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.root}>
      <div style={S.overlay} />
      <div style={S.card}>
        <div style={S.header}>
          <div style={S.emoji}>💕</div>
          <h2 style={S.title}>Welcome Back!</h2>
          <p style={S.sub}>Continue your wellness journey 🌸</p>
        </div>
        <div style={S.field}>
          <label style={S.label}>Email Address</label>
          <input name="email" value={form.email} onChange={handle}
            placeholder="you@example.com" type="email" style={S.input} />
        </div>
        <div style={S.field}>
          <label style={S.label}>Password</label>
          <input name="password" value={form.password} onChange={handle}
            placeholder="Your password" type="password" style={S.input} />
        </div>
        <div style={S.captchaWrap}>
          <label style={S.label}>Human Verification</label>
          <div ref={captchaRef} style={S.captchaBox} />
        </div>

        {error && <p style={S.errorMsg}>{error}</p>}

        <button onClick={handleLogin} style={S.primaryBtn} disabled={loading || !captchaToken || !captchaReady}>
          {loading ? "Checking... ⏳" : "Login & Continue 🌸"}
        </button>
        <p style={S.switchText}>
          New here?{" "}
          <span onClick={onGoSignup} style={S.link}>Create account</span>
        </p>
      </div>
    </div>
  );
}

const S = {
  root: {
    minHeight: "100vh", backgroundImage: `url(${bg})`,
    backgroundSize: "cover", backgroundPosition: "center",
    backgroundAttachment: "fixed", display: "flex",
    alignItems: "center", justifyContent: "center",
    fontFamily: "'Segoe UI', sans-serif", position: "relative",
  },
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(255,220,220,0.55)",
    backdropFilter: "blur(10px)", zIndex: 0,
  },
  card: {
    position: "relative", zIndex: 2,
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(20px)", borderRadius: "32px",
    padding: "40px 36px", maxWidth: "440px", width: "90%",
    boxShadow: "0 20px 60px rgba(205,44,88,0.2)",
    border: "1px solid rgba(255,255,255,0.9)",
  },
  header: { textAlign: "center", marginBottom: "28px" },
  emoji: { fontSize: "48px", marginBottom: "8px" },
  title: { fontSize: "26px", fontWeight: "900", color: "#1a1a2e", margin: "0 0 6px" },
  sub: { fontSize: "14px", color: "#888", margin: 0 },
  field: { marginBottom: "16px" },
  label: { display: "block", fontSize: "13px", fontWeight: "600", color: "#555", marginBottom: "6px" },
  input: {
    width: "100%", padding: "12px 16px",
    border: "1.5px solid rgba(205,44,88,0.2)", borderRadius: "12px",
    fontSize: "14px", outline: "none",
    background: "rgba(255,255,255,0.7)", boxSizing: "border-box",
  },
  captchaWrap: { marginTop: "6px", marginBottom: "8px" },
  captchaBox: {
    minHeight: "66px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  errorMsg: {
    background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.3)",
    borderRadius: "10px", padding: "10px 14px",
    color: "#c0392b", fontSize: "13px", fontWeight: "600",
    marginBottom: "10px", textAlign: "center",
  },
  primaryBtn: {
    width: "100%", padding: "14px", border: "none",
    borderRadius: "16px", marginTop: "8px",
    background: "linear-gradient(135deg, #E06C9F, #CD2C58)",
    color: "white", fontWeight: "700", fontSize: "15px",
    cursor: "pointer", boxShadow: "0 6px 20px rgba(205,44,88,0.35)",
  },
  switchText: { textAlign: "center", fontSize: "13px", color: "#888", marginTop: "16px" },
  link: { color: "#CD2C58", fontWeight: "700", cursor: "pointer" },
};