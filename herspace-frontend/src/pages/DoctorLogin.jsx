import React, { useState } from "react";

const DEMO_EMAIL = "doctor@herspace.com";
const DEMO_PASSWORD = "doctor123";

export default function DoctorLogin({ onLoginSuccess, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (email.trim().toLowerCase() === DEMO_EMAIL && password.trim() === DEMO_PASSWORD) {
      window.localStorage.setItem("doctorAuth", "true");
      window.localStorage.setItem("herspaceRole", "doctor");
      document.cookie = "herspaceDoctorAuth=true; Max-Age=604800; path=/; SameSite=Lax";
      setError("");
      onLoginSuccess?.();
      return;
    }
    setError("Invalid demo doctor credentials.");
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"28px 18px",fontFamily:"'DM Sans',sans-serif",background:"linear-gradient(160deg,#ffecef,#fff8fb 48%,#f7edf7)"}}>
      <div style={{width:"100%",maxWidth:"440px",background:"rgba(255,255,255,0.82)",border:"1px solid rgba(176,77,120,0.16)",borderRadius:"22px",boxShadow:"0 18px 60px rgba(176,77,120,0.16)",padding:"26px 28px"}}>
        {onBack && (
          <button type="button" onClick={onBack} style={{border:"none",background:"rgba(176,77,120,0.08)",color:"#8f2f5f",borderRadius:"10px",padding:"8px 12px",fontWeight:"800",fontSize:"12px",cursor:"pointer",marginBottom:"18px"}}>
            Back
          </button>
        )}

        <div style={{fontSize:"11px",fontWeight:"900",letterSpacing:"2.4px",color:"rgba(43,21,54,0.38)",marginBottom:"8px"}}>
          VERIFIED ACCESS DEMO
        </div>
        <h1 style={{margin:"0 0 6px",fontFamily:"'Playfair Display',serif",fontSize:"30px",color:"#2b1536"}}>
          Doctor Login
        </h1>
        <p style={{margin:"0 0 20px",fontSize:"13px",lineHeight:1.7,color:"rgba(43,21,54,0.58)",fontWeight:"600"}}>
          Doctor dashboard is for consultation preparation only. Final clinical decisions remain with verified medical professionals.
        </p>

        <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:"14px"}}>
          <label style={{display:"flex",flexDirection:"column",gap:"6px",fontSize:"12px",fontWeight:"800",color:"#6f3156"}}>
            Email:
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              type="email"
              placeholder="doctor@herspace.com"
              style={{padding:"12px 13px",border:"1.5px solid rgba(176,77,120,0.18)",borderRadius:"12px",fontSize:"14px",outline:"none",background:"rgba(255,255,255,0.8)",color:"#2b1536"}}
            />
          </label>
          <label style={{display:"flex",flexDirection:"column",gap:"6px",fontSize:"12px",fontWeight:"800",color:"#6f3156"}}>
            Password:
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              type="password"
              placeholder="doctor123"
              style={{padding:"12px 13px",border:"1.5px solid rgba(176,77,120,0.18)",borderRadius:"12px",fontSize:"14px",outline:"none",background:"rgba(255,255,255,0.8)",color:"#2b1536"}}
            />
          </label>

          {error && (
            <div style={{fontSize:"12px",fontWeight:"700",color:"#9f2f53",background:"rgba(159,47,83,0.08)",border:"1px solid rgba(159,47,83,0.14)",borderRadius:"12px",padding:"10px 12px"}}>
              {error}
            </div>
          )}

          <button type="submit" style={{marginTop:"2px",border:"none",borderRadius:"14px",padding:"12px 16px",fontSize:"14px",fontWeight:"900",cursor:"pointer",color:"#fff",background:"linear-gradient(135deg,#b04d78,#8f2f5f)",boxShadow:"0 8px 24px rgba(176,77,120,0.24)"}}>
            Login
          </button>
        </form>

        <div style={{marginTop:"18px",padding:"12px 14px",borderRadius:"14px",background:"rgba(176,77,120,0.07)",border:"1px solid rgba(176,77,120,0.12)",fontSize:"11px",lineHeight:1.7,color:"rgba(43,21,54,0.54)",fontWeight:"700"}}>
          <div>Demo credentials: doctor@herspace.com / doctor123</div>
          <div style={{marginTop:"6px"}}>For the hackathon prototype, doctor access is protected with a demo login. In production, this would use verified doctor onboarding, role-based access control, and patient consent-based sharing.</div>
        </div>
      </div>
    </div>
  );
}
