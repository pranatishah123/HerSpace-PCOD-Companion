import React, { useState, useEffect, useMemo } from "react";
import floralBg from "../assets/viewprofile.png";
import {
  RiskScoreLineChart,
  WellnessDoughnutChart,
  FeatureCompletionBarChart,
  ZoneIndexLineChart,
} from "../components/profile/ProfileCharts";

const API = "http://localhost:5000/api";

const ZONE_LABELS = {
  healthy: "Stabilize & Recover",
  mild: "Support Sensitivity",
  moderate: "Build Consistency",
  high: "Maintain & Optimize",
};

const ZONE_EMOJI = {
  healthy: "🟢",
  mild: "🟡",
  moderate: "🟠",
  high: "🔴",
};

const ZONE_ORDER = { healthy: 0, mild: 1, moderate: 2, high: 3 };

function formatShortDate(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return null;
  }
}

function normalizeTrackerHistory(tracker) {
  if (!tracker) return [];
  if (Array.isArray(tracker.history)) return [...tracker.history];
  if (tracker.history && typeof tracker.history === "object") return Object.values(tracker.history);
  return [];
}

function FlipCard({ front, back }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      style={{ perspective: "800px", cursor: "pointer", height: "100%", minHeight: "160px" }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          minHeight: "160px",
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 0.5s cubic-bezier(0.4,0.2,0.2,1)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            background: "rgba(255,255,255,0.72)",
            borderRadius: "18px",
            padding: "18px 20px",
            border: "1px solid rgba(100,160,240,0.2)",
            boxShadow: "0 3px 16px rgba(80,120,200,0.1)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {front}
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "linear-gradient(135deg,rgba(180,210,255,0.85),rgba(200,225,255,0.9))",
            borderRadius: "18px",
            padding: "18px 20px",
            border: "1px solid rgba(100,160,240,0.3)",
            boxShadow: "0 3px 16px rgba(80,120,200,0.15)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {back}
        </div>
      </div>
    </div>
  );
}

