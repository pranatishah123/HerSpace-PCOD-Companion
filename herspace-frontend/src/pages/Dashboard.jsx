import React, { useState, useEffect } from "react";
import sticker from "../assets/girl-sticker.png";
import dashBg from "../assets/dashboard.png";
import AboutYou from "./AboutYou";
import RapidFire from "./RapidFire";
import ViewProfile from "./ViewProfile";
import PeriodTracker from "./PeriodTracker";
import SkinAnalyzer from "./Skinanalyzer";
import PersonalizedDashboard from "./PersonalizedDashboard";
import ZoneReport from "./ZoneReport";
import DoctorConnect from "./DoctorConnect";
import DoctorDashboard from "./DoctorDashboard";

const API = "http://localhost:5000/api";

const ZONES = [
  {
    id: 0,
    icon: "🌸",
    label: "Build Consistency",
    tagline: "Rest, heal & restore balance",
    color: "#b565a7",
    light: "#d48fd0",
    bg: "linear-gradient(145deg, #f5d6f0, #e8b8e8, #d6c8f5)",
    backBg: "linear-gradient(145deg, #9b3d9b, #b565a7, #7c5cbf)",
    border: "rgba(181,101,167,0.5)",
    desc: "Your body is asking for gentle care. Prioritize deep rest, healing foods, and stress relief to restore hormonal balance.",
    tips: [
      { emoji: "😴", text: "Sleep 8+ hours nightly" },
      { emoji: "🥗", text: "Anti-inflammatory diet" },
      { emoji: "🚶‍♀️", text: "Gentle walks daily" },
    ],
    frontEmojis: ["🍃", "🧘‍♀️", "✨"],
  },
  {
    id: 1,
    icon: "💎",
    label: "Support Sensitivity",
    tagline: "Form habits that stick & thrive",
    color: "#4a7fc1",
    light: "#7ab3e8",
    bg: "linear-gradient(145deg, #cce8f8, #b8d8f5, #c8d8f8)",
    backBg: "linear-gradient(145deg, #2d5fa0, #4a7fc1, #5b8fd4)",
    border: "rgba(74,127,193,0.5)",
    desc: "You're on the right track! Build consistent habits around exercise, nutrition, and sleep to strengthen your hormonal health.",
    tips: [
      { emoji: "🏋️", text: "Exercise 3x per week" },
      { emoji: "🥙", text: "Meal prep on Sundays" },
      { emoji: "📅", text: "Track your cycle" },
    ],
    frontEmojis: ["💙", "⭐", "💫"],
  },
  {
    id: 2,
    icon: "🌺",
    label: "Maintain & Optimize",
    tagline: "Nurture with calm & care",
    color: "#c45e8a",
    light: "#e88ab8",
    bg: "linear-gradient(145deg, #fce0ee, #f8c8e0, #f0d0f0)",
    backBg: "linear-gradient(145deg, #a03868, #c45e8a, #d478a8)",
    border: "rgba(196,94,138,0.5)",
    desc: "Your system is sensitive right now. Embrace calming routines, nourishing food, and mindful stress management.",
    tips: [
      { emoji: "☀️", text: "Morning sunlight daily" },
      { emoji: "🥜", text: "Magnesium-rich foods" },
      { emoji: "📓", text: "Daily journaling" },
    ],
    frontEmojis: ["🌸", "💗", "🌙"],
  },
  {
    id: 3,
    icon: "✨",
    label: "Stabilize & Recover",
    tagline: "You're thriving — keep going!",
    color: "#5b9e8a",
    light: "#7dcbb8",
    bg: "linear-gradient(145deg, #c8f0e8, #b8e8e0, #c8e8f8)",
    backBg: "linear-gradient(145deg, #2d7a65, #5b9e8a, #4a8fa8)",
    border: "rgba(91,158,138,0.5)",
    desc: "You're thriving! Maintain your excellent habits and optimize further with advanced wellness practices and cycle syncing.",
    tips: [
      { emoji: "✅", text: "Continue current habits" },
      { emoji: "🌀", text: "Try cycle syncing" },
      { emoji: "🩺", text: "Annual checkups" },
    ],
    frontEmojis: ["💚", "🌟", "🦋"],
  },
];

const WELLNESS_TIPS = [
  { emoji: "🍵", tip: "Drink spearmint tea — it may help reduce androgens naturally." },
  { emoji: "🌞", tip: "10 min morning sunlight regulates cortisol & improves mood." },
  { emoji: "🥦", tip: "Cruciferous veggies support estrogen detox in the liver." },
  { emoji: "🧘‍♀️", tip: "Box breathing (4-4-4-4) reduces stress hormones quickly." },
];

