import React, { useState } from "react";
import bg from "../assets/bg.jpg";

export default function Signup({ onSignupSuccess, onGoLogin }) {
  const [form, setForm]       = useState({ name: "", email: "", password: "" });
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // ✅ NEW: toggle visibility

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const hasLength = form.password.length >= 8;
  const hasUpper  = /[A-Z]/.test(form.password);
  const hasNumber = /[0-9]/.test(form.password);
  const hasSpecial = /[^A-Za-z0-9]/.test(form.password);
  const strengthScore = [hasLength, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthLabel = form.password.length > 0 ? ["", "Weak", "Fair", "Good", "Strong"][strengthScore] : "";
  const pwRules = [
    { label: "At least 8 characters", met: hasLength },
    { label: "One uppercase letter", met: hasUpper },
    { label: "One number", met: hasNumber },
  ];

  const handleSignup = async () => {
    if (!form.name || !form.email || !form.password) {
      setError("Please fill in all fields! 🌸");
      return;
    }
    if (!form.email.includes("@")) {
      setError("Please enter a valid email! 📧");
      return;
    }
    if (!hasLength || !hasUpper || !hasNumber) {
      setError("Use 8+ chars with one uppercase and one number. 🔒");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSignupSuccess();
        }, 1500);
      } else {
        setError(data.message || "Signup failed. Try again!");
      }

    } catch {
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
          <div style={S.emoji}>🌸</div>
          <h2 style={S.title}>Join HerSpace</h2>
          <p style={S.sub}>Your wellness journey starts here 💕</p>
        </div>
        <div style={S.field}>
          <label style={S.label}>Your Name</label>
          <input name="name" value={form.name} onChange={handle}
            placeholder="e.g. Priya Sharma" style={S.input} />
        </div>
        <div style={S.field}>
          <label style={S.label}>Email Address</label>
          <input name="email" value={form.email} onChange={handle}
            placeholder="you@example.com" type="email" style={S.input} />
        </div>

        {/* ✅ NEW: password field with show/hide toggle + strength checklist */}
        <div style={S.field}>
          <label style={S.label}>Password</label>
          <div style={S.pwWrap}>
            <input
              name="password"
              value={form.password}
              onChange={handle}
              placeholder="Use 8+ chars, uppercase, number"
              type={showPassword ? "text" : "password"}
              style={{ ...S.input, paddingRight: "42px" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={S.eyeBtn}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
          {form.password.length > 0 && (
            <div style={S.strengthRow}>
              {[0, 1, 2, 3].map((i) => {
                let barStyle = S.sbar;
                if (i < strengthScore) {
                  if (strengthScore === 1) barStyle = { ...S.sbar, ...S.s1 };
                  else if (strengthScore === 2) barStyle = { ...S.sbar, ...S.s2 };
                  else if (strengthScore === 3) barStyle = { ...S.sbar, ...S.s3 };
                  else barStyle = { ...S.sbar, ...S.s4 };
                }
                return <div key={i} style={barStyle} />;
              })}
              <span style={S.slabel}>{strengthLabel}</span>
            </div>
          )}

          {/* Strength checklist — only visible when user has started typing */}
          {form.password.length > 0 && (
            <div style={S.pwChecklist}>
              {pwRules.map((rule) => (
                <div key={rule.label} style={S.pwRow}>
                  <div style={{
                    ...S.pwDot,
                    background: rule.met
                      ? "linear-gradient(135deg,#E06C9F,#CD2C58)"
                      : "transparent",
                    borderColor: rule.met ? "#CD2C58" : "rgba(205,44,88,0.35)",
                  }}>
                    {rule.met && <span style={S.pwTick}>✓</span>}
                  </div>
                  <span style={{
                    ...S.pwLabel,
                    color: rule.met ? "#CD2C58" : "#999",
                    fontWeight: rule.met ? "700" : "500",
                  }}>
                    {rule.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {error   && <p style={S.errorMsg}>{error}</p>}
        {success && <p style={S.successMsg}>Account created! Taking you to login... ✅</p>}

        <button onClick={handleSignup} style={S.primaryBtn} disabled={loading || success}>
          {loading ? "Creating... ⏳" : "Create Account 🚀"}
        </button>
        <p style={S.switchText}>
          Already have an account?{" "}
          <span onClick={onGoLogin} style={S.link}>Login here</span>
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
  // ✅ NEW styles — only these were added
  pwWrap: {
    position: "relative", display: "flex", alignItems: "center",
  },
  eyeBtn: {
    position: "absolute", right: "12px",
    background: "none", border: "none",
    cursor: "pointer", fontSize: "16px",
    padding: "4px", lineHeight: 1,
    color: "#aaa",
  },
  pwChecklist: {
    marginTop: "10px",
    background: "rgba(255,240,245,0.7)",
    border: "1px solid rgba(205,44,88,0.15)",
    borderRadius: "12px",
    padding: "10px 14px",
    display: "flex", flexDirection: "column", gap: "7px",
  },
  pwRow: {
    display: "flex", alignItems: "center", gap: "10px",
  },
  pwDot: {
    width: "18px", height: "18px", borderRadius: "50%",
    border: "1.5px solid rgba(205,44,88,0.35)",
    flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.2s ease",
  },
  pwTick: {
    fontSize: "10px", color: "#fff", fontWeight: "900", lineHeight: 1,
  },
  pwLabel: {
    fontSize: "12.5px", transition: "all 0.2s ease",
  },
  strengthRow: {
    display: "flex",
    gap: "4px",
    alignItems: "center",
    marginTop: "8px",
  },
  sbar: {
    height: "3px",
    flex: 1,
    borderRadius: "2px",
    background: "rgba(148,163,184,0.22)",
    transition: "background 0.3s",
  },
  s1: { background: "#ef4444" },
  s2: { background: "#f59e0b" },
  s3: { background: "#10b981" },
  s4: { background: "#22d3ee" },
  slabel: {
    fontSize: "11px",
    color: "#666",
    minWidth: "44px",
    textAlign: "right",
    fontWeight: "700",
  },
  // end of new styles — rest unchanged
  errorMsg: {
    background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.3)",
    borderRadius: "10px", padding: "10px 14px",
    color: "#c0392b", fontSize: "13px", fontWeight: "600",
    marginBottom: "10px", textAlign: "center",
  },
  successMsg: {
    background: "rgba(100,200,100,0.1)", border: "1px solid rgba(100,200,100,0.4)",
    borderRadius: "10px", padding: "10px 14px",
    color: "#27ae60", fontSize: "13px", fontWeight: "600",
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