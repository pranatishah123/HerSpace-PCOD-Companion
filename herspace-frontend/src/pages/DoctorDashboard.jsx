import React, { useEffect, useMemo, useState } from "react";

const API = "http://localhost:5000/api";
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const BERRY_BG = "/@fs/C:/Users/BHARAT S SHAH/.cursor/projects/c-Users-BHARAT-S-SHAH-herspace-frontend/assets/c__Users_BHARAT_S_SHAH_AppData_Roaming_Cursor_User_workspaceStorage_b863f0322bfffd5a39f017174614a988_images_WhatsApp_Image_2026-04-16_at_21.03.30-24281b9f-47e2-42be-abad-1bae861e30f1.png";

const ZONE_LABEL_BY_KEY = {
  mild: "Support Sensitivity",
  moderate: "Build Consistency",
  high: "Maintain & Optimize",
  healthy: "Stabilize & Recover",
};

const ZONE_COLOR = {
  mild: "#4a7fc1",
  moderate: "#b565a7",
  high: "#c45e8a",
  healthy: "#5b9e8a",
};

const AI_MODELS = [
  "google/gemma-3-12b-it:free",
  "mistralai/mistral-7b-instruct:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "google/gemma-3-4b-it:free",
];

async function generateAISummary(patient) {
  const zone = patient?.current?.zone || patient?.zoneDisplayName || "mild";
  const score = patient?.current?.finalScore ?? 0;
  const maxScore = patient?.current?.maxScore ?? 120;
  const symptoms = (patient?.current?.detectedSymptoms || []).join(", ") || "none";
  const stability = patient?.actionPlan?.stabilityScore || "Stable";
  const patterns = (patient?.patterns || []).map((p) => p.title).join(", ") || "none";
  const miniCheckin = patient?.miniCheckin;
  const miniSummary = miniCheckin
    ? `Energy: ${miniCheckin.energy || "?"}, Symptoms: ${miniCheckin.symptoms || "?"}, Skin: ${miniCheckin.skin || "?"}, Stress: ${miniCheckin.stress || "?"}, Overall: ${miniCheckin.overall || "?"}`
    : "No mini check-in data";
  const historyCount = (patient?.history || []).length;
  const highRiskEvents = (patient?.riskEvents || []).filter((e) => e.level === "high").length;

  const prompt = `You are a clinical wellness AI assistant helping a gynecologist prepare for a PCOD patient consultation.

Patient Data:
- Zone: ${zone} (${ZONE_LABEL_BY_KEY[zone] || zone})
- Risk Score: ${score}/${maxScore}
- Trend Stability: ${stability}
- Detected Symptoms: ${symptoms}
- Detected Patterns: ${patterns}
- Mini Check-in: ${miniSummary}
- Total Assessments: ${historyCount + 1}
- High-Risk Events: ${highRiskEvents}

Write a concise clinical consultation prep note (3-4 sentences) that:
1. Summarizes the patient's current PCOD risk picture
2. Highlights the most concerning patterns
3. Suggests what the doctor should focus on in the consultation

Be clinical but warm. No diagnosis. Return ONLY a plain paragraph, no JSON, no bullet points.`;

  for (const model of AI_MODELS) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_KEY}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "HerSpace Doctor Dashboard",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 300,
          temperature: 0.6,
        }),
      });
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (text && text.length > 20) return text;
    } catch {}
  }
  return null;
}

function buildFallbackSummary(patient) {
  const zone = patient?.current?.zone || "mild";
  const score = patient?.current?.finalScore ?? 0;
  const maxScore = patient?.current?.maxScore ?? 120;
  const symptoms = patient?.current?.detectedSymptoms || [];
  const stability = patient?.actionPlan?.stabilityScore || "Stable";
  const highRisk = (patient?.riskEvents || []).filter((e) => e.level === "high").length;

  const zoneNote = {
    high: "Patient is in the high-risk Maintain & Optimize zone, indicating significant hormonal stress requiring prompt clinical attention.",
    moderate: "Patient is in the moderate Build Consistency zone with multiple active PCOD indicators that warrant structured medical guidance.",
    mild: "Patient shows early Support Sensitivity patterns with mild hormonal stress signals that can benefit from preventive care.",
    healthy: "Patient is in the Stabilize & Recover zone with good hormonal health, but continued monitoring is recommended.",
  };

  return `${zoneNote[zone] || zoneNote.mild} Risk score is ${score}/${maxScore} with stability trend: ${stability}. ${symptoms.length > 0 ? `Key symptoms reported: ${symptoms.slice(0, 3).join(", ")}.` : "No major symptoms flagged."} ${highRisk >= 2 ? "Multiple high-risk events detected — priority consultation recommended." : "Routine follow-up suggested based on current trajectory."}`;
}