const STARS = Array.from({ length: 55 }, (_, i) => ({
  id: i,
  size: 2 + (i * 1.7) % 5,
  top: (i * 13.3) % 98,
  left: (i * 11.7) % 98,
  delay: (i * 0.45) % 8,
  duration: 2.5 + (i * 0.6) % 4,
  type: i % 4,
}));

function SparkleStars() {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 2 }}>
      <style>{`
        @keyframes starTwinkle {
          0%, 100% { opacity: 0; transform: scale(0.3) rotate(0deg); }
          40%       { opacity: 1; transform: scale(1.2) rotate(20deg); }
          60%       { opacity: 0.8; transform: scale(1) rotate(-10deg); }
        }
        @keyframes starDrift {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33%       { transform: translateY(-12px) translateX(6px); }
          66%       { transform: translateY(6px) translateX(-8px); }
        }
        @keyframes bigSparkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          30%       { opacity: 0.9; transform: scale(1.4) rotate(45deg); }
          70%       { opacity: 0.6; transform: scale(1.1) rotate(90deg); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.1; transform: scale(0.5); }
          50%       { opacity: 0.7; transform: scale(1.3); }
        }
      `}</style>
      {STARS.map((s) => {
        if (s.type === 1) return (
          <div key={s.id} style={{ position:"absolute", top:`${s.top}%`, left:`${s.left}%`, fontSize:`${10+s.size*2}px`, animation:`bigSparkle ${s.duration+1}s ${s.delay}s ease-in-out infinite`, opacity:0 }}>✨</div>
        );
        if (s.type === 2) return (
          <div key={s.id} style={{ position:"absolute", top:`${s.top}%`, left:`${s.left}%`, fontSize:`${8+s.size}px`, animation:`starTwinkle ${s.duration}s ${s.delay}s ease-in-out infinite`, opacity:0 }}>⭐</div>
        );
        if (s.type === 3) return (
          <div key={s.id} style={{ position:"absolute", top:`${s.top}%`, left:`${s.left}%`, width:`${s.size+2}px`, height:`${s.size+2}px`, borderRadius:"50%", background:["rgba(181,101,167,0.9)","rgba(122,179,232,0.9)","rgba(91,158,138,0.9)","rgba(232,138,184,0.9)"][s.id%4], boxShadow:`0 0 ${s.size*3}px ${s.size*2}px ${["rgba(181,101,167,0.4)","rgba(122,179,232,0.4)","rgba(91,158,138,0.4)","rgba(232,138,184,0.4)"][s.id%4]}`, animation:`glowPulse ${s.duration}s ${s.delay}s ease-in-out infinite`, opacity:0 }} />
        );
        return (
          <div key={s.id} style={{ position:"absolute", top:`${s.top}%`, left:`${s.left}%`, width:`${s.size}px`, height:`${s.size}px`, borderRadius:"50%", background:"rgba(255,255,255,0.9)", boxShadow:`0 0 ${s.size*2}px rgba(255,255,255,0.8)`, animation:`starTwinkle ${s.duration}s ${s.delay}s ease-in-out infinite, starDrift ${s.duration*2}s ${s.delay}s ease-in-out infinite`, opacity:0 }} />
        );
      })}
    </div>
  );
}