function StatFlip({ emoji, label, val, sub, c, backText }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div onMouseEnter={() => setFlipped(true)} onMouseLeave={() => setFlipped(false)} style={{ perspective: "800px", cursor: "pointer" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          minHeight: "140px",
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 0.5s cubic-bezier(0.4,0.2,0.2,1)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            background: "rgba(255,255,255,0.72)",
            borderRadius: "20px",
            padding: "22px 12px",
            border: "1px solid rgba(100,160,240,0.2)",
            boxShadow: "0 3px 16px rgba(80,120,200,0.1)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: "30px", marginBottom: "8px" }}>{emoji}</div>
          <div style={{ fontSize: "28px", fontWeight: "900", color: c, fontFamily: "'Nunito',sans-serif", lineHeight: 1 }}>{val}</div>
          <div style={{ fontSize: "11px", color: "#1a2a4a", fontWeight: "700", marginTop: "5px", opacity: 0.7 }}>{label}</div>
          {sub && (
            <div style={{ marginTop: "8px", fontSize: "11px", fontWeight: "800", color: c, background: `${c}18`, padding: "3px 10px", borderRadius: "20px", border: `1px solid ${c}33` }}>{sub}</div>
          )}
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "linear-gradient(135deg,rgba(180,210,255,0.88),rgba(205,228,255,0.92))",
            borderRadius: "20px",
            padding: "18px 14px",
            border: "1px solid rgba(100,160,240,0.3)",
            boxShadow: "0 3px 16px rgba(80,120,200,0.12)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <div style={{ fontSize: "22px" }}>{emoji}</div>
          <div style={{ fontSize: "13px", fontWeight: "900", color: "#0d2050", fontFamily: "'Nunito',sans-serif" }}>{label}</div>
          <div style={{ fontSize: "12px", color: "#1a3060", lineHeight: 1.6, fontWeight: "600" }}>{backText}</div>
        </div>
      </div>
    </div>
  );
}

function ZoneFlipCard({ zoneKey, zoneLabel }) {
  const [flipped, setFlipped] = useState(false);
  const emoji = ZONE_EMOJI[zoneKey] || "🌸";
  return (
    <div onMouseEnter={() => setFlipped(true)} onMouseLeave={() => setFlipped(false)} style={{ perspective: "900px", cursor: "pointer", minHeight: "160px" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          minHeight: "160px",
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 0.55s cubic-bezier(0.4,0.2,0.2,1)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            background: "linear-gradient(135deg,rgba(160,200,255,0.45),rgba(190,220,255,0.38))",
            borderRadius: "20px",
            padding: "20px 22px",
            border: "1.5px solid rgba(100,155,230,0.3)",
            boxShadow: "0 3px 16px rgba(80,130,220,0.12)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: "900", color: "#0d2050", fontFamily: "'Nunito',sans-serif", marginBottom: "14px", letterSpacing: "0.2px" }}>
            🌸 Your PCOD wellness zone <span style={{ fontSize: "10px", color: "#4a6aaa", fontWeight: "600", marginLeft: "6px", fontStyle: "italic" }}>↔ hover</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div style={{ fontSize: "44px", filter: "drop-shadow(0 4px 8px rgba(100,150,230,0.3))" }}>{emoji}</div>
            <div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "20px", fontWeight: "900", color: "#0d2050", marginBottom: "6px" }}>{zoneLabel}</div>
              <p style={{ fontSize: "12.5px", color: "#1a3060", lineHeight: 1.7, margin: 0, fontWeight: "500", opacity: 0.85 }}>Recommendations and check-ins are aligned to this zone.</p>
            </div>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "linear-gradient(135deg,rgba(100,155,240,0.5),rgba(140,190,255,0.45))",
            borderRadius: "20px",
            padding: "20px 24px",
            border: "1.5px solid rgba(80,140,230,0.35)",
            boxShadow: "0 3px 16px rgba(60,120,220,0.18)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          <div style={{ fontSize: "14px", fontWeight: "900", color: "#0a1e40", fontFamily: "'Nunito',sans-serif" }}>💡 What this means</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {["🎯 Goals aligned to your zone", "📅 Weekly mini check-ins", "🌿 Lifestyle plan updates", "👩‍⚕️ Doctor connect when needed"].map((tip, i) => (
              <div key={i} style={{ fontSize: "12.5px", color: "#0d2a50", fontWeight: "700", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: "6px" }}>
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Petals() {
  const items = [
    { top: "4%", left: "4%", size: 32, delay: "0s", dur: "6s", type: "flower" },
    { top: "12%", left: "87%", size: 26, delay: "1.2s", dur: "8s", type: "petal" },
    { top: "28%", left: "2%", size: 20, delay: "2s", dur: "7s", type: "flower" },
    { top: "42%", left: "93%", size: 28, delay: "0.6s", dur: "9s", type: "petal" },
    { top: "60%", left: "6%", size: 22, delay: "3s", dur: "7s", type: "flower" },
    { top: "74%", left: "88%", size: 30, delay: "1.8s", dur: "8s", type: "petal" },
  ];
  return (
    <>
      {items.map((p, i) => (
        <div
          key={i}
          style={{
            position: "fixed",
            top: p.top,
            left: p.left,
            zIndex: 2,
            pointerEvents: "none",
            fontSize: `${p.size}px`,
            opacity: 0.18,
            animation: `petalFloat ${p.dur} ${p.delay} ease-in-out infinite alternate`,
            filter: "hue-rotate(180deg) saturate(1.8)",
          }}
        >
          {p.type === "flower" ? "🌸" : "🌺"}
        </div>
      ))}
    </>
  );
}

function buildRiskSeries(tracker) {
  const h = normalizeTrackerHistory(tracker);
  const chronological = [...h].sort((a, b) => {
    const aDate = new Date(a.createdAt || a.date || a.timestamp || a.at);
    const bDate = new Date(b.createdAt || b.date || b.timestamp || b.at);
    return aDate - bDate;
  });
  const labels = [];
  const scores = [];
  chronological.forEach((snap, i) => {
    const d = snap.createdAt || snap.date || snap.timestamp || snap.at;
    labels.push(d ? formatShortDate(d) || `Check ${i + 1}` : `Check ${i + 1}`);
    scores.push(snap.finalScore ?? snap.score ?? 0);
  });
  if (tracker?.current?.zone) {
    labels.push("Latest");
    scores.push(tracker.current.finalScore ?? 0);
  }
  return { labels, scores };
}

function buildZoneSeries(tracker) {
  const h = normalizeTrackerHistory(tracker);
  const chronological = [...h].sort((a, b) => {
    const aDate = new Date(a.createdAt || a.date || a.timestamp);
    const bDate = new Date(b.createdAt || b.date || b.timestamp);
    return aDate - bDate;
  });
  const labels = [];
  const zoneIndices = [];
  chronological.forEach((snap, i) => {
    const z = snap.zone || "mild";
    const d = snap.createdAt || snap.date || snap.timestamp;
    labels.push(d ? formatShortDate(d) || `A${i + 1}` : `A${i + 1}`);
    zoneIndices.push(ZONE_ORDER[z] ?? 1);
  });
  if (tracker?.current?.zone) {
    labels.push("Latest");
    zoneIndices.push(ZONE_ORDER[tracker.current.zone] ?? 1);
  }
  return { labels, zoneIndices };
}

function buildHistoryTimeline({ profile, zonesPayload, periodPayload, skinPayload, completeness }) {
  const rows = [];
  const tracker = zonesPayload?.tracker;
  const zoneKey = tracker?.current?.zone;
  const profileSaved = !!profile?.name && !!profile?.ageGroup;
  const zoneSaved = !!zoneKey;
  const hist = normalizeTrackerHistory(tracker);

  if (profileSaved) {
    rows.push({
      date: formatShortDate(profile.updatedAt) || "—",
      event: "About You profile saved",
      icon: "📋",
    });
  }
  if (zoneSaved) {
    rows.push({
      date: formatShortDate(tracker?.current?.updatedAt) || "Latest",
      event: `PCOD zone: ${ZONE_LABELS[zoneKey] || zoneKey} (score ${tracker?.current?.finalScore ?? "—"})`,
      icon: ZONE_EMOJI[zoneKey] || "🌸",
    });
  }
  hist.forEach((snap, i) => {
    const d = snap.createdAt || snap.date || snap.timestamp;
    rows.push({
      date: formatShortDate(d) || `Past ${i + 1}`,
      event: `Earlier assessment · ${ZONE_LABELS[snap.zone] || snap.zone} · score ${snap.finalScore ?? "—"}`,
      icon: "📊",
    });
  });
  if (completeness?.periodDone) {
    rows.push({
      date: "—",
      event: "Period tracking active",
      icon: "🗓️",
    });
  }
  if (completeness?.skinDone) {
    const n = skinPayload?.entries?.length || 0;
    rows.push({
      date: "—",
      event: `Skin analyzer · ${n} scan${n === 1 ? "" : "s"} logged`,
      icon: "🔬",
    });
  }
  return rows.slice(0, 12);
}

export default function ViewProfile({ onBack, userData }) {
  const [tab, setTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [aboutPayload, setAboutPayload] = useState(null);
  const [zonesPayload, setZonesPayload] = useState(null);
  const [periodPayload, setPeriodPayload] = useState(null);
  const [skinPayload, setSkinPayload] = useState(null);
  const [wellnessPayload, setWellnessPayload] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [a, z, p, s, w] = await Promise.allSettled([
          fetch(`${API}/about/me`, { credentials: "include" }),
          fetch(`${API}/zones/me`, { credentials: "include" }),
          fetch(`${API}/period/me`, { credentials: "include" }),
          fetch(`${API}/skin/history`, { credentials: "include" }),
          fetch(`${API}/wellness/score`, { credentials: "include" }),
        ]);

        const parse = async (res) => (res.ok ? res.json() : null);
        if (!cancelled && a.status === "fulfilled" && a.value.ok) setAboutPayload(await parse(a.value));
        if (!cancelled && z.status === "fulfilled" && z.value.ok) setZonesPayload(await parse(z.value));
        if (!cancelled && p.status === "fulfilled" && p.value.ok) setPeriodPayload(await parse(p.value));
        if (!cancelled && s.status === "fulfilled" && s.value.ok) setSkinPayload(await parse(s.value));
        if (!cancelled && w.status === "fulfilled" && w.value.ok) setWellnessPayload(await parse(w.value));
      } catch (e) {
        console.error("ViewProfile load:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const profile = aboutPayload?.profile || userData || {};
  const name = profile?.name || "Wellness User";
  const ageGroup = profile?.ageGroup ?? userData?.ageGroup ?? { label: "—", range: "" };
  const ageLabel =
    typeof ageGroup === "object" && ageGroup?.label != null
      ? ageGroup.label
      : typeof ageGroup === "string"
        ? ageGroup
        : "—";
  const ageRange = typeof ageGroup === "object" && ageGroup?.range != null ? ageGroup.range : "";

  const tracker = zonesPayload?.tracker;
  const zoneKey = tracker?.current?.zone || null;
  const zoneLabel = zoneKey ? ZONE_LABELS[zoneKey] || zoneKey : "Not available";

  const completeness = useMemo(() => {
    const aboutDone = aboutPayload?.hasProfile === true || (!!profile?.name && !!profile?.ageGroup);
    const zonesDone = !!tracker?.current?.zone;
    const periodDone = periodPayload?.hasTracker === true;
    const skinDone = (skinPayload?.entries?.length || 0) > 0;
    return { aboutDone, zonesDone, periodDone, skinDone };
  }, [aboutPayload, zonesPayload, periodPayload, skinPayload, tracker, profile]);

  const assessments = useMemo(() => {
    return [
      {
        name: "About You",
        date: completeness.aboutDone ? formatShortDate(profile?.updatedAt) || "Completed" : "Pending",
        done: completeness.aboutDone,
        icon: "📋",
        back: "Your personal details, life stage and preferences power personalised guidance.",
      },
      {
        name: "RapidFire / Zone",
        date: completeness.zonesDone ? formatShortDate(tracker?.current?.updatedAt) || "Completed" : "Pending",
        done: completeness.zonesDone,
        icon: "⚡",
        back: "Symptom + lifestyle answers set your PCOD risk zone and action plan.",
      },
      {
        name: "Period Tracker",
        date: completeness.periodDone ? "Active" : "Pending",
        done: completeness.periodDone,
        icon: "🗓️",
        back: "Cycle data improves phase-aware tips and wellness scoring.",
      },
      {
        name: "Skin Analyzer",
        date: completeness.skinDone ? `${skinPayload?.entries?.length || 0} scan(s)` : "Pending",
        done: completeness.skinDone,
        icon: "🔬",
        back: "Skin logs add context to your hormonal wellness picture.",
      },
    ];
  }, [completeness, profile, tracker, skinPayload]);

  const historyRows = useMemo(
    () =>
      buildHistoryTimeline({
        profile,
        zonesPayload,
        periodPayload,
        skinPayload,
        completeness,
      }),
    [profile, zonesPayload, periodPayload, skinPayload, completeness]
  );

  const riskSeries = useMemo(() => buildRiskSeries(tracker), [tracker]);
  const zoneSeries = useMemo(() => buildZoneSeries(tracker), [tracker]);

  const wellnessScore = wellnessPayload?.success ? wellnessPayload.score ?? 0 : null;
  const scoreComponents = wellnessPayload?.components || {};
  const stability = tracker?.actionPlan?.stabilityScore || "—";
  const totalAssessments = (tracker?.history?.length || 0) + (tracker?.current?.zone ? 1 : 0);

  if (loading) {
    return (
      <div style={{ ...S.root, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={S.bg} />
        <div style={S.overlay} />
        <div style={{ position: "relative", zIndex: 4, textAlign: "center", fontFamily: "'Nunito',sans-serif" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🌸</div>
          <div style={{ color: "#0a1830", fontWeight: "800" }}>Loading your profile…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.root}>
      <div style={S.bg} />
      <div style={S.overlay} />
      <Petals />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600;700&family=Nunito:wght@600;700;800;900&display=swap');
        @keyframes up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes petalFloat { 0%{transform:translateY(0px) scale(1) rotate(0deg)} 50%{transform:translateY(-14px) scale(1.08) rotate(8deg)} 100%{transform:translateY(-22px) scale(0.95) rotate(-6deg)} }
        .aup { animation: up 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .thov:hover { background:rgba(100,140,220,0.15)!important; }
        .bbtn:hover { opacity:0.75; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:rgba(100,140,220,0.25); border-radius:10px; }
      `}</style>

      <div style={S.page}>
        <div style={S.sidebar}>
          <button type="button" onClick={onBack} className="bbtn" style={S.back}>
            ← Back
          </button>

          <div style={{ textAlign: "center", padding: "24px 0 20px" }}>
            <div style={S.av}>{name[0]?.toUpperCase() || "?"}</div>
            <div style={S.sname}>{name}</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: "11.5px", color: "#2a3a5a", opacity: 0.55, marginTop: "3px" }}>Your Wellness Space</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "9px", padding: "0 2px" }}>
            <div style={S.sbox}>
              <div style={S.slabel}>Age Group</div>
              <div style={S.sval}>{ageLabel}</div>
              {ageRange ? <div style={{ fontSize: "11px", color: "#2a3a5a", fontWeight: "600", opacity: 0.55 }}>{ageRange}</div> : null}
            </div>
            <div style={{ ...S.sbox, background: "rgba(180,210,255,0.45)", border: "1.5px solid rgba(100,155,230,0.3)" }}>
              <div style={S.slabel}>Current zone</div>
              <div style={{ ...S.sval, fontSize: "12.5px" }}>
                {ZONE_EMOJI[zoneKey]} {zoneLabel}
              </div>
            </div>
          </div>

          <div style={{ marginTop: "22px", display: "flex", flexDirection: "column", gap: "4px" }}>
            {[
              { id: "profile", e: "👤", l: "Profile & tracks" },
              { id: "progress", e: "📈", l: "Charts & history" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                className="thov"
                onClick={() => setTab(t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "11px 13px",
                  borderRadius: "13px",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Nunito',sans-serif",
                  fontSize: "13px",
                  textAlign: "left",
                  transition: "all 0.18s ease",
                  background: tab === t.id ? "rgba(100,145,230,0.2)" : "transparent",
                  borderLeft: tab === t.id ? "3px solid #5a8ee0" : "3px solid transparent",
                  color: tab === t.id ? "#0d1e40" : "#2a3a5a",
                  fontWeight: tab === t.id ? "900" : "700",
                  opacity: tab === t.id ? 1 : 0.6,
                }}
              >
                <span style={{ fontSize: "17px" }}>{t.e}</span> {t.l}
              </button>
            ))}
          </div>

          <div style={{ marginTop: "auto", paddingTop: "24px" }}>
            <div style={{ fontSize: "10px", fontWeight: "900", color: "#2a3a5a", opacity: 0.45, fontFamily: "'Nunito',sans-serif", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: "10px" }}>Live stats</div>
            {[
              { l: "Wellness score", v: wellnessScore != null ? `${Math.round(wellnessScore)}` : "—", c: "#1a6a40" },
              { l: "Risk score", v: tracker?.current?.finalScore != null ? `${tracker.current.finalScore}` : "—", c: "#5a4a10" },
              { l: "Stability", v: typeof stability === "string" ? stability : "—", c: "#6a1a4a" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid rgba(100,140,220,0.12)" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#2a3a5a", opacity: 0.65 }}>{s.l}</span>
                <span style={{ fontSize: "13px", fontWeight: "900", color: s.c, fontFamily: "'Nunito',sans-serif", maxWidth: "52%", textAlign: "right" }}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={S.main}>
          <div style={S.topstrip}>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "22px", fontWeight: "900", color: "#0a1830", margin: 0 }}>{tab === "profile" ? "👤 My profile & tracks" : "📈 Charts & zone history"}</h2>
              <p style={{ fontSize: "12px", color: "#2a3a5a", margin: "3px 0 0", fontWeight: "600", opacity: 0.6 }}>{tab === "profile" ? "Your tasks, zone, and timeline" : "Chart.js trends + your journey"}</p>
            </div>
            <div style={S.avSm}>{name[0]?.toUpperCase() || "?"}</div>
          </div>

          <div key={tab} className="aup" style={S.scroll}>
            {tab === "profile" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={S.card}>
                  <div style={S.ctitle}>👤 Personal info</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginTop: "14px" }}>
                    {[
                      { l: "Name", v: name },
                      { l: "Age group", v: `${ageLabel}${ageRange ? ` (${ageRange})` : ""}` },
                      { l: "Zone", v: `${ZONE_EMOJI[zoneKey]} ${zoneLabel}` },
                    ].map((x, i) => (
                      <div key={i} style={S.ibox}>
                        <div style={S.ilabel}>{x.l}</div>
                        <div style={S.ival}>{x.v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={S.card}>
                  <div style={S.ctitle}>
                    ✅ Your tracks (features) <span style={{ fontSize: "11px", color: "#4a6aaa", fontWeight: "600", marginLeft: "8px", fontStyle: "italic" }}>↔ hover</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "12px", marginTop: "14px" }}>
                    {assessments.map((a, i) => (
                      <FlipCard
                        key={i}
                        front={
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "12px", padding: "6px 0" }}>
                            <span style={{ fontSize: "32px", lineHeight: 1 }}>{a.icon}</span>
                            <div>
                              <div style={{ fontSize: "15px", fontWeight: "900", color: "#0a1830", fontFamily: "'Nunito',sans-serif", marginBottom: "4px" }}>{a.name}</div>
                              <div style={{ fontSize: "11.5px", color: "#2a3a5a", opacity: 0.6, fontWeight: "600" }}>{a.date}</div>
                            </div>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: "800",
                                fontFamily: "'Nunito',sans-serif",
                                color: a.done ? "#186040" : "#2a3a8a",
                                background: a.done ? "rgba(40,160,100,0.12)" : "rgba(100,130,220,0.1)",
                                padding: "5px 14px",
                                borderRadius: "20px",
                                border: `1px solid ${a.done ? "rgba(40,160,100,0.25)" : "rgba(100,130,220,0.2)"}`,
                              }}
                            >
                              {a.done ? "✅ Done" : "⏳ Pending"}
                            </span>
                          </div>
                        }
                        back={
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "10px", padding: "6px 0" }}>
                            <div style={{ fontSize: "28px" }}>{a.icon}</div>
                            <div style={{ fontSize: "14px", fontWeight: "900", color: "#0d2050", fontFamily: "'Nunito',sans-serif" }}>{a.name}</div>
                            <div style={{ fontSize: "12.5px", color: "#1a3060", lineHeight: 1.75, fontWeight: "600" }}>{a.back}</div>
                          </div>
                        }
                      />
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <ZoneFlipCard zoneKey={zoneKey} zoneLabel={zoneLabel} />
                  <div style={S.card}>
                    <div style={S.ctitle}>🕐 Recent history</div>
                    <div style={{ position: "relative", marginTop: "16px" }}>
                      <div
                        style={{
                          position: "absolute",
                          left: "15px",
                          top: 0,
                          bottom: 0,
                          width: "2px",
                          background: "linear-gradient(180deg,rgba(90,130,220,0.45),rgba(90,130,220,0.03))",
                          borderRadius: "2px",
                        }}
                      />
                      {historyRows.length === 0 ? (
                        <div style={{ fontSize: "13px", color: "#2a3a5a", opacity: 0.7, paddingLeft: "48px" }}>Complete About You and assessments to build your timeline.</div>
                      ) : (
                        historyRows.map((h, i) => (
                          <div key={i} style={{ display: "flex", gap: "13px", paddingBottom: "14px", position: "relative" }}>
                            <div
                              style={{
                                width: "30px",
                                height: "30px",
                                borderRadius: "50%",
                                background: "rgba(100,145,230,0.12)",
                                border: "2px solid rgba(100,145,230,0.3)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                flexShrink: 0,
                                zIndex: 1,
                              }}
                            >
                              {h.icon}
                            </div>
                            <div style={{ paddingTop: "4px" }}>
                              <div style={{ fontSize: "12.5px", fontWeight: "800", color: "#0a1830", fontFamily: "'Nunito',sans-serif" }}>{h.event}</div>
                              <div style={{ fontSize: "10px", color: "#2a3a5a", opacity: 0.5, fontWeight: "600", marginTop: "1px" }}>{h.date}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === "progress" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" }}>
                  <StatFlip
                    emoji="💯"
                    label="Wellness score"
                    val={wellnessScore != null ? `${Math.round(wellnessScore)}` : "—"}
                    sub="/100"
                    c="#1a6a40"
                    backText={wellnessPayload?.success ? "Composite score from zone, cycle, habits, and skin — same as your personalised dashboard." : "Complete more features to unlock the full wellness score."}
                  />
                  <StatFlip
                    emoji="📊"
                    label="Risk score"
                    val={tracker?.current?.finalScore != null ? `${tracker.current.finalScore}` : "—"}
                    sub={`/${tracker?.current?.maxScore ?? 120}`}
                    c="#5a4a10"
                    backText="Latest PCOD risk score from your RapidFire / zone assessment."
                  />
                  <StatFlip
                    emoji="📋"
                    label="Assessments"
                    val={`${totalAssessments}`}
                    sub="total"
                    c="#3a2a80"
                    backText="Includes your current zone plus saved history snapshots from the server."
                  />
                  <StatFlip
                    emoji="➡️"
                    label="Stability"
                    val={typeof stability === "string" ? stability : "—"}
                    sub="trend"
                    c="#6a1a4a"
                    backText={tracker?.actionPlan?.insight || "Stability reflects recent mini check-ins vs earlier zone data."}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={S.card}>
                    <div style={S.ctitle}>📈 Risk score over time (Chart.js)</div>
                    {riskSeries.labels.length ? (
                      <RiskScoreLineChart labels={riskSeries.labels} scores={riskSeries.scores} />
                    ) : (
                      <p style={{ fontSize: "13px", color: "#2a3a5a", opacity: 0.75, marginTop: "12px" }}>Complete a zone assessment to see your score trend.</p>
                    )}
                  </div>
                  <div style={S.card}>
                    <div style={S.ctitle}>🎯 Zone level trend</div>
                    {zoneSeries.labels.length ? (
                      <ZoneIndexLineChart labels={zoneSeries.labels} zoneIndices={zoneSeries.zoneIndices} />
                    ) : (
                      <p style={{ fontSize: "13px", color: "#2a3a5a", opacity: 0.75, marginTop: "12px" }}>Your zone history will appear after assessments.</p>
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={S.card}>
                    <div style={S.ctitle}>✅ Feature completion</div>
                    <FeatureCompletionBarChart
                      aboutDone={completeness.aboutDone}
                      zonesDone={completeness.zonesDone}
                      periodDone={completeness.periodDone}
                      skinDone={completeness.skinDone}
                    />
                  </div>
                  <div style={S.card}>
                    <div style={S.ctitle}>🍩 Wellness mix (Chart.js)</div>
                    {wellnessPayload?.success && scoreComponents ? (
                      <WellnessDoughnutChart components={scoreComponents} />
                    ) : (
                      <p style={{ fontSize: "13px", color: "#2a3a5a", opacity: 0.75, marginTop: "12px" }}>Wellness score breakdown appears when the server returns `/wellness/score`.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  root: { height: "100vh", fontFamily: "'DM Sans',sans-serif", position: "relative", overflow: "hidden" },
  bg: {
    position: "fixed",
    inset: 0,
    zIndex: 0,
    backgroundImage: `url(${floralBg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: "blur(24px) brightness(0.25) saturate(0.8)",
    transform: "scale(1.1)",
    pointerEvents: "none",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1,
    background: "linear-gradient(155deg,rgba(185,200,235,0.88) 0%,rgba(175,195,230,0.86) 50%,rgba(190,205,240,0.88) 100%)",
    pointerEvents: "none",
  },
  page: { position: "relative", zIndex: 3, height: "100vh", display: "flex" },
  sidebar: {
    width: "255px",
    flexShrink: 0,
    height: "100vh",
    padding: "22px 16px",
    boxSizing: "border-box",
    background: "rgba(210,225,250,0.55)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderRight: "1px solid rgba(130,165,230,0.2)",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
  },
  back: {
    background: "rgba(255,255,255,0.45)",
    border: "1px solid rgba(130,165,230,0.3)",
    color: "#0a1830",
    fontSize: "12px",
    fontWeight: "700",
    padding: "8px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontFamily: "'Nunito',sans-serif",
    transition: "opacity 0.18s",
    display: "inline-block",
  },
  av: {
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#5a80d8,#7aa0f0,#4a70c8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    fontWeight: "900",
    color: "#fff",
    margin: "0 auto 12px",
    fontFamily: "'Nunito',sans-serif",
    boxShadow: "0 6px 22px rgba(80,110,200,0.35)",
    border: "3px solid rgba(160,185,240,0.5)",
  },
  sname: { fontFamily: "'Playfair Display',serif", fontSize: "16px", fontWeight: "900", color: "#0a1830", textAlign: "center" },
  sbox: { background: "rgba(255,255,255,0.5)", borderRadius: "13px", padding: "11px 13px", border: "1px solid rgba(130,165,230,0.2)" },
  slabel: { fontSize: "10px", fontWeight: "700", color: "#2a3a5a", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.6px", fontFamily: "'Nunito',sans-serif", marginBottom: "4px" },
  sval: { fontSize: "14px", fontWeight: "900", color: "#0a1830", fontFamily: "'Nunito',sans-serif" },
  main: { flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" },
  topstrip: {
    padding: "16px 28px",
    background: "rgba(200,218,248,0.5)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(130,165,230,0.2)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexShrink: 0,
  },
  avSm: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#5a80d8,#7aa0f0)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "900",
    color: "#fff",
    fontFamily: "'Nunito',sans-serif",
    boxShadow: "0 3px 12px rgba(80,110,200,0.3)",
  },
  scroll: { flex: 1, overflowY: "auto", padding: "22px 28px 40px" },
  card: {
    background: "rgba(255,255,255,0.62)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderRadius: "20px",
    padding: "20px 22px",
    border: "1px solid rgba(130,165,230,0.22)",
    boxShadow: "0 3px 18px rgba(80,110,200,0.1)",
  },
  ctitle: { fontSize: "14px", fontWeight: "900", color: "#0d2050", fontFamily: "'Nunito',sans-serif" },
  ibox: { background: "rgba(180,210,255,0.38)", borderRadius: "12px", padding: "12px 14px", border: "1px solid rgba(130,165,230,0.2)" },
  ilabel: { fontSize: "10px", color: "#2a3a5a", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.6px", fontFamily: "'Nunito',sans-serif", marginBottom: "4px", opacity: 0.58 },
  ival: { fontSize: "15px", fontWeight: "800", color: "#0a1830", fontFamily: "'Nunito',sans-serif", lineHeight: 1.3 },
};