function buildPatientSummary(reqItem) {
  const current = reqItem?.current || reqItem?.latestRapidFire || {};
  const plan = reqItem?.actionPlan || {};
  const symptoms = current?.detectedSymptoms || [];
  return {
    zone: current?.zone || "mild",
    zoneLabel: reqItem?.zoneDisplayName || ZONE_LABEL_BY_KEY[current?.zone] || current?.zone || "—",
    score: current?.finalScore ?? 0,
    maxScore: current?.maxScore ?? 120,
    confidencePct: current?.confidencePct ?? 0,
    symptoms: Array.isArray(symptoms) ? symptoms : [],
    pattern: Array.isArray(reqItem?.patterns) && reqItem.patterns.length
      ? `${reqItem.patterns.length} patterns detected`
      : current?.createdAt ? "Latest data available" : "Zone snapshot",
    stability: plan?.stabilityScore || "Stable",
    actionPlan: {
      diet: plan?.diet || [],
      movement: plan?.movement || [],
      selfCare: plan?.selfCare || [],
    },
    historyCount: (reqItem?.history || []).length,
    highRiskEvents: (reqItem?.riskEvents || []).filter((e) => e.level === "high").length,
    doctorRequested: reqItem?.doctorRequest?.triggered || false,
  };
}

function PatientCard({ reqItem, idx }) {
  const summary = buildPatientSummary(reqItem);
  const zoneColor = ZONE_COLOR[summary.zone] || "#b04d78";
  const [aiNote, setAiNote] = useState(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let alive = true;
    setAiLoading(true);
    generateAISummary(reqItem)
      .then((text) => {
        if (alive) setAiNote(text || buildFallbackSummary(reqItem));
      })
      .catch(() => {
        if (alive) setAiNote(buildFallbackSummary(reqItem));
      })
      .finally(() => {
        if (alive) setAiLoading(false);
      });
    return () => { alive = false; };
  }, [reqItem]);

  return (
    <div
      className="doctor-fade"
      style={{
        background: "rgba(255,255,255,0.88)",
        borderRadius: "20px",
        padding: "22px 24px",
        border: `1.5px solid ${zoneColor}22`,
        boxShadow: `0 6px 28px rgba(0,0,0,0.07), 0 0 0 1px ${zoneColor}11`,
        marginBottom: "0",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: `linear-gradient(135deg,${zoneColor},${zoneColor}99)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
            👩‍⚕️
          </div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "900", color: "#2b1536" }}>
              {reqItem?.name || reqItem?.email || `Patient ${idx + 1}`}
            </div>
            <div style={{ fontSize: "11px", color: "rgba(0,0,0,0.4)", fontWeight: "600", marginTop: "1px" }}>
              ID: {String(reqItem?.userId || "—").slice(-8)}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {summary.doctorRequested && (
            <div style={{ fontSize: "11px", fontWeight: "800", color: "#c45e8a", background: "rgba(196,94,138,0.1)", border: "1px solid rgba(196,94,138,0.2)", borderRadius: "20px", padding: "4px 10px" }}>
              🔔 Consult Requested
            </div>
          )}
          <div style={{ fontSize: "12px", fontWeight: "800", color: zoneColor, background: `${zoneColor}14`, border: `1px solid ${zoneColor}30`, borderRadius: "20px", padding: "4px 12px" }}>
            {summary.zoneLabel}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "14px" }}>
        {[
          { label: "Risk Score", value: `${summary.score}/${summary.maxScore}`, color: zoneColor },
          { label: "Confidence", value: `${summary.confidencePct}%`, color: "#667eea" },
          { label: "Assessments", value: `${summary.historyCount + 1}`, color: "#5b9e8a" },
          { label: "High-Risk Events", value: `${summary.highRiskEvents}`, color: summary.highRiskEvents >= 2 ? "#c45e8a" : "#888" },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "rgba(0,0,0,0.03)", borderRadius: "10px", padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: "900", color: stat.color, lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: "10px", fontWeight: "700", color: "rgba(0,0,0,0.4)", marginTop: "3px" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* AI Clinical Note */}
      <div style={{ background: `linear-gradient(135deg,${zoneColor}0d,${zoneColor}06)`, border: `1px solid ${zoneColor}22`, borderRadius: "14px", padding: "14px 16px", marginBottom: "14px" }}>
        <div style={{ fontSize: "10px", fontWeight: "900", color: zoneColor, letterSpacing: "2px", marginBottom: "6px" }}>
          🧠 AI CLINICAL CONSULTATION NOTE
        </div>
        {aiLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ fontSize: "16px", animation: "spin 1.5s linear infinite" }}>🌸</div>
            <span style={{ fontSize: "12px", color: "rgba(0,0,0,0.4)", fontWeight: "600" }}>Generating clinical summary…</span>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: "13px", color: "rgba(0,0,0,0.7)", lineHeight: 1.75, fontWeight: "500", fontStyle: "italic" }}>
            {aiNote}
          </p>
        )}
      </div>

      {/* Symptoms */}
      {summary.symptoms.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", fontWeight: "900", color: "rgba(0,0,0,0.38)", letterSpacing: "2px", marginBottom: "8px" }}>DETECTED SYMPTOMS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {summary.symptoms.map((sym) => (
              <span key={sym} style={{ fontSize: "11px", fontWeight: "700", color: zoneColor, background: `${zoneColor}12`, border: `1px solid ${zoneColor}25`, borderRadius: "20px", padding: "3px 10px" }}>
                {sym.replace(/([A-Z])/g, " $1").trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expand/collapse for action plan + patterns */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{ background: "none", border: `1px solid rgba(0,0,0,0.1)`, borderRadius: "10px", padding: "7px 14px", fontSize: "12px", fontWeight: "700", color: "rgba(0,0,0,0.5)", cursor: "pointer", marginBottom: expanded ? "12px" : "0" }}
      >
        {expanded ? "▲ Hide Details" : "▼ Show Action Plan & Patterns"}
      </button>

      {expanded && (
        <>
          {/* Action plan */}
          {(summary.actionPlan.diet.length > 0 || summary.actionPlan.movement.length > 0 || summary.actionPlan.selfCare.length > 0) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
              {[
                { title: "🥗 Diet", items: summary.actionPlan.diet },
                { title: "🏃 Movement", items: summary.actionPlan.movement },
                { title: "🧘 Self-Care", items: summary.actionPlan.selfCare },
              ].map((block) => (
                <div key={block.title} style={{ background: `${zoneColor}08`, border: `1px solid ${zoneColor}18`, borderRadius: "10px", padding: "10px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "900", color: zoneColor, marginBottom: "6px" }}>{block.title}</div>
                  <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.6)", lineHeight: 1.6 }}>
                    {block.items.length ? block.items.slice(0, 3).join(" · ") : "No data"}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Patterns */}
          {Array.isArray(reqItem?.patterns) && reqItem.patterns.length > 0 && (
            <div>
              <div style={{ fontSize: "10px", fontWeight: "900", color: "rgba(0,0,0,0.38)", letterSpacing: "2px", marginBottom: "8px" }}>CLINICAL PATTERNS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {reqItem.patterns.map((p, pi) => (
                  <div key={pi} style={{ display: "flex", alignItems: "flex-start", gap: "10px", background: `${zoneColor}07`, border: `1px solid ${zoneColor}15`, borderRadius: "10px", padding: "10px 12px" }}>
                    <span style={{ fontSize: "15px", flexShrink: 0 }}>{p.icon}</span>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: "800", color: zoneColor, marginBottom: "2px" }}>{p.title}</div>
                      <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.58)", lineHeight: 1.55 }}>{p.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: "12px", fontSize: "10px", color: "rgba(0,0,0,0.35)", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "10px" }}>
        AI-generated consultation prep. Final clinical decision remains with the doctor.
      </div>
    </div>
  );
}

export default function DoctorDashboard({ onBack, fallbackPatient }) {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalRequests: 0 });
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setAuthError("");
        const res = await fetch(`${API}/doctor/requests`, { credentials: "include" });
        let data = null;
        try { data = await res.json(); } catch {}

        if (!res.ok) {
          setAuthError(res.status === 401 ? "You're not authorized. Please log in again." : `Failed to load (HTTP ${res.status}).`);
          if (fallbackPatient) { setRequests([fallbackPatient]); setStats({ totalUsers: 1, totalRequests: 1 }); }
          return;
        }

        const fetched = Array.isArray(data?.requests) ? data.requests : [];
        setRequests(fetched);
        const consultsRequested = fetched.filter((r) => r?.doctorRequest?.triggered).length;
        setStats({ totalUsers: fetched.length, totalRequests: consultsRequested });
      } catch (err) {
        console.error("Doctor dashboard fetch error:", err);
        if (fallbackPatient) { setRequests([fallbackPatient]); setStats({ totalUsers: 1, totalRequests: 1 }); }
      } finally {
        setLoading(false);
      }
    })();
  }, [fallbackPatient]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5eefa", fontFamily: "'Nunito', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "10px", animation: "spin 2s linear infinite" }}>👩‍⚕️</div>
          <div style={{ fontWeight: "800", color: "#6d46a2" }}>Loading patient data...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "28px 20px", fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: `url(${BERRY_BG})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(16px) brightness(1.08) saturate(0.95)", transform: "scale(1.08)", zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "fixed", inset: 0, background: "linear-gradient(160deg,rgba(255,236,240,0.83),rgba(255,245,250,0.8),rgba(255,240,236,0.82))", zIndex: 1, pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: "8%", left: "8%", width: "340px", height: "340px", background: "rgba(245,120,150,0.18)", filter: "blur(85px)", borderRadius: "50%", zIndex: 1, pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "8%", right: "8%", width: "300px", height: "300px", background: "rgba(196,94,138,0.15)", filter: "blur(75px)", borderRadius: "50%", zIndex: 1, pointerEvents: "none" }} />

      <style>{`
        @keyframes fadeUpDoctor{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .doctor-fade{animation:fadeUpDoctor 0.45s cubic-bezier(0.22,1,0.36,1) both;}
      `}</style>

      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

          {/* Top bar */}
          <div className="doctor-fade" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", gap: "12px", flexWrap: "wrap" }}>
            <button onClick={onBack} style={{ border: "none", borderRadius: "12px", padding: "9px 14px", fontWeight: "800", cursor: "pointer", color: "#7a2b53", background: "rgba(255,255,255,0.7)" }}>← Back</button>
            <div style={{ fontSize: "11px", color: "rgba(0,0,0,0.42)", fontWeight: "900", letterSpacing: "2.5px" }}>DOCTOR DASHBOARD</div>
          </div>

          {/* Header card */}
          <div className="doctor-fade" style={{ background: "rgba(255,255,255,0.62)", backdropFilter: "blur(24px)", borderRadius: "22px", border: "1px solid rgba(255,255,255,0.88)", padding: "24px 26px", marginBottom: "16px", boxShadow: "0 8px 34px rgba(181,101,167,0.12)" }}>
            <div style={{ fontSize: "10px", color: "rgba(0,0,0,0.34)", fontWeight: "900", letterSpacing: "2.4px", marginBottom: "6px" }}>AI-ASSISTED CONSULTATION PREP</div>
            <h1 style={{ margin: "0 0 6px", fontFamily: "'Playfair Display', serif", fontSize: "30px", color: "#2b1536" }}>
              Doctor <span style={{ color: "#b04d78" }}>Review Center</span>
            </h1>
            <p style={{ margin: 0, fontSize: "13px", color: "rgba(0,0,0,0.57)", lineHeight: 1.7 }}>
              All registered patients with wellness data are shown below. AI generates a consultation prep note for each patient using their zone, symptoms, and history.
            </p>
          </div>

          {/* Stats */}
          <div className="doctor-fade" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            {[
              { label: "TOTAL PATIENTS", value: stats.totalUsers, color: "#8f2f5f" },
              { label: "CONSULT REQUESTS", value: stats.totalRequests, color: "#2f8f73" },
              { label: "AI ROLE", value: "Prep notes only — no diagnosis", color: "#555", isText: true },
            ].map((s) => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.72)", borderRadius: "16px", padding: "16px", border: "1px solid rgba(255,255,255,0.92)", boxShadow: "0 4px 18px rgba(176,77,120,0.1)" }}>
                <div style={{ fontSize: "11px", color: "rgba(0,0,0,0.42)", fontWeight: "800", marginBottom: "6px" }}>{s.label}</div>
                {s.isText
                  ? <div style={{ fontSize: "13px", fontWeight: "700", color: s.color }}>{s.value}</div>
                  : <div style={{ fontSize: "30px", fontWeight: "900", color: s.color }}>{s.value}</div>
                }
              </div>
            ))}
          </div>

          {/* Patient cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {authError && (
              <div style={{ background: "rgba(255,255,255,0.78)", borderRadius: "14px", padding: "16px 18px", color: "#8f2f5f", border: "1px solid rgba(176,77,120,0.22)" }}>
                <div style={{ fontWeight: 900, marginBottom: "6px" }}>Cannot load dashboard</div>
                <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.62)", lineHeight: 1.6 }}>{authError}</div>
              </div>
            )}
            {requests.length === 0 && !authError && (
              <div style={{ background: "rgba(255,255,255,0.72)", borderRadius: "14px", padding: "24px", textAlign: "center", color: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.9)" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>🌸</div>
                <div style={{ fontWeight: "700" }}>No patient data found yet.</div>
                <div style={{ fontSize: "12px", marginTop: "4px" }}>Patients will appear here once they complete a zone assessment.</div>
              </div>
            )}
            {requests.map((reqItem, idx) => (
              <PatientCard key={reqItem?.userId || idx} reqItem={reqItem} idx={idx} />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}