function FlipZoneCard({ zone }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div style={{ width:"100%", height:"280px", perspective:"1200px", cursor:"pointer" }} onMouseEnter={() => setFlipped(true)} onMouseLeave={() => setFlipped(false)}>
      <div style={{ position:"relative", width:"100%", height:"100%", transformStyle:"preserve-3d", transition:"transform 0.7s cubic-bezier(0.4,0.2,0.2,1)", transform:flipped?"rotateY(180deg)":"rotateY(0deg)" }}>
        <div style={{ position:"absolute", inset:0, background:zone.bg, border:`2px solid ${zone.border}`, borderRadius:"22px", padding:"22px", backfaceVisibility:"hidden", WebkitBackfaceVisibility:"hidden", boxShadow:`0 8px 32px ${zone.border}, 0 2px 8px rgba(0,0,0,0.06)`, overflow:"hidden", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
          <div style={{ position:"absolute", inset:0, borderRadius:"22px", background:"linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)", pointerEvents:"none" }} />
          <div>
            <div style={{ fontSize:"12px", fontWeight:"900", color:zone.color, letterSpacing:"1px", marginBottom:"10px", fontFamily:"'Nunito', sans-serif" }}>{zone.label.toUpperCase()}</div>
            <div style={{ display:"flex", gap:"8px", marginBottom:"10px" }}>
              {zone.frontEmojis.map((e, i) => <span key={i} style={{ fontSize:"24px", filter:"drop-shadow(0 2px 6px rgba(0,0,0,0.15))" }}>{e}</span>)}
            </div>
            <div style={{ fontSize:"14px", color:zone.color, fontWeight:"700", lineHeight:1.4 }}>{zone.tagline}</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ fontSize:"36px", filter:`drop-shadow(0 4px 12px ${zone.border})` }}>{zone.icon}</div>
            <div style={{ fontSize:"11px", color:zone.color, fontWeight:"700", opacity:0.7, fontStyle:"italic" }}>Hover to flip →</div>
          </div>
        </div>
        <div style={{ position:"absolute", inset:0, background:zone.backBg, border:`2px solid ${zone.border}`, borderRadius:"22px", padding:"20px", backfaceVisibility:"hidden", WebkitBackfaceVisibility:"hidden", transform:"rotateY(180deg)", overflow:"hidden", boxShadow:`0 8px 32px ${zone.border}`, display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
          <div style={{ position:"absolute", inset:0, borderRadius:"22px", background:"linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 60%)", pointerEvents:"none" }} />
          <div>
            <div style={{ fontSize:"14px", fontWeight:"900", color:"#fff", marginBottom:"8px", fontFamily:"'Nunito', sans-serif" }}>{zone.icon} {zone.label}</div>
            <p style={{ fontSize:"12.5px", color:"rgba(255,255,255,0.95)", lineHeight:1.7, margin:"0 0 12px", fontWeight:"500" }}>{zone.desc}</p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"7px" }}>
            {zone.tips.map((t, i) => (
              <div key={i} style={{ display:"flex", gap:"8px", alignItems:"center", background:"rgba(255,255,255,0.22)", borderRadius:"9px", padding:"6px 10px", backdropFilter:"blur(4px)" }}>
                <span style={{ fontSize:"15px" }}>{t.emoji}</span>
                <span style={{ fontSize:"12px", color:"#fff", fontWeight:"700" }}>{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Completeness check function ───────────────────────────────────────────────
async function checkAllFeaturesComplete() {
  try {
    const [aboutRes, zonesRes, periodRes, skinRes] = await Promise.allSettled([
      fetch(`${API}/about/me`,       { credentials:"include" }),
      fetch(`${API}/zones/me`,       { credentials:"include" }),
      fetch(`${API}/period/me`,      { credentials:"include" }),
      fetch(`${API}/skin/history`,   { credentials:"include" }),
    ]);

    const about  = aboutRes.status==="fulfilled"  && aboutRes.value.ok  ? await aboutRes.value.json()  : null;
    const zones  = zonesRes.status==="fulfilled"  && zonesRes.value.ok  ? await zonesRes.value.json()  : null;
    const period = periodRes.status==="fulfilled" && periodRes.value.ok ? await periodRes.value.json() : null;
    const skin   = skinRes.status==="fulfilled"   && skinRes.value.ok   ? await skinRes.value.json()   : null;

    const aboutDone  = about?.hasProfile  === true;
    const zonesDone  = zones?.hasZones    === true && !!zones?.tracker?.current?.zone;
    const periodDone = period?.hasTracker === true;
    const skinDone   = skin?.entries?.length > 0;

    return {
      allDone:    aboutDone && zonesDone && periodDone && skinDone,
      aboutDone,
      zonesDone,
      periodDone,
      skinDone,
    };
  } catch(e) {
    console.error("Completeness check failed:", e);
    return { allDone:false, aboutDone:false, zonesDone:false, periodDone:false, skinDone:false };
  }
}

// ════════════════════════════════════════════════════════════════════════════
export default function Dashboard({ onLogout, onGoToZoneReport, currentUser }) {
  const [tipIdx,       setTipIdx]       = useState(0);
  const [page,         setPage]         = useState("loading");
  const [userData,     setUserData]     = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [completeness, setCompleteness] = useState(null);
  const [doctorPatientData, setDoctorPatientData] = useState(null);

  // ── On mount: fetch profile + check completeness ──────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/about/me`, { credentials:"include" });
        if (res.ok) {
          const data = await res.json();
          if (data.hasProfile) setUserData(data.profile);
        }
        const comp = await checkAllFeaturesComplete();
        setCompleteness(comp);
        setPage("dashboard");
      } catch(err) {
        console.error("Dashboard load error:", err);
        setPage("dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Re-check completeness when returning to dashboard ────────────────────
  const refreshAndGoDashboard = async () => {
    setLoading(true);
    const comp = await checkAllFeaturesComplete();
    setCompleteness(comp);
    setLoading(false);
    setPage("dashboard");
  };

  const goToRapidFireOrZones = async () => {
    if (!userData) {
      setPage("aboutyou");
      return;
    }

    try {
      const res = await fetch(`${API}/zones/me`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const hasActiveZone =
          data?.hasZones === true &&
          !!data?.tracker?.current?.zone &&
          (data?.daysUntilFull ?? 14) > 0;

        if (hasActiveZone) {
          setPage("zones_dashboard");
          return;
        }
      }
    } catch (err) {
      console.error("Zone gate check failed:", err);
    }

    setPage("rapidfire");
  };

  const handleStartAssessment = () => {
    goToRapidFireOrZones();
  };

  const handlePersonalizedNavigate = (dest) => {
    if (dest === "rapidfire")    goToRapidFireOrZones();
    else if (dest === "period")  setPage("periodtracker");
    else if (dest === "skin")    setPage("skinanalyzer");
    else if (dest === "zones")   setPage("zones_dashboard");
    else if (dest === "doctor_connect") setPage("doctor_connect");
    else if (dest === "profile") setPage("viewprofile");
    else setPage("dashboard");
  };

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (page === "loading" || (loading && page === "loading")) {
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#f0eafa,#f5eafa)"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:"48px",marginBottom:"12px",animation:"spin 2s linear infinite",display:"inline-block"}}>🌸</div>
          <p style={{color:"#9b7cc0",fontWeight:"700",fontFamily:"'Nunito',sans-serif"}}>Loading your wellness hub…</p>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── PAGE ROUTING ──────────────────────────────────────────────────────────
  if (page === "aboutyou") {
    return (
      <AboutYou
        onBack={() => setPage("dashboard")}
        onComplete={(data) => {
          if (!data.alreadyExists) setUserData(data);
          setPage("rapidfire");
        }}
      />
    );
  }

  if (page === "rapidfire") {
    return (
      <RapidFire
        userData={userData}
        onGoToZoneReport={async (result) => {
          const comp = await checkAllFeaturesComplete();
          setCompleteness(comp);
          if (onGoToZoneReport) onGoToZoneReport(result);
        }}
      />
    );
  }

  if (page === "periodtracker") {
    return <PeriodTracker userData={userData} onBack={refreshAndGoDashboard} />;
  }

  if (page === "viewprofile") {
    return <ViewProfile onBack={refreshAndGoDashboard} userData={userData} />;
  }

  if (page === "skinanalyzer") {
    return <SkinAnalyzer onBack={refreshAndGoDashboard} />;
  }

  if (page === "zones_dashboard") {
    // Open zone dashboard even if there's no fresh RapidFire result
    return (
      <ZoneReport
        result={null}
        onGoToDashboard={refreshAndGoDashboard}
        onGoToDoctorConnect={(trackerPayload) => {
          setDoctorPatientData({
            name: currentUser?.name || userData?.name || "Current User",
            email: currentUser?.email || "",
            current: trackerPayload?.current || trackerPayload || null,
            tracker: trackerPayload || null,
          });
          setPage("doctor_connect");
        }}
      />
    );
  }

  if (page === "doctor_connect") {
    return (
      <DoctorConnect
        onBack={refreshAndGoDashboard}
        onOpenDoctorDashboard={() => setPage("doctor_dashboard")}
      />
    );
  }

  if (page === "doctor_dashboard") {
    return (
      <DoctorDashboard
        fallbackPatient={doctorPatientData}
        onBack={() => setPage("doctor_connect")}
      />
    );
  }

  // ── PERSONALIZED DASHBOARD ────────────────────────────────────────────────
  if (page === "personalized" || (page === "dashboard" && completeness?.allDone)) {
    return (
      <PersonalizedDashboard
        userData={userData}
        onNavigate={handlePersonalizedNavigate}
        onBack={() => setPage("classic_dashboard")}
      />
    );
  }

  // ── CLASSIC DASHBOARD ─────────────────────────────────────────────────────
  const incompleteTasks = completeness ? [
    !completeness.aboutDone  && { emoji:"👤", label:"Complete About You",  action:()=>setPage("aboutyou")      },
    !completeness.zonesDone  && { emoji:"🔥", label:"Take RapidFire Quiz", action:()=>setPage("rapidfire")     },
    !completeness.periodDone && { emoji:"🗓️", label:"Track Your Periods",  action:()=>setPage("periodtracker") },
    !completeness.skinDone   && { emoji:"🔬", label:"Try Skin Analyzer",   action:()=>setPage("skinanalyzer")  },
  ].filter(Boolean) : [];

  return (
    <div style={D.root}>
      <div style={D.bgImage} />
      <div style={D.bgOverlay} />
      <SparkleStars />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&family=Nunito:wght@600;700;800;900&display=swap');
        @keyframes fadeUp  { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatUp { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-8px)} }
        @keyframes pulse   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes holoText {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        .du0 { animation: fadeUp 0.6s ease 0.0s both; }
        .du1 { animation: fadeUp 0.6s ease 0.15s both; }
        .du2 { animation: fadeUp 0.6s ease 0.3s both; }
        .float-sticker { animation: floatUp 3s ease-in-out infinite; }
        .tip-btn:hover { background: rgba(181,101,167,0.2) !important; }
        .btn-primary { transition: all 0.2s ease; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(148,108,210,0.5) !important; }
        .logout-btn:hover { background: rgba(181,101,167,0.12) !important; transform: translateY(-1px); }
        .assess-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(148,108,210,0.5) !important; }
        .task-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(148,108,210,0.2) !important; }
        .personalized-btn:hover { transform: translateY(-2px) scale(1.02) !important; }
      `}</style>

      <div style={D.page}>

        {onLogout && (
          <div style={D.topNav}>
            <button onClick={onLogout} className="logout-btn" style={D.logoutBtn}>
              🚪 Logout
            </button>
          </div>
        )}

        {/* ── Progress strip ── */}
        {completeness && !completeness.allDone && incompleteTasks.length > 0 && (
          <div className="du0" style={{background:"rgba(255,255,255,0.55)",backdropFilter:"blur(24px)",borderRadius:"22px",padding:"20px 24px",boxShadow:"0 6px 28px rgba(181,101,167,0.12)",border:"1px solid rgba(255,255,255,0.7)",marginBottom:"-4px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px",flexWrap:"wrap",gap:"8px"}}>
              <div>
                <div style={{fontSize:"10px",fontWeight:"900",color:"rgba(0,0,0,0.3)",fontFamily:"'Nunito',sans-serif",letterSpacing:"2.5px",marginBottom:"4px"}}>YOUR WELLNESS JOURNEY</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"18px",fontWeight:"900",color:"#2d1a4a"}}>
                  {4 - incompleteTasks.length} of 4 features unlocked 🌸
                </div>
              </div>
              <div style={{display:"flex",gap:"6px"}}>
                {[completeness.aboutDone, completeness.zonesDone, completeness.periodDone, completeness.skinDone].map((done,i)=>(
                  <div key={i} style={{width:"32px",height:"8px",borderRadius:"4px",background:done?"linear-gradient(90deg,#b565a7,#7c5cbf)":"rgba(0,0,0,0.1)",transition:"all 0.4s ease"}}/>
                ))}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:"8px"}}>
              {incompleteTasks.map((task,i)=>(
                <button key={i} className="task-card" onClick={task.action}
                  style={{display:"flex",alignItems:"center",gap:"10px",padding:"11px 14px",borderRadius:"14px",border:"1.5px dashed rgba(181,101,167,0.35)",background:"rgba(255,255,255,0.6)",cursor:"pointer",fontFamily:"'Nunito',sans-serif",transition:"all 0.2s ease",boxShadow:"0 2px 10px rgba(0,0,0,0.04)",textAlign:"left"}}>
                  <span style={{fontSize:"20px"}}>{task.emoji}</span>
                  <div>
                    <div style={{fontSize:"12px",fontWeight:"800",color:"#5a3090"}}>{task.label}</div>
                    <div style={{fontSize:"10px",color:"rgba(0,0,0,0.35)",fontWeight:"600"}}>Tap to complete →</div>
                  </div>
                </button>
              ))}
            </div>
            {completeness.allDone && (
              <button onClick={()=>setPage("personalized")} className="personalized-btn"
                style={{width:"100%",marginTop:"14px",padding:"13px",border:"none",borderRadius:"16px",background:"linear-gradient(135deg,#b565a7,#7c5cbf,#4a7fc1)",color:"#fff",fontWeight:"900",fontSize:"14px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:"0 6px 22px rgba(148,108,210,0.5)",transition:"all 0.2s ease"}}>
                ✨ Open Personalized Dashboard
              </button>
            )}
          </div>
        )}

        {/* ── All done banner ── */}
        {completeness?.allDone && (
          <div className="du0" style={{background:"linear-gradient(135deg,rgba(181,101,167,0.18),rgba(124,92,191,0.15),rgba(74,127,193,0.12))",backdropFilter:"blur(20px)",borderRadius:"22px",padding:"20px 24px",border:"1.5px solid rgba(181,101,167,0.3)",boxShadow:"0 8px 32px rgba(148,108,210,0.15)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"16px",flexWrap:"wrap"}}>
            <div>
              <div style={{fontSize:"10px",fontWeight:"900",color:"#7c5cbf",fontFamily:"'Nunito',sans-serif",letterSpacing:"2px",marginBottom:"4px"}}>🎉 ALL FEATURES COMPLETE</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"18px",fontWeight:"900",color:"#2d1a4a"}}>Your personalized dashboard is ready!</div>
              <p style={{fontSize:"12px",color:"rgba(0,0,0,0.45)",margin:"4px 0 0",fontWeight:"500"}}>Zone + Period + Skin all unified in one intelligent view.</p>
            </div>
            <button onClick={()=>setPage("personalized")} className="personalized-btn"
              style={{padding:"13px 28px",border:"none",borderRadius:"16px",background:"linear-gradient(135deg,#b565a7,#7c5cbf)",color:"#fff",fontWeight:"900",fontSize:"14px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:"0 6px 22px rgba(148,108,210,0.45)",transition:"all 0.2s ease",flexShrink:0,whiteSpace:"nowrap"}}>
              ✨ Open Dashboard →
            </button>
          </div>
        )}

        {/* ── Hero Card ── */}
        <div className="du0" style={D.heroCard}>
          <div style={D.heroLeft}>
            <div style={D.heroBadge}>🌸 Your Wellness Hub</div>
            <h1 style={D.heroTitle}>
              Welcome{currentUser?.name ? `, ${currentUser.name}` : userData?.name ? `, ${userData.name}` : " to HerSpace"} 💕
            </h1>
            <p style={D.heroSub}>
              Your personal wellness companion for hormonal balance and lifestyle health.
            </p>
            <div style={D.heroBtns}>
              <button
                className="btn-primary assess-btn"
                style={D.primaryBtn}
                onClick={handleStartAssessment}
                disabled={loading}
              >
                {loading ? "⏳ Loading..." : userData ? "🔥 Start RapidFire" : "📋 About You"}
              </button>
              <button className="btn-primary" style={D.primaryBtn} onClick={() => setPage("viewprofile")}>
                👤 View Profile
              </button>
              <button className="btn-primary" style={D.primaryBtn} onClick={() => setPage("periodtracker")}>
                🗓️ Track Periods
              </button>
              <button className="btn-primary" style={D.primaryBtn} onClick={() => setPage("skinanalyzer")}>
                🔬 Skin Analyzer
              </button>
              {/* ✅ My Dashboard button — same gradient as all other buttons */}
              {completeness?.allDone && (
                <button
                  className="btn-primary"
                  onClick={() => setPage("personalized")}
                  style={D.primaryBtn}
                >
                  ✨ My Dashboard
                </button>
              )}
            </div>
          </div>
          <div className="float-sticker" style={D.heroRight}>
            <img src={sticker} alt="guide" style={D.heroSticker} />
          </div>
        </div>

        {/* ── Daily Tip ── */}
        <div className="du1" style={D.tipCard}>
          <div style={D.tipHeader}>
            <span style={{ fontFamily:"'Nunito', sans-serif", fontSize:"15px", fontWeight:"800", color:"#8b3d9b" }}>
              💡 Daily Wellness Tip
            </span>
            <button className="tip-btn" onClick={() => setTipIdx((tipIdx + 1) % WELLNESS_TIPS.length)} style={D.tipNextBtn}>Next →</button>
          </div>
          <div style={D.tipBody}>
            <div style={D.tipEmoji}>{WELLNESS_TIPS[tipIdx].emoji}</div>
            <p style={D.tipText}>{WELLNESS_TIPS[tipIdx].tip}</p>
          </div>
          <div style={D.tipDots}>
            {WELLNESS_TIPS.map((_, i) => (
              <div key={i} onClick={() => setTipIdx(i)}
                style={{ ...D.tipDot, background: i === tipIdx ? "#b565a7" : "rgba(181,101,167,0.2)", transform: i === tipIdx ? "scale(1.35)" : "scale(1)", cursor:"pointer", transition:"all 0.3s" }} />
            ))}
          </div>
        </div>

        {/* ── Zone Cards ── */}
        <div className="du1">
          <div style={D.sectionHeader}>
            <div style={D.sectionLine} />
            <h2 style={D.sectionTitle}>Your Guided Zones</h2>
            <div style={D.sectionLine} />
          </div>
          <p style={D.sectionSub}>Hover each zone card to flip and explore tips ✨</p>
          <div style={D.zonesGrid}>
            {ZONES.map((z) => <FlipZoneCard key={z.id} zone={z} />)}
          </div>
        </div>

        {/* ── CTA Banner ── */}
        <div className="du2" style={D.ctaBanner}>
          <div style={D.ctaLeft}>
            <div style={{ fontSize:"36px", marginBottom:"8px" }}>✨</div>
            <h3 style={D.ctaTitle}>Ready to discover your zone?</h3>
            <p style={D.ctaDesc}>
              {userData
                ? <><strong style={{ color:"#8b3d9b" }}>"Start RapidFire"</strong> above to get your PCOD risk zone.</>
                : <><strong style={{ color:"#8b3d9b" }}>"About You"</strong> above to begin your personalized wellness journey.</>
              }
            </p>
          </div>
          <div style={D.ctaRight}>
            <div style={D.ctaZonePreview}>
              {["🌸","💎","🌺","✨"].map((e,i) => <div key={i} style={D.ctaMiniZone}>{e}</div>)}
            </div>
            <p style={{ fontSize:"12px", color:"#9b7cc0", margin:0, fontStyle:"italic" }}>4 wellness zones await you</p>
          </div>
        </div>

      </div>
    </div>
  );
}

const D = {
  root: { minHeight:"100vh", fontFamily:"'DM Sans', sans-serif", position:"relative", overflow:"hidden", background:"#f0eafa" },
  bgImage: { position:"fixed", inset:0, zIndex:0, backgroundImage:`url(${dashBg})`, backgroundSize:"cover", backgroundPosition:"center", backgroundRepeat:"no-repeat", filter:"blur(14px) brightness(0.82) saturate(1.3)", transform:"scale(1.08)", pointerEvents:"none" },
  bgOverlay: { position:"fixed", inset:0, zIndex:1, background:"linear-gradient(160deg, rgba(240,225,255,0.45) 0%, rgba(220,200,255,0.35) 40%, rgba(200,220,255,0.4) 100%)", pointerEvents:"none" },
  page: { position:"relative", zIndex:3, maxWidth:"1100px", margin:"0 auto", padding:"40px 24px", display:"flex", flexDirection:"column", gap:"24px" },
  heroCard: { background:"rgba(255,255,255,0.55)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderRadius:"28px", padding:"36px 40px", boxShadow:"0 8px 40px rgba(181,101,167,0.18), inset 0 1px 0 rgba(255,255,255,0.8)", border:"1px solid rgba(255,255,255,0.7)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"24px", flexWrap:"wrap" },
  heroLeft: { flex:1, minWidth:"260px" },
  heroBadge: { display:"inline-block", background:"linear-gradient(135deg, rgba(181,101,167,0.2), rgba(148,108,210,0.2))", color:"#8b3d9b", fontWeight:"700", fontSize:"12px", padding:"6px 16px", borderRadius:"20px", marginBottom:"14px", letterSpacing:"0.5px", border:"1px solid rgba(181,101,167,0.3)", backdropFilter:"blur(8px)" },
  heroTitle: { fontFamily:"'Playfair Display', serif", fontSize:"clamp(24px, 3vw, 36px)", fontWeight:"900", color:"#2d1a4a", margin:"0 0 10px", lineHeight:1.2, textShadow:"0 2px 20px rgba(181,101,167,0.25)" },
  heroSub: { fontSize:"14px", color:"#5a4070", lineHeight:1.5, margin:"6px 0 16px", maxWidth:"460px" },
  heroBtns: { display:"flex", gap:"10px", flexWrap:"wrap" },
  heroRight: { display:"flex", justifyContent:"center" },
  heroSticker: { width:"110px", height:"110px", borderRadius:"50%", objectFit:"cover", border:"3px solid rgba(255,255,255,0.25)", boxShadow:"0 8px 32px rgba(181,101,167,0.4), 0 0 0 6px rgba(181,101,167,0.1)" },
  // ✅ Single shared gradient for ALL buttons — no exceptions
  primaryBtn: {
    padding:"11px 22px",
    border:"none",
    borderRadius:"22px",
    background:"linear-gradient(135deg, #b565a7, #7c5cbf, #4a7fc1)",
    color:"white",
    fontWeight:"700",
    fontSize:"13px",
    cursor:"pointer",
    boxShadow:"0 4px 20px rgba(148,108,210,0.5)",
    transition:"all 0.2s ease",
  },
  tipCard: { background:"rgba(255,255,255,0.55)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderRadius:"22px", padding:"22px 26px", boxShadow:"0 6px 32px rgba(181,101,167,0.12), inset 0 1px 0 rgba(255,255,255,0.8)", border:"1px solid rgba(255,255,255,0.7)" },
  tipHeader: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" },
  tipNextBtn: { background:"rgba(181,101,167,0.15)", border:"1px solid rgba(181,101,167,0.3)", borderRadius:"10px", padding:"5px 14px", fontSize:"12px", fontWeight:"800", color:"#8b3d9b", cursor:"pointer", fontFamily:"'Nunito', sans-serif" },
  tipBody: { display:"flex", alignItems:"center", gap:"20px", marginBottom:"16px" },
  tipEmoji: { fontSize:"42px", flexShrink:0 },
  tipText: { fontSize:"14px", color:"#3d2060", lineHeight:1.7, margin:0, fontWeight:"600" },
  tipDots: { display:"flex", gap:"6px" },
  tipDot: { width:"7px", height:"7px", borderRadius:"50%" },
  sectionHeader: { display:"flex", alignItems:"center", gap:"16px", marginBottom:"8px" },
  sectionLine: { flex:1, height:"1px", background:"linear-gradient(90deg, transparent, rgba(181,101,167,0.6), rgba(122,179,232,0.6), transparent)" },
  sectionTitle: { fontFamily:"'Nunito', sans-serif", fontSize:"28px", fontWeight:"900", margin:0, whiteSpace:"nowrap", background:"linear-gradient(90deg, #e8b8e8, #b565a7, #7ab3e8, #7dcbb8, #e8b8e8)", backgroundSize:"300% auto", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", animation:"holoText 5s ease-in-out infinite", letterSpacing:"-0.3px" },
  sectionSub: { textAlign:"center", fontSize:"13px", color:"#7a5a9a", marginBottom:"20px", fontWeight:"500" },
  zonesGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap:"18px" },
  topNav: { display:"flex", alignItems:"center", padding:"8px 16px", marginBottom:"-4px", background:"rgba(255,255,255,0.55)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderRadius:"20px", border:"1px solid rgba(255,255,255,0.75)", boxShadow:"0 4px 20px rgba(181,101,167,0.1)", width:"fit-content", alignSelf:"flex-start" },
  logoutBtn: { background:"none", border:"none", color:"#7c5cbf", fontWeight:"700", fontSize:"13px", cursor:"pointer", fontFamily:"'Nunito', sans-serif", transition:"all 0.2s ease", padding:0 },
  ctaBanner: { background:"linear-gradient(135deg, rgba(181,101,167,0.22) 0%, rgba(148,108,210,0.25) 50%, rgba(74,127,193,0.2) 100%)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderRadius:"24px", padding:"32px 36px", border:"1.5px solid rgba(181,101,167,0.35)", boxShadow:"0 12px 48px rgba(148,108,210,0.2), inset 0 1px 0 rgba(255,255,255,0.9)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"20px" },
  ctaLeft: { flex:1 },
  ctaTitle: { fontFamily:"'Playfair Display', serif", fontSize:"20px", fontWeight:"700", color:"#2d1a4a", margin:"0 0 6px" },
  ctaDesc: { fontSize:"14px", color:"#5a4070", margin:0, lineHeight:1.6 },
  ctaRight: { display:"flex", flexDirection:"column", gap:"10px", alignItems:"center" },
  ctaZonePreview: { display:"flex", gap:"10px" },
  ctaMiniZone: { width:"44px", height:"44px", borderRadius:"14px", background:"rgba(255,255,255,0.6)", border:"1.5px solid rgba(181,101,167,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", boxShadow:"0 4px 12px rgba(148,108,210,0.12)", backdropFilter:"blur(8px)" },
};