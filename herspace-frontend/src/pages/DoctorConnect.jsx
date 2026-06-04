import React from "react";
const BERRY_BG = "/@fs/C:/Users/BHARAT S SHAH/.cursor/projects/c-Users-BHARAT-S-SHAH-herspace-frontend/assets/c__Users_BHARAT_S_SHAH_AppData_Roaming_Cursor_User_workspaceStorage_b863f0322bfffd5a39f017174614a988_images_WhatsApp_Image_2026-04-16_at_21.03.30-24281b9f-47e2-42be-abad-1bae861e30f1.png";

export default function DoctorConnect({ onBack, onOpenDoctorDashboard }) {
  const doctor = {
    name: "Lata Singh",
    qualification: "MBBS, MD (Obstetrics & Gynecology)",
    experience: "12+ years",
    mobile: "7045754607",
    speciality: "PCOS/PCOD, hormonal wellness, menstrual health",
    intro:
      "I support women with PCOD through evidence-based treatment, practical lifestyle guidance, and compassionate follow-up care.",
  };

  return (
    <div style={{ minHeight: "100vh", padding: "28px 20px", fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: `url(${BERRY_BG})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(16px) brightness(1.08) saturate(0.95)", transform: "scale(1.08)", zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "fixed", inset: 0, background: "linear-gradient(160deg,rgba(255,236,240,0.83),rgba(255,245,250,0.8),rgba(255,240,236,0.82))", zIndex: 1, pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 2 }}>
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", gap: "12px", flexWrap: "wrap" }}>
          <button onClick={onBack} style={{ border: "none", borderRadius: "12px", padding: "9px 14px", fontWeight: "800", cursor: "pointer", color: "#5a3090" }}>
            ← Back
          </button>
          <div style={{ fontSize: "11px", color: "rgba(0,0,0,0.4)", fontWeight: "800", letterSpacing: "2px" }}>DOCTOR INTEGRATION</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.75)", borderRadius: "20px", padding: "24px", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 8px 32px rgba(0,0,0,0.07)" }}>
          <h1 style={{ margin: "0 0 8px", fontSize: "30px", color: "#1a1a2e", fontFamily: "'Playfair Display', serif" }}>
            Connect with Doctor 👩‍⚕️
          </h1>
          <p style={{ margin: "0 0 18px", color: "rgba(0,0,0,0.6)", lineHeight: 1.7 }}>
            Share your zone summary and key patterns with a doctor to get personalized guidance.
          </p>

          <div style={{ background: "linear-gradient(135deg,rgba(181,101,167,0.12),rgba(124,92,191,0.1))", border: "1px solid rgba(124,92,191,0.18)", borderRadius: "16px", padding: "16px 18px", marginBottom: "16px" }}>
            <div style={{ fontSize: "19px", fontWeight: "900", color: "#4d2b72", marginBottom: "6px" }}>{doctor.name}</div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#5a3090", marginBottom: "10px" }}>{doctor.qualification}</div>
            <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.65)", lineHeight: 1.7 }}>{doctor.intro}</div>
            <div style={{ marginTop: "10px", fontSize: "13px", color: "rgba(0,0,0,0.7)", fontWeight: "600" }}>
              Experience: {doctor.experience} | Mobile: {doctor.mobile}
            </div>
            <div style={{ marginTop: "4px", fontSize: "12px", color: "rgba(0,0,0,0.5)" }}>Speciality: {doctor.speciality}</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.75)", borderRadius: "14px", border: "1px solid rgba(0,0,0,0.08)", padding: "14px 16px", marginBottom: "18px" }}>
            <div style={{ fontSize: "11px", fontWeight: "900", letterSpacing: "2px", color: "rgba(0,0,0,0.35)", marginBottom: "8px" }}>IMPORTANT</div>
            <ul style={{ margin: 0, paddingLeft: "18px", color: "rgba(0,0,0,0.62)", lineHeight: 1.7, fontSize: "13px" }}>
              <li>AI summary is for consultation preparation, not diagnosis.</li>
              <li>System supports doctors and encourages human-in-the-loop care.</li>
              <li>Doctor receives zone, pattern history, and action-plan context quickly.</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (typeof onOpenDoctorDashboard === "function") onOpenDoctorDashboard();
            }}
            style={{ border: "none", borderRadius: "14px", padding: "12px 18px", fontWeight: "800", cursor: "pointer", background: "linear-gradient(135deg,#25D366,#128C7E)", color: "#fff" }}
          >
            Open Doctor Dashboard →
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

