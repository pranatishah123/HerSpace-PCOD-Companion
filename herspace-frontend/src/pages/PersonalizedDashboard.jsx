import React, { useEffect, useState, useRef } from "react";

const API = "http://localhost:5000/api";
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

// ── Phase config ──────────────────────────────────────────────────────────────
const PHASE_CONFIG = {
  Menstrual:  { emoji:"🩸", color:"#c45e8a", grad:"linear-gradient(135deg,#c45e8a,#e88ab8)", label:"Menstrual",  bg:"rgba(196,94,138,0.12)"  },
  Follicular: { emoji:"🌱", color:"#5b9e8a", grad:"linear-gradient(135deg,#5b9e8a,#7dcbb8)", label:"Follicular", bg:"rgba(91,158,138,0.12)"  },
  Ovulation:  { emoji:"🥚", color:"#b87000", grad:"linear-gradient(135deg,#b87000,#f5a623)", label:"Ovulation",  bg:"rgba(184,112,0,0.12)"   },
  Luteal:     { emoji:"🌙", color:"#7c5cbf", grad:"linear-gradient(135deg,#7c5cbf,#b565a7)", label:"Luteal",     bg:"rgba(124,92,191,0.12)"  },
};

const ZONE_CONFIG = {
  healthy:  { label:"Stabilize & Recover", emoji:"🟢", color:"#1a6b4a", lightColor:"#2d9e6f", glowColor:"rgba(29,158,117,0.35)",  grad:"linear-gradient(135deg,#1D9E75,#0F6E56)",  gradSoft:"linear-gradient(135deg,rgba(29,158,117,0.15),rgba(15,110,86,0.08))",  border:"rgba(29,158,117,0.22)"  },
  mild:     { label:"Support Sensitivity", emoji:"🟡", color:"#7a5500", lightColor:"#c07a10", glowColor:"rgba(186,117,23,0.35)",   grad:"linear-gradient(135deg,#BA7517,#EF9F27)",  gradSoft:"linear-gradient(135deg,rgba(186,117,23,0.15),rgba(239,159,39,0.08))",  border:"rgba(186,117,23,0.22)"  },
  moderate: { label:"Build Consistency",   emoji:"🟠", color:"#8b2a0a", lightColor:"#c45020", glowColor:"rgba(216,90,48,0.35)",   grad:"linear-gradient(135deg,#D85A30,#F0997B)",  gradSoft:"linear-gradient(135deg,rgba(216,90,48,0.15),rgba(240,153,123,0.08))",  border:"rgba(216,90,48,0.22)"  },
  high:     { label:"Maintain & Optimize", emoji:"🔴", color:"#6b1010", lightColor:"#a32d2d", glowColor:"rgba(163,45,45,0.35)",   grad:"linear-gradient(135deg,#A32D2D,#E24B4A)",  gradSoft:"linear-gradient(135deg,rgba(163,45,45,0.15),rgba(226,75,74,0.08))",    border:"rgba(163,45,45,0.22)"  },
};

// ── AI helpers ────────────────────────────────────────────────────────────────
const AI_MODELS = [
  // Keep this short to avoid rate-limit bursts; we fall back between providers/models.
  "google/gemma-3-4b-it:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "deepseek/deepseek-r1-distill-llama-8b:free",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tryAIModel(model, messages) {
  if (!OPENROUTER_KEY) throw new Error("Missing VITE_OPENROUTER_API_KEY (restart the dev server after adding it).");
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method:"POST",
    headers:{ "Content-Type":"application/json","Authorization":`Bearer ${OPENROUTER_KEY}`,"HTTP-Referer":window.location.origin,"X-Title":"HerSpace Wellness" },
    body: JSON.stringify({ model, messages, max_tokens:700, temperature:0.7 }),
  });
  const data = await res.json();
  if (data.error) {
    const suffix = res.status ? ` (HTTP ${res.status})` : "";
    const hint =
      res.status === 404
        ? " If you're using free models, check OpenRouter privacy/provider settings (Free model publication) or try a different model."
        : "";
    const e = new Error(`${data.error.message}${suffix}${hint}`);
    e.is429 = data.error.code===429 || res.status === 429;
    throw e;
  }
  return data?.choices?.[0]?.message?.content || "{}";
}

async function fetchPersonalizedPlan(profileData) {
  const { zone, phase, skinCondition, stability, trackerData } = profileData;
  const messages = [{
    role:"user",
    content:`You are a warm women's wellness AI for a PCOD wellness app.
User profile:
- PCOD Zone: ${zone}
- Cycle Phase: ${phase}
- Skin Condition: ${skinCondition || "not analyzed"}
- Stability: ${stability || "Stable"}
- Regularity: ${trackerData?.regularity || "unknown"}
- Flow: ${trackerData?.flow || "unknown"}

Generate a unified today's wellness plan. Return ONLY valid JSON (no markdown):
{
  "greeting": "1 warm personalized sentence about their current state",
  "diet": ["tip1","tip2","tip3"],
  "movement": ["tip1","tip2"],
  "selfCare": ["tip1","tip2"],
  "skinTip": "1 skin tip based on their condition + cycle phase",
  "insight": "1 short motivational insight about their health journey"
}`
  }];

  let lastErr;
  for (const model of AI_MODELS) {
    try {
      const text  = await tryAIModel(model, messages);
      const clean = text.replace(/```json|```/g,"").trim();
      return JSON.parse(clean);
    } catch(e) {
      lastErr = e;
      // If we're rate-limited, don't spam additional models immediately.
      if (e?.is429) break;
      // Small backoff between models to reduce burstiness.
      await sleep(450);
    }
  }
  throw lastErr || new Error("AI unavailable");
}

// ── Score Ring ────────────────────────────────────────────────────────────────
function WellnessRing({ score, size=120, loading=false }) {
  const r = size*0.38, cx = size/2, cy = size/2;
  const circ = 2*Math.PI*r;
  const pct  = (score||0)/100;
  const col  = score>=75?"#1D9E75":score>=50?"#BA7517":score>=30?"#D85A30":"#A32D2D";
  const glow = score>=75?"rgba(29,158,117,0.5)":score>=50?"rgba(186,117,23,0.5)":"rgba(163,45,45,0.5)";
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:size*0.6,height:size*0.6,borderRadius:"50%",background:glow,filter:"blur(14px)",opacity:0.5}}/>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)",position:"relative",zIndex:1}}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={size*0.08}/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={loading?"rgba(0,0,0,0.1)":col} strokeWidth={size*0.08}
          strokeDasharray={loading?`${circ*0.25} ${circ}`:`${circ*pct} ${circ}`} strokeLinecap="round"
          style={{transition:"stroke-dasharray 1.6s cubic-bezier(0.22,1,0.36,1)",filter:loading?"none":`drop-shadow(0 0 6px ${glow})`,animation:loading?"spin 1.5s linear infinite":"none"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        {loading ? (
          <span style={{fontSize:size*0.14,color:"rgba(0,0,0,0.3)",fontFamily:"'Nunito',sans-serif"}}>…</span>
        ) : (
          <>
            <span style={{fontSize:size*0.22,fontWeight:"900",color:col,fontFamily:"'Nunito',sans-serif",lineHeight:1}}>{score}</span>
            <span style={{fontSize:size*0.1,fontWeight:"700",color:"rgba(0,0,0,0.35)",fontFamily:"'Nunito',sans-serif"}}>/ 100</span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Phase Arc ─────────────────────────────────────────────────────────────────
function PhaseArc({ phase, cycleDay, cycleLengthDays }) {
  const phases = ["Menstrual","Follicular","Ovulation","Luteal"];
  const idx    = phases.indexOf(phase);
  const pct    = cycleLengthDays>0 ? cycleDay/cycleLengthDays : 0;
  const cx=100, cy=90, r=68;
  const toRad = d => (d*Math.PI)/180;
  const segColors = ["#c45e8a","#5b9e8a","#b87000","#7c5cbf"];
  const arcPath = (sp,ep,thick=10) => {
    const sd=-180+(sp/100)*180, ed=-180+(ep/100)*180;
    const oR=r, iR=r-thick;
    const x1=cx+oR*Math.cos(toRad(sd)), y1=cy+oR*Math.sin(toRad(sd));
    const x2=cx+oR*Math.cos(toRad(ed)), y2=cy+oR*Math.sin(toRad(ed));
    const x3=cx+iR*Math.cos(toRad(ed)), y3=cy+iR*Math.sin(toRad(ed));
    const x4=cx+iR*Math.cos(toRad(sd)), y4=cy+iR*Math.sin(toRad(sd));
    return `M${x1} ${y1} A${oR} ${oR} 0 ${(ep-sp)>50?1:0} 1 ${x2} ${y2} L${x3} ${y3} A${iR} ${iR} 0 ${(ep-sp)>50?1:0} 0 ${x4} ${y4}Z`;
  };
  const segs = [[0,25],[25,50],[50,75],[75,100]];
  const nA = -180+(pct)*180, nR = toRad(nA);
  const nTX = cx+(r-18)*Math.cos(nR), nTY = cy+(r-18)*Math.sin(nR);
  return (
    <svg width="200" height="110" viewBox="0 0 200 110" style={{display:"block",margin:"0 auto",overflow:"visible"}}>
      {segs.map(([sp,ep],i)=>(
        <path key={i} d={arcPath(sp,ep,10)} fill={segColors[i]}
          opacity={i===idx?1:0.25}
          style={{transition:"opacity 0.5s ease",filter:i===idx?`drop-shadow(0 0 6px ${segColors[i]})`:"none"}}/>
      ))}
      <polygon points={`${nTX},${nTY} ${cx+7*Math.cos(nR+Math.PI/2)},${cy+7*Math.sin(nR+Math.PI/2)} ${cx+7*Math.cos(nR-Math.PI/2)},${cy+7*Math.sin(nR-Math.PI/2)}`}
        fill={PHASE_CONFIG[phase]?.color||"#7c5cbf"} opacity="0.95"/>
      <circle cx={cx} cy={cy} r="6" fill="rgba(255,255,255,0.9)"/>
      <circle cx={cx} cy={cy} r="2.5" fill={PHASE_CONFIG[phase]?.color||"#7c5cbf"}/>
      <text x={cx} y={cy-16} textAnchor="middle" fontSize="9" fontWeight="900" fill={PHASE_CONFIG[phase]?.color||"#7c5cbf"} fontFamily="'Nunito',sans-serif">Day {cycleDay}</text>
      <text x="8"  y="105" textAnchor="middle" fontSize="7" fontWeight="800" fill="#c45e8a" fontFamily="'Nunito',sans-serif">🩸</text>
      <text x="54" y="105" textAnchor="middle" fontSize="7" fontWeight="800" fill="#5b9e8a" fontFamily="'Nunito',sans-serif">🌱</text>
      <text x="146" y="105" textAnchor="middle" fontSize="7" fontWeight="800" fill="#b87000" fontFamily="'Nunito',sans-serif">🥚</text>
      <text x="192" y="105" textAnchor="middle" fontSize="7" fontWeight="800" fill="#7c5cbf" fontFamily="'Nunito',sans-serif">🌙</text>
    </svg>
  );
}

// ── Mini Feature Card ─────────────────────────────────────────────────────────
function FeatureStatusCard({ emoji, title, status, onClick }) {
  const done = status === "done";
  return (
    <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:"12px",padding:"13px 16px",borderRadius:"16px",
      background:done?"rgba(29,158,117,0.08)":"rgba(255,255,255,0.55)",
      border:`1.5px solid ${done?"rgba(29,158,117,0.25)":"rgba(0,0,0,0.08)"}`,
      cursor:"pointer",transition:"all 0.2s ease",boxShadow:"0 2px 10px rgba(0,0,0,0.04)"}}>
      <div style={{width:"40px",height:"40px",borderRadius:"12px",display:"flex",alignItems:"center",justifyContent:"center",
        background:done?"linear-gradient(135deg,#1D9E75,#0F6E56)":"rgba(0,0,0,0.06)",fontSize:"18px",flexShrink:0,
        boxShadow:done?"0 4px 12px rgba(29,158,117,0.3)":"none"}}>
        {done ? "✅" : emoji}
      </div>
      <div style={{flex:1}}>
        <div style={{fontSize:"13px",fontWeight:"800",color:done?"#1a6b4a":"rgba(0,0,0,0.6)",fontFamily:"'Nunito',sans-serif"}}>{title}</div>
        <div style={{fontSize:"10px",fontWeight:"600",color:done?"rgba(29,158,117,0.7)":"rgba(0,0,0,0.35)",fontFamily:"'Nunito',sans-serif"}}>
          {done ? "Completed ✓" : "Tap to complete →"}
        </div>
      </div>
    </div>
  );
}

// ── Score Breakdown Bar ───────────────────────────────────────────────────────
function ScoreBar({ label, value, color, note }) {
  return (
    <div style={{marginBottom:"14px"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"5px"}}>
        <span style={{fontSize:"11px",fontWeight:"700",color:"rgba(0,0,0,0.4)",fontFamily:"'Nunito',sans-serif"}}>{label}</span>
        <span style={{fontSize:"11px",fontWeight:"800",color,fontFamily:"'Nunito',sans-serif"}}>{note}</span>
      </div>
      <div style={{height:"6px",background:"rgba(0,0,0,0.07)",borderRadius:"10px",overflow:"hidden"}}>
        <div style={{height:"100%",borderRadius:"10px",background:color,width:`${value}%`,
          transition:"width 1.4s cubic-bezier(0.22,1,0.36,1)",boxShadow:`0 0 8px ${color}66`}}/>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function PersonalizedDashboard({ userData, onNavigate, onBack }) {
  const [loading,       setLoading]       = useState(true);
  const [dashData,      setDashData]      = useState(null);
  const [aiPlan,        setAiPlan]        = useState(null);
  const [aiLoading,     setAiLoading]     = useState(false);
  const [aiError,       setAiError]       = useState("");
  const [activeTab,     setActiveTab]     = useState("overview");
  const [wellnessData,  setWellnessData]  = useState(null);
  const [scoreLoading,  setScoreLoading]  = useState(true);
  const [forceDoctorCta, setForceDoctorCta] = useState(false);
  const aiFetched = useRef(false);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h<12) return "Good morning";
    if (h<17) return "Good afternoon";
    return "Good evening";
  };

  // ── Fetch all dashboard data ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [periodRes, zonesRes, skinRes, wellnessRes] = await Promise.allSettled([
          fetch(`${API}/period/dashboard`,    { credentials:"include" }),
          fetch(`${API}/zones/me`,            { credentials:"include" }),
          fetch(`${API}/skin/history`,        { credentials:"include" }),
          fetch(`${API}/wellness/score`,      { credentials:"include" }), // NEW — dynamic score
        ]);

        const periodData  = periodRes.status==="fulfilled"  && periodRes.value.ok  ? await periodRes.value.json()  : null;
        const zonesData   = zonesRes.status==="fulfilled"   && zonesRes.value.ok   ? await zonesRes.value.json()   : null;
        const skinData    = skinRes.status==="fulfilled"    && skinRes.value.ok    ? await skinRes.value.json()    : null;
        const wellScore   = wellnessRes.status==="fulfilled" && wellnessRes.value.ok ? await wellnessRes.value.json() : null;

        setDashData({ period:periodData, zones:zonesData, skin:skinData });
        if (wellScore?.success) setWellnessData(wellScore);
      } catch(e) { console.error(e); }
      finally {
        setLoading(false);
        setScoreLoading(false);
      }
    })();
  }, []);

  // ── Fetch AI plan once data is loaded ─────────────────────────────────────
  useEffect(() => {
    if (!dashData || aiFetched.current) return;
    const zoneKey     = dashData.zones?.tracker?.current?.zone || "mild";
    const phase       = dashData.period?.phase || "Luteal";
    const skinCond    = dashData.skin?.entries?.[0]?.condition || "";
    const stability   = dashData.zones?.tracker?.actionPlan?.stabilityScore || "Stable";
    const trackerData = dashData.period?.trackerData || {};
    aiFetched.current = true;
    setAiLoading(true);
    setAiError("");
    fetchPersonalizedPlan({ zone:zoneKey, phase, skinCondition:skinCond, stability, trackerData })
      .then(plan => { setAiPlan(plan); setAiLoading(false); })
      .catch((e) => { setAiError(e?.message ? String(e.message) : "AI request failed."); setAiLoading(false); });
  }, [dashData]);

  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f5eafa"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:"48px",marginBottom:"16px",animation:"spin 2s linear infinite",display:"inline-block"}}>🌸</div>
        <p style={{color:"#9b7cc0",fontWeight:"700",fontFamily:"'Nunito',sans-serif"}}>Loading your wellness overview…</p>
      </div>
    </div>
  );

  // ── Extract data ───────────────────────────────────────────────────────────
  const period     = dashData?.period;
  const zones      = dashData?.zones;
  const skin       = dashData?.skin;

  const zoneKey    = zones?.tracker?.current?.zone || "mild";
  const zc         = ZONE_CONFIG[zoneKey];
  const phase      = period?.phase || "Luteal";
  const pc         = PHASE_CONFIG[phase] || PHASE_CONFIG.Luteal;
  const cycleDay   = period?.cycleDay || 1;
  const cycleDays  = period?.cycleLengthDays || 28;
  const nextPeriod = period?.daysUntilNextPeriod ?? "—";
  const stability  = zones?.tracker?.actionPlan?.stabilityScore || "Stable";
  const skinEntry  = skin?.entries?.[0] || null;
  const skinCond   = skinEntry?.condition || "Not analyzed";
  const actionPlan = zones?.tracker?.actionPlan;
  const miniDue    = zones?.daysUntilMini <= 0;
  const fullDue    = zones?.daysUntilFull <= 0;
  const highRiskCount = zones?.highRiskLoopCount ?? (zones?.tracker?.riskEvents||[]).filter((event)=>event.level==="high").length;
  const isDoctorEligibleZone = zoneKey === "moderate" || zoneKey === "high";
  const showDoctorCta = forceDoctorCta || (highRiskCount >= 2 || zones?.tracker?.doctorRequest?.triggered);
  const doctorCareNote =
    zoneKey === "high" || highRiskCount >= 2
      ? "Your recent check-ins suggest your body needs special care right now. Gentle consistency still matters, but this is the right moment to add medical guidance too."
      : "Some repeated risk signals are staying active, so pairing your wellness plan with professional support would be a smart next step.";

  // ── Dynamic wellness score from backend ───────────────────────────────────
  const wellnessScore      = wellnessData?.score      ?? 0;
  const scoreComponents    = wellnessData?.components ?? { zoneScore:0, cycleScore:0, consistencyScore:0, skinScore:0 };
  const scoreInputs        = wellnessData?.inputs     ?? {};

  const stabColor  = stability==="Improving"?"#1D9E75":stability==="Worsening"?"#A32D2D":"#BA7517";
  const stabEmoji  = stability==="Improving"?"📈":stability==="Worsening"?"📉":"➡️";

  const userName   = userData?.name || "Beautiful";
  const allImages  = skin?.entries?.filter(e=>e.imageUrl)?.slice(0,6) || [];

  const TABS = [
    { id:"overview",  label:"Overview",    emoji:"🌸" },
    { id:"plan",      label:"Today's Plan",emoji:"💡" },
    { id:"insights",  label:"Insights",    emoji:"✨" },
    { id:"images",    label:"My Journal",  emoji:"📸" },
  ];

  const gc = {
    background:"rgba(255,255,255,0.60)",
    backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)",
    borderRadius:"22px", padding:"22px 24px",
    border:"1px solid rgba(255,255,255,0.85)",
    boxShadow:"0 6px 28px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
    position:"relative", overflow:"hidden",
  };

  return (
    <div style={{minHeight:"100vh",fontFamily:"'DM Sans',sans-serif",background:"linear-gradient(160deg,#fdf4ff 0%,#f0f4ff 50%,#f4fff8 100%)"}}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&family=Nunito:wght@600;700;800;900&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes shimmer{0%,100%{opacity:0.4}50%{opacity:0.9}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .fade-up{animation:fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both;}
        .d1{animation-delay:0.08s}.d2{animation-delay:0.16s}.d3{animation-delay:0.24s}.d4{animation-delay:0.32s}.d5{animation-delay:0.4s}
        .card-hover{transition:all 0.2s ease;cursor:pointer;}
        .card-hover:hover{transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,0.1)!important;}
        .tab-btn:hover{background:rgba(255,255,255,0.8)!important;}
        .action-item:hover{transform:translateX(4px);background:rgba(255,255,255,0.85)!important;}
        .nav-btn:hover{opacity:0.85;transform:translateY(-1px);}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-thumb{background:rgba(181,101,167,0.2);border-radius:4px;}
      `}</style>

      {/* Ambient blobs */}
      <div style={{position:"fixed",top:"5%",left:"10%",width:"350px",height:"350px",background:"rgba(181,101,167,0.12)",filter:"blur(80px)",borderRadius:"50%",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",bottom:"10%",right:"5%",width:"300px",height:"300px",background:"rgba(91,158,138,0.12)",filter:"blur(70px)",borderRadius:"50%",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",top:"40%",right:"20%",width:"200px",height:"200px",background:"rgba(74,127,193,0.08)",filter:"blur(60px)",borderRadius:"50%",pointerEvents:"none",zIndex:0}}/>

      <div style={{position:"relative",zIndex:1,maxWidth:"1100px",margin:"0 auto",padding:"28px 24px 80px"}}>

        {/* ── Top Nav — FIXED: removed duplicate border key ── */}
        <div className="fade-up" style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"28px",flexWrap:"wrap",gap:"12px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <button
              onClick={onBack}
              className="nav-btn"
              style={{
                padding:"8px 18px",
                border:"none",           /* ← only ONE border key here — the duplicate "1px solid rgba..." is removed */
                borderRadius:"14px",
                background:"rgba(255,255,255,0.7)",
                backdropFilter:"blur(20px)",
                color:"#7c5cbf",
                fontWeight:"800",
                fontSize:"13px",
                cursor:"pointer",
                fontFamily:"'Nunito',sans-serif",
                outline:"1px solid rgba(255,255,255,0.8)",  /* was the duplicate — moved to outline */
                boxShadow:"0 2px 12px rgba(0,0,0,0.06)",
                transition:"all 0.2s"
              }}
            >
              ← Home
            </button>
            <div style={{fontSize:"10px",fontWeight:"900",color:"rgba(0,0,0,0.3)",fontFamily:"'Nunito',sans-serif",letterSpacing:"2.5px"}}>PERSONALIZED DASHBOARD</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            {(miniDue || fullDue) && (
              <div style={{padding:"6px 14px",borderRadius:"20px",background:"linear-gradient(135deg,rgba(124,92,191,0.15),rgba(181,101,167,0.12))",border:"1px solid rgba(124,92,191,0.25)",fontSize:"11px",fontWeight:"800",color:"#7c5cbf",fontFamily:"'Nunito',sans-serif",animation:"pulse 2s ease-in-out infinite"}}>
                🔔 Check-in due
              </div>
            )}
            <div style={{padding:"6px 14px",borderRadius:"20px",background:"rgba(255,255,255,0.7)",border:"1px solid rgba(255,255,255,0.85)",fontSize:"11px",fontWeight:"700",color:"rgba(0,0,0,0.5)",fontFamily:"'Nunito',sans-serif"}}>
              {new Date().toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}
            </div>
          </div>
        </div>

        {/* ── HERO GREETING ── */}
        <div className="fade-up" style={{...gc,marginBottom:"24px",background:"linear-gradient(135deg,rgba(255,255,255,0.75),rgba(255,255,255,0.55))",padding:"32px 36px"}}>
          <div style={{position:"absolute",top:"-40px",right:"-40px",width:"220px",height:"220px",background:zc.glowColor,filter:"blur(70px)",borderRadius:"50%",opacity:0.4,pointerEvents:"none"}}/>
          <div style={{position:"absolute",bottom:"-30px",left:"-30px",width:"180px",height:"180px",background:pc.bg,filter:"blur(60px)",borderRadius:"50%",opacity:0.5,pointerEvents:"none"}}/>

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"24px",flexWrap:"wrap",position:"relative"}}>
            <div style={{flex:1,minWidth:"260px"}}>
              <div style={{fontSize:"10px",fontWeight:"900",color:"rgba(0,0,0,0.3)",fontFamily:"'Nunito',sans-serif",letterSpacing:"3px",marginBottom:"8px"}}>{getGreeting().toUpperCase()}</div>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(26px,3vw,38px)",fontWeight:"900",color:"#1a1a2e",margin:"0 0 10px",lineHeight:1.15}}>
                {getGreeting()}, <span style={{color:zc.color}}>{userName}</span> 🌸
              </h1>
              {aiPlan?.greeting && !aiLoading ? (
                <p style={{fontSize:"14px",color:"rgba(0,0,0,0.5)",lineHeight:1.8,margin:"0 0 20px",fontWeight:"500",maxWidth:"520px",fontStyle:"italic"}}>
                  "{aiPlan.greeting}"
                </p>
              ) : (
                <p style={{fontSize:"14px",color:"rgba(0,0,0,0.45)",lineHeight:1.8,margin:"0 0 20px",fontWeight:"500",maxWidth:"520px"}}>
                  Your wellness intelligence is ready — here's your full picture today.
                </p>
              )}
              <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                <div style={{padding:"5px 14px",borderRadius:"20px",background:zc.gradSoft,border:`1px solid ${zc.border}`,fontSize:"11px",fontWeight:"800",color:zc.color,fontFamily:"'Nunito',sans-serif"}}>
                  {zc.emoji} {zc.label}
                </div>
                <div style={{padding:"5px 14px",borderRadius:"20px",background:pc.bg,border:`1px solid ${pc.color}33`,fontSize:"11px",fontWeight:"800",color:pc.color,fontFamily:"'Nunito',sans-serif"}}>
                  {pc.emoji} {pc.label} Phase
                </div>
                <div style={{padding:"5px 14px",borderRadius:"20px",background:`${stabColor}12`,border:`1px solid ${stabColor}30`,fontSize:"11px",fontWeight:"800",color:stabColor,fontFamily:"'Nunito',sans-serif"}}>
                  {stabEmoji} {stability}
                </div>
              </div>
            </div>

            {/* ── Dynamic Wellness Ring ── */}
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"8px",flexShrink:0}}>
              <WellnessRing score={wellnessScore} size={130} loading={scoreLoading}/>
              <div style={{fontSize:"11px",fontWeight:"700",color:"rgba(0,0,0,0.4)",fontFamily:"'Nunito',sans-serif",textAlign:"center"}}>Wellness Score</div>
              {wellnessData && (
                <div style={{fontSize:"9px",fontWeight:"600",color:"rgba(0,0,0,0.25)",fontFamily:"'Nunito',sans-serif",textAlign:"center",maxWidth:"110px",lineHeight:1.4}}>
                  Zone {scoreComponents.zoneScore} · Cycle {scoreComponents.cycleScore} · Habit {scoreComponents.consistencyScore} · Skin {scoreComponents.skinScore}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Check-in Banners ── */}
        {fullDue && (
          <div className="fade-up d1" style={{...gc,background:"linear-gradient(135deg,rgba(163,45,45,0.08),rgba(226,75,74,0.05))",border:`1.5px solid ${zc.border}`,marginBottom:"16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"16px",flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
              <div style={{width:"40px",height:"40px",borderRadius:"12px",background:zc.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0}}>🔁</div>
              <div>
                <div style={{fontSize:"11px",fontWeight:"900",color:zc.color,fontFamily:"'Nunito',sans-serif",letterSpacing:"2px",marginBottom:"2px"}}>FULL ZONE RE-ASSESSMENT DUE</div>
                <div style={{fontSize:"13px",color:"rgba(0,0,0,0.55)",fontWeight:"600",fontFamily:"'DM Sans',sans-serif"}}>It's been {zones?.daysSinceFull} days — time to update your zone.</div>
              </div>
            </div>
            <button onClick={()=>onNavigate?.("rapidfire")}
              style={{padding:"10px 20px",border:"none",borderRadius:"13px",background:zc.grad,color:"#fff",fontWeight:"800",fontSize:"12px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:`0 4px 14px ${zc.glowColor}`,flexShrink:0}}>
              Start Re-check →
            </button>
          </div>
        )}

        {miniDue && !fullDue && (
          <div className="fade-up d1" style={{...gc,background:"linear-gradient(135deg,rgba(102,126,234,0.08),rgba(118,75,162,0.05))",border:"1.5px solid rgba(102,126,234,0.2)",marginBottom:"16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"16px",flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
              <div style={{width:"40px",height:"40px",borderRadius:"12px",background:"linear-gradient(135deg,#667eea,#764ba2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0}}>📋</div>
              <div>
                <div style={{fontSize:"11px",fontWeight:"900",color:"#667eea",fontFamily:"'Nunito',sans-serif",letterSpacing:"2px",marginBottom:"2px"}}>WEEKLY CHECK-IN DUE</div>
                <div style={{fontSize:"13px",color:"rgba(0,0,0,0.55)",fontWeight:"600",fontFamily:"'DM Sans',sans-serif"}}>A quick 5-question update to keep your plan accurate.</div>
              </div>
            </div>
            <button onClick={()=>onNavigate?.("zones")}
              style={{padding:"10px 20px",border:"none",borderRadius:"13px",background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",fontWeight:"800",fontSize:"12px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",flexShrink:0}}>
              Check-in Now →
            </button>
          </div>
        )}

        {/* Doctor CTA */}
        {showDoctorCta && (
          <div className="fade-up d1" style={{...gc,background:"linear-gradient(135deg,rgba(255,225,225,0.85),rgba(255,240,235,0.78))",border:"1.5px solid rgba(163,45,45,0.22)",marginBottom:"16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"16px",flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:"12px",flex:1}}>
              <div style={{width:"44px",height:"44px",borderRadius:"12px",background:"linear-gradient(135deg,#A32D2D,#E24B4A)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",flexShrink:0,boxShadow:"0 4px 14px rgba(163,45,45,0.35)"}}>👩‍⚕️</div>
              <div>
                <div style={{fontSize:"11px",fontWeight:"900",color:"#A32D2D",fontFamily:"'Nunito',sans-serif",letterSpacing:"2px",marginBottom:"2px"}}>DOCTOR CONSULTATION RECOMMENDED</div>
                <div style={{fontSize:"12px",fontWeight:"600",color:"rgba(0,0,0,0.58)",fontFamily:"'DM Sans',sans-serif",lineHeight:1.6,marginBottom:"6px"}}>{doctorCareNote}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:"8px",flexShrink:0}}>
              <button onClick={() => onNavigate?.("doctor_connect")} style={{padding:"9px 16px",border:"none",borderRadius:"12px",color:"#fff",fontWeight:"800",fontSize:"11px",cursor:"pointer",background:"linear-gradient(135deg,#25D366,#128C7E)"}}>👩‍⚕️ Connect</button>
              <button onClick={()=>window.open("https://www.practo.com/","_blank")} style={{padding:"9px 16px",border:"none",borderRadius:"12px",color:"#fff",fontWeight:"800",fontSize:"11px",cursor:"pointer",background:"linear-gradient(135deg,#A32D2D,#E24B4A)"}}>📅 Book</button>
            </div>
          </div>
        )}

        {/* ── TABS ── */}
        <div className="fade-up d2" style={{display:"flex",gap:"6px",marginBottom:"24px",background:"rgba(255,255,255,0.5)",backdropFilter:"blur(20px)",borderRadius:"18px",padding:"6px",border:"1px solid rgba(255,255,255,0.8)"}}>
          {TABS.map(t=>(
            <button key={t.id} className="tab-btn" onClick={()=>setActiveTab(t.id)}
              style={{flex:1,padding:"10px 6px",border:"none",borderRadius:"13px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",fontSize:"12px",fontWeight:"800",transition:"all 0.18s ease",
                background:activeTab===t.id?"rgba(255,255,255,0.95)":"transparent",
                color:activeTab===t.id?"#7c5cbf":"rgba(0,0,0,0.45)",
                boxShadow:activeTab===t.id?"0 4px 16px rgba(0,0,0,0.08)":"none"}}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* ══════════ TAB: OVERVIEW ══════════ */}
        {activeTab==="overview" && (
          <div>
            <div className="fade-up d2" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"16px",marginBottom:"20px"}}>

              {/* PCOD Zone Card */}
              <div className="card-hover" style={{...gc}} onClick={()=>onNavigate?.("zones")}>
                <div style={{position:"absolute",top:"-15px",right:"-15px",width:"80px",height:"80px",background:zc.glowColor,filter:"blur(25px)",borderRadius:"50%",opacity:0.5}}/>
                <div style={{fontSize:"9px",fontWeight:"900",color:"rgba(0,0,0,0.3)",fontFamily:"'Nunito',sans-serif",letterSpacing:"2px",marginBottom:"12px",position:"relative"}}>PCOD ZONE</div>
                <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px",position:"relative"}}>
                  <span style={{fontSize:"26px"}}>{zc.emoji}</span>
                  <div>
                    <div style={{fontSize:"18px",fontWeight:"900",color:zc.color,fontFamily:"'Nunito',sans-serif",lineHeight:1}}>{zc.label}</div>
                    <div style={{fontSize:"10px",color:"rgba(0,0,0,0.35)",fontWeight:"600",fontFamily:"'Nunito',sans-serif",marginTop:"2px"}}>{stabEmoji} {stability}</div>
                  </div>
                </div>
                {actionPlan?.insight && (
                  <div style={{padding:"10px 12px",borderRadius:"12px",background:zc.gradSoft,border:`1px solid ${zc.border}`,marginBottom:"10px",position:"relative"}}>
                    <p style={{fontSize:"11px",color:zc.color,fontWeight:"600",margin:0,lineHeight:1.5,fontStyle:"italic"}}>"{actionPlan.insight}"</p>
                  </div>
                )}
                <div style={{fontSize:"11px",color:"rgba(0,0,0,0.35)",fontWeight:"600",fontFamily:"'Nunito',sans-serif",position:"relative"}}>
                  {fullDue ? "🔔 Re-check due" : `Next check in ${Math.max(0,14-(zones?.daysSinceFull||0))} days`}
                </div>
              </div>

              {/* Cycle Card */}
              <div className="card-hover" style={{...gc}} onClick={()=>onNavigate?.("period")}>
                <div style={{position:"absolute",top:"-15px",right:"-15px",width:"80px",height:"80px",background:pc.bg,filter:"blur(25px)",borderRadius:"50%",opacity:0.6}}/>
                <div style={{fontSize:"9px",fontWeight:"900",color:"rgba(0,0,0,0.3)",fontFamily:"'Nunito',sans-serif",letterSpacing:"2px",marginBottom:"10px",position:"relative"}}>CYCLE PHASE</div>
                <PhaseArc phase={phase} cycleDay={cycleDay} cycleLengthDays={cycleDays}/>
                <div style={{textAlign:"center",marginTop:"6px",position:"relative"}}>
                  <div style={{fontSize:"14px",fontWeight:"900",color:pc.color,fontFamily:"'Nunito',sans-serif"}}>{pc.emoji} {pc.label}</div>
                  <div style={{fontSize:"10px",color:"rgba(0,0,0,0.35)",fontWeight:"600",fontFamily:"'Nunito',sans-serif",marginTop:"2px"}}>Day {cycleDay} · Next period in {nextPeriod} days</div>
                </div>
              </div>

              {/* Skin Card */}
              <div className="card-hover" style={{...gc}} onClick={()=>onNavigate?.("skin")}>
                <div style={{position:"absolute",top:"-15px",right:"-15px",width:"80px",height:"80px",background:"rgba(181,101,167,0.2)",filter:"blur(25px)",borderRadius:"50%",opacity:0.5}}/>
                <div style={{fontSize:"9px",fontWeight:"900",color:"rgba(0,0,0,0.3)",fontFamily:"'Nunito',sans-serif",letterSpacing:"2px",marginBottom:"12px",position:"relative"}}>SKIN HEALTH</div>
                {skinEntry?.imageUrl ? (
                  <div style={{position:"relative",marginBottom:"10px"}}>
                    <img src={skinEntry.imageUrl} alt="skin" style={{width:"100%",height:"90px",objectFit:"cover",borderRadius:"12px",border:"2px solid rgba(255,255,255,0.8)"}}
                      onError={e=>{e.target.style.display="none";}}/>
                    {skinEntry.cyclePhase && (
                      <div style={{position:"absolute",bottom:"6px",left:"6px",padding:"2px 8px",borderRadius:"10px",background:"rgba(0,0,0,0.55)",fontSize:"9px",fontWeight:"800",color:"#fff",fontFamily:"'Nunito',sans-serif"}}>
                        {PHASE_CONFIG[skinEntry.cyclePhase]?.emoji} {skinEntry.cyclePhase}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{height:"90px",borderRadius:"12px",background:"linear-gradient(135deg,rgba(181,101,167,0.1),rgba(148,108,210,0.08))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"32px",marginBottom:"10px",border:"1px solid rgba(181,101,167,0.15)"}}>🧴</div>
                )}
                <div style={{fontSize:"14px",fontWeight:"800",color:"#5a3090",fontFamily:"'Nunito',sans-serif",marginBottom:"4px",position:"relative"}}>{skinCond}</div>
                {skinEntry?.aiNote && (
                  <div style={{fontSize:"10px",color:"rgba(0,0,0,0.45)",fontWeight:"500",lineHeight:1.5,fontFamily:"'DM Sans',sans-serif",position:"relative",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{skinEntry.aiNote}</div>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="fade-up d3" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"12px",marginBottom:"20px"}}>
              {[
                {icon:"📊",label:"Risk Score",  value:`${zones?.tracker?.current?.finalScore||0}`,   sub:`/${zones?.tracker?.current?.maxScore||120}`,  color:zc.lightColor},
                {icon:"🩺",label:"Symptoms",    value:`${zones?.tracker?.current?.detectedSymptoms?.length||0}`, sub:"detected",                          color:"#b565a7"},
                {icon:"🗓️",label:"Cycle Day",   value:`${cycleDay}`,                                  sub:`of ${cycleDays} days`,                         color:pc.color},
                {icon:"🧴",label:"Skin Scans",  value:`${skin?.entries?.length||0}`,                  sub:"total scans",                                  color:"#667eea"},
              ].map((s,i)=>(
                <div key={i} style={{...gc,textAlign:"center",padding:"18px 12px"}}>
                  <div style={{position:"absolute",top:"-8px",right:"-8px",width:"50px",height:"50px",background:`${s.color}22`,filter:"blur(15px)",borderRadius:"50%"}}/>
                  <div style={{fontSize:"20px",marginBottom:"6px"}}>{s.icon}</div>
                  <div style={{fontSize:"22px",fontWeight:"900",color:s.color,fontFamily:"'Nunito',sans-serif",lineHeight:1}}>{s.value}</div>
                  <div style={{fontSize:"11px",fontWeight:"700",color:"rgba(0,0,0,0.4)",fontFamily:"'Nunito',sans-serif",marginTop:"3px"}}>{s.label}</div>
                  <div style={{fontSize:"10px",color:"rgba(0,0,0,0.25)",fontWeight:"500"}}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Feature navigation cards */}
            <div className="fade-up d4" style={{...gc,marginBottom:"16px"}}>
              <div style={{fontSize:"9px",fontWeight:"900",color:"rgba(0,0,0,0.3)",fontFamily:"'Nunito',sans-serif",letterSpacing:"2.5px",marginBottom:"14px"}}>QUICK ACCESS</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                <FeatureStatusCard emoji="🔥" title="RapidFire Quiz" status="done"                      onClick={()=>onNavigate?.("rapidfire")}/>
                <FeatureStatusCard emoji="🗓️" title="Period Tracker" status={period?"done":"pending"}    onClick={()=>onNavigate?.("period")}/>
                <FeatureStatusCard emoji="🔬" title="Skin Analyzer"  status={skinEntry?"done":"pending"} onClick={()=>onNavigate?.("skin")}/>
                <FeatureStatusCard emoji="👤" title="About You"      status="done"                       onClick={()=>onNavigate?.("profile")}/>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ TAB: TODAY'S PLAN ══════════ */}
        {activeTab==="plan" && (
          <div>
            <div className="fade-up" style={{background:pc.grad,borderRadius:"20px",padding:"22px 26px",marginBottom:"20px",boxShadow:`0 8px 28px ${pc.bg}`}}>
              <div style={{display:"flex",alignItems:"center",gap:"14px",position:"relative"}}>
                <div style={{fontSize:"36px"}}>{pc.emoji}</div>
                <div>
                  <div style={{fontSize:"10px",fontWeight:"900",color:"rgba(255,255,255,0.7)",fontFamily:"'Nunito',sans-serif",letterSpacing:"2px",marginBottom:"4px"}}>TODAY'S PHASE CONTEXT</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:"16px",fontWeight:"700",color:"#fff",lineHeight:1.5}}>
                    {phase==="Menstrual"  && "Focus on rest, warmth, and deep nourishment today."}
                    {phase==="Follicular" && "Rising energy — a beautiful time to build momentum."}
                    {phase==="Ovulation"  && "Peak vitality — lean into intensity and connection."}
                    {phase==="Luteal"     && "Slow down gently — prioritise sleep and self-care."}
                  </div>
                </div>
              </div>
            </div>

            {aiLoading && (
              <div style={{...gc,marginBottom:"16px",textAlign:"center",padding:"40px"}}>
                <div style={{fontSize:"36px",marginBottom:"12px",animation:"spin 2s linear infinite",display:"inline-block"}}>🌸</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"18px",fontWeight:"900",color:"#1a1a2e",marginBottom:"8px"}}>Building your plan…</div>
                <p style={{fontSize:"13px",color:"rgba(0,0,0,0.4)",margin:0}}>AI is combining your zone + phase + skin data</p>
              </div>
            )}

            {aiError && null}
            
            {!aiLoading && !aiError && aiPlan && (
              <>
                {aiPlan.insight && (
                  <div className="fade-up" style={{...gc,marginBottom:"16px",background:"linear-gradient(135deg,rgba(255,255,255,0.82),rgba(255,255,255,0.65))"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:"12px"}}>
                      <div style={{width:"38px",height:"38px",borderRadius:"12px",background:"linear-gradient(135deg,#667eea,#764ba2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0}}>🧠</div>
                      <div>
                        <div style={{fontSize:"10px",fontWeight:"900",color:"#667eea",fontFamily:"'Nunito',sans-serif",letterSpacing:"2px",marginBottom:"6px"}}>AI INSIGHT</div>
                        <p style={{fontSize:"14px",color:"rgba(0,0,0,0.65)",lineHeight:1.8,margin:0,fontStyle:"italic",fontFamily:"'DM Sans',sans-serif"}}>"{aiPlan.insight}"</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="fade-up d1" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"14px",marginBottom:"16px"}}>
                  {[
                    {icon:"🥗",title:"Diet",     key:"diet",     color:"#1D9E75",glow:"rgba(29,158,117,0.15)",  border:"rgba(29,158,117,0.2)"},
                    {icon:"🏃",title:"Movement", key:"movement", color:"#b87000", glow:"rgba(184,112,0,0.12)",   border:"rgba(184,112,0,0.2)"},
                    {icon:"🧘",title:"Self-Care",key:"selfCare", color:"#b565a7", glow:"rgba(181,101,167,0.12)", border:"rgba(181,101,167,0.2)"},
                  ].map(cat=>(
                    <div key={cat.key} style={{...gc}}>
                      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"14px"}}>
                        <div style={{width:"34px",height:"34px",borderRadius:"10px",background:cat.glow,border:`1px solid ${cat.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",flexShrink:0}}>{cat.icon}</div>
                        <div style={{fontSize:"13px",fontWeight:"900",color:cat.color,fontFamily:"'Nunito',sans-serif"}}>{cat.title}</div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                        {(aiPlan[cat.key]||[]).map((tip,i)=>(
                          <div key={i} className="action-item" style={{display:"flex",alignItems:"flex-start",gap:"8px",padding:"10px 12px",borderRadius:"11px",background:cat.glow,border:`1px solid ${cat.border}`,transition:"all 0.2s ease",position:"relative",overflow:"hidden"}}>
                            <div style={{position:"absolute",left:0,top:0,bottom:0,width:"3px",background:cat.color,borderRadius:"11px 0 0 11px"}}/>
                            <div style={{width:"18px",height:"18px",borderRadius:"6px",background:cat.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9px",fontWeight:"900",color:"#fff",flexShrink:0,marginTop:"1px"}}>{i+1}</div>
                            <span style={{fontSize:"12px",fontWeight:"500",color:"rgba(0,0,0,0.65)",lineHeight:1.6,fontFamily:"'DM Sans',sans-serif"}}>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {aiPlan.skinTip && (
                  <div className="fade-up d2" style={{...gc,marginBottom:"16px",display:"flex",alignItems:"flex-start",gap:"14px"}}>
                    <div style={{width:"38px",height:"38px",borderRadius:"12px",background:"linear-gradient(135deg,rgba(181,101,167,0.2),rgba(148,108,210,0.15))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0}}>🧴</div>
                    <div>
                      <div style={{fontSize:"10px",fontWeight:"900",color:"#b565a7",fontFamily:"'Nunito',sans-serif",letterSpacing:"2px",marginBottom:"5px"}}>SKIN TIP FOR TODAY</div>
                      <p style={{fontSize:"13px",color:"rgba(0,0,0,0.65)",lineHeight:1.75,margin:0,fontFamily:"'DM Sans',sans-serif",fontWeight:"500"}}>{aiPlan.skinTip}</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {!aiLoading && !aiPlan && actionPlan && (
              <div className="fade-up d2" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"14px"}}>
                {[
                  {icon:"🥗",title:"Diet",     items:actionPlan.diet,    color:"#1D9E75"},
                  {icon:"🏃",title:"Movement", items:actionPlan.movement, color:"#b87000"},
                  {icon:"🧘",title:"Self-Care",items:actionPlan.selfCare, color:"#b565a7"},
                ].map(cat=>(
                  <div key={cat.title} style={{...gc}}>
                    <div style={{fontSize:"13px",fontWeight:"900",color:cat.color,fontFamily:"'Nunito',sans-serif",marginBottom:"12px"}}>{cat.icon} {cat.title}</div>
                    {(cat.items||[]).map((tip,i)=>(
                      <div key={i} style={{display:"flex",gap:"8px",marginBottom:"8px",padding:"9px 12px",background:`${cat.color}10`,borderRadius:"10px",border:`1px solid ${cat.color}20`}}>
                        <span style={{fontSize:"10px",fontWeight:"900",color:cat.color,minWidth:"16px"}}>{i+1}</span>
                        <span style={{fontSize:"12px",color:"rgba(0,0,0,0.6)",lineHeight:1.6,fontFamily:"'DM Sans',sans-serif"}}>{tip}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════ TAB: INSIGHTS ══════════ */}
        {activeTab==="insights" && (
          <div>
            <div className="fade-up" style={{...gc,marginBottom:"16px",background:"linear-gradient(135deg,rgba(255,255,255,0.82),rgba(255,255,255,0.65))"}}>
              <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"16px"}}>
                <div style={{width:"42px",height:"42px",borderRadius:"12px",background:zc.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"19px",flexShrink:0}}>🔬</div>
                <div>
                  <div style={{fontSize:"10px",fontWeight:"900",color:"rgba(0,0,0,0.35)",fontFamily:"'Nunito',sans-serif",letterSpacing:"2.5px",marginBottom:"2px"}}>ZONE PATTERN ANALYSIS</div>
                  <div style={{fontSize:"16px",fontWeight:"800",color:"#1a1a2e",fontFamily:"'Playfair Display',serif"}}>Your PCOD Journey</div>
                </div>
              </div>
              {(zones?.tracker?.history||[]).length > 0 ? (
                <div>
                  <div style={{fontSize:"10px",fontWeight:"900",color:"rgba(0,0,0,0.3)",fontFamily:"'Nunito',sans-serif",letterSpacing:"2px",marginBottom:"10px"}}>LAST {Math.min(4,(zones.tracker.history||[]).length)} ASSESSMENTS</div>
                  <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                    {[...(zones.tracker.history||[])].reverse().slice(0,4).map((snap,i)=>{
                      const hZc = ZONE_CONFIG[snap.zone]||ZONE_CONFIG.mild;
                      return (
                        <div key={i} style={{flex:1,minWidth:"80px",padding:"12px",borderRadius:"14px",background:hZc.gradSoft,border:`1px solid ${hZc.border}`,textAlign:"center"}}>
                          <div style={{fontSize:"20px",marginBottom:"4px"}}>{hZc.emoji}</div>
                          <div style={{fontSize:"11px",fontWeight:"800",color:hZc.color,fontFamily:"'Nunito',sans-serif"}}>{hZc.label}</div>
                          <div style={{fontSize:"9px",color:"rgba(0,0,0,0.3)",fontFamily:"'Nunito',sans-serif",marginTop:"2px"}}>Score: {snap.finalScore||"—"}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p style={{fontSize:"13px",color:"rgba(0,0,0,0.4)",margin:0}}>Complete more assessments to see patterns.</p>
              )}
            </div>

            {(period?.insights||[]).length > 0 && (
              <div className="fade-up d1" style={{marginBottom:"16px"}}>
                <div style={{fontSize:"10px",fontWeight:"900",color:"rgba(0,0,0,0.3)",fontFamily:"'Nunito',sans-serif",letterSpacing:"2.5px",marginBottom:"12px"}}>CYCLE INTELLIGENCE</div>
                {period.insights.map((ins,i)=>(
                  <div key={i} style={{...gc,marginBottom:"10px",display:"flex",alignItems:"flex-start",gap:"12px"}}>
                    <div style={{fontSize:"22px",flexShrink:0,marginTop:"2px"}}>{ins.icon}</div>
                    <div>
                      <div style={{fontSize:"12px",fontWeight:"900",color:ins.type==="alert"?"#a32d2d":ins.type==="warning"?"#c45020":"#8a6000",fontFamily:"'Nunito',sans-serif",marginBottom:"4px"}}>{ins.title}</div>
                      <p style={{fontSize:"13px",color:"rgba(0,0,0,0.6)",lineHeight:1.7,margin:0,fontFamily:"'DM Sans',sans-serif"}}>{ins.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {skin?.patternInsight?.detected && (
              <div className="fade-up d2" style={{...gc,marginBottom:"16px"}}>
                <div style={{fontSize:"10px",fontWeight:"900",color:"rgba(0,0,0,0.3)",fontFamily:"'Nunito',sans-serif",letterSpacing:"2px",marginBottom:"10px"}}>📊 SKIN PATTERN ACROSS {skin.entries?.length||0} SCANS</div>
                <p style={{fontSize:"13px",color:"rgba(0,0,0,0.65)",lineHeight:1.75,margin:"0 0 8px",fontFamily:"'DM Sans',sans-serif"}}>{skin.patternInsight.message}</p>
                {skin.patternInsight.tip && <p style={{fontSize:"12px",color:"rgba(0,0,0,0.45)",fontStyle:"italic",margin:0}}>💡 {skin.patternInsight.tip}</p>}
              </div>
            )}

            {/* ── Dynamic Wellness Score Breakdown (from backend) ── */}
            <div className="fade-up d3" style={{...gc}}>
              <div style={{fontSize:"10px",fontWeight:"900",color:"rgba(0,0,0,0.3)",fontFamily:"'Nunito',sans-serif",letterSpacing:"2px",marginBottom:"6px"}}>WELLNESS SCORE BREAKDOWN</div>
              {wellnessData && (
                <div style={{fontSize:"9px",color:"rgba(0,0,0,0.25)",fontFamily:"'Nunito',sans-serif",marginBottom:"14px"}}>
                  Last calculated: {wellnessData.inputs ? `Zone: ${scoreInputs.zone} · Stability: ${scoreInputs.stabilityTrend} · Cycle: ${scoreInputs.cycleRegularity}` : "Recalculating…"}
                </div>
              )}
              <ScoreBar
                label="PCOD Zone (35% weight)"
                value={scoreComponents.zoneScore}
                color={zc.lightColor}
                note={`${scoreComponents.zoneScore}/100 · ${zc.label}`}
              />
              <ScoreBar
                label="Cycle Health (30% weight)"
                value={scoreComponents.cycleScore}
                color={pc.color}
                note={`${scoreComponents.cycleScore}/100 · ${scoreInputs.cycleRegularity || "—"}`}
              />
              <ScoreBar
                label="Habit Consistency (25% weight)"
                value={scoreComponents.consistencyScore}
                color="#667eea"
                note={`${scoreComponents.consistencyScore}/100 · ${stability}`}
              />
              <ScoreBar
                label="Skin Health (10% weight)"
                value={scoreComponents.skinScore}
                color="#b565a7"
                note={`${scoreComponents.skinScore}/100 · ${scoreInputs.skinCondition || "—"}`}
              />
              <div style={{marginTop:"16px",padding:"12px 16px",borderRadius:"12px",background:"linear-gradient(135deg,rgba(124,92,191,0.1),rgba(181,101,167,0.08))",border:"1px solid rgba(124,92,191,0.18)",display:"flex",alignItems:"center",gap:"12px"}}>
                <WellnessRing score={wellnessScore} size={56} loading={scoreLoading}/>
                <div>
                  <div style={{fontSize:"12px",fontWeight:"900",color:"#7c5cbf",fontFamily:"'Nunito',sans-serif"}}>Overall Wellness Score</div>
                  <div style={{fontSize:"11px",color:"rgba(0,0,0,0.4)",fontFamily:"'Nunito',sans-serif",marginTop:"2px"}}>
                    Weighted composite of all 4 dimensions
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ TAB: IMAGES ══════════ */}
        {activeTab==="images" && (
          <div>
            <div className="fade-up" style={{marginBottom:"20px"}}>
              <div style={{fontSize:"10px",fontWeight:"900",color:"rgba(0,0,0,0.3)",fontFamily:"'Nunito',sans-serif",letterSpacing:"2.5px",marginBottom:"6px"}}>VISUAL JOURNAL</div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"26px",fontWeight:"900",color:"#1a1a2e",margin:"0 0 4px"}}>Your Skin Journey 📸</h2>
              <p style={{fontSize:"13px",color:"rgba(0,0,0,0.4)",margin:0}}>Skin scans tracked over time — watch how your skin changes with your cycle.</p>
            </div>

            {allImages.length === 0 ? (
              <div className="fade-up" style={{...gc,textAlign:"center",padding:"48px 24px"}}>
                <div style={{fontSize:"48px",marginBottom:"14px"}}>🔬</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:"900",color:"#1a1a2e",marginBottom:"8px"}}>No scans yet</div>
                <p style={{fontSize:"13px",color:"rgba(0,0,0,0.45)",lineHeight:1.7,margin:"0 0 20px",maxWidth:"300px",marginLeft:"auto",marginRight:"auto"}}>
                  Use the Skin Analyzer to upload photos and track how your skin changes through your cycle phases.
                </p>
                <button onClick={()=>onNavigate?.("skin")} style={{padding:"12px 28px",border:"none",borderRadius:"16px",background:"linear-gradient(135deg,#b565a7,#7c5cbf)",color:"#fff",fontWeight:"800",fontSize:"13px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:"0 6px 20px rgba(181,101,167,0.4)"}}>
                  🔬 Open Skin Analyzer
                </button>
              </div>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"14px"}}>
                {allImages.map((entry,i)=>{
                  const daysAgo = entry.createdAt ? Math.floor((Date.now()-new Date(entry.createdAt).getTime())/86400000) : null;
                  const entryPc = entry.cyclePhase ? PHASE_CONFIG[entry.cyclePhase] : null;
                  return (
                    <div key={i} className="card-hover fade-up" style={{...gc,padding:"0",overflow:"hidden",animationDelay:`${i*0.06}s`}}>
                      <div style={{position:"relative"}}>
                        <img src={entry.imageUrl} alt={`skin scan ${i+1}`} style={{width:"100%",height:"160px",objectFit:"cover",display:"block"}}
                          onError={e=>{e.target.parentNode.innerHTML="<div style='width:100%;height:160px;display:flex;align-items:center;justify-content:center;font-size:36px;background:rgba(181,101,167,0.08)'>🧴</div>";}}/>
                        {entryPc && (
                          <div style={{position:"absolute",top:"8px",left:"8px",padding:"3px 10px",borderRadius:"20px",background:"rgba(0,0,0,0.55)",fontSize:"10px",fontWeight:"800",color:"#fff",fontFamily:"'Nunito',sans-serif"}}>
                            {entryPc.emoji} {entry.cyclePhase}
                          </div>
                        )}
                      </div>
                      <div style={{padding:"14px"}}>
                        <div style={{fontSize:"13px",fontWeight:"800",color:"#2d1a4a",fontFamily:"'Nunito',sans-serif",marginBottom:"4px"}}>{entry.condition||"Analyzed"}</div>
                        <div style={{fontSize:"10px",color:"rgba(0,0,0,0.35)",fontWeight:"600",fontFamily:"'Nunito',sans-serif",marginBottom:"8px"}}>
                          {daysAgo===0?"Today":daysAgo===1?"Yesterday":daysAgo!==null?`${daysAgo} days ago`:"Recent"}
                        </div>
                        {entry.aiNote && (
                          <p style={{fontSize:"11px",color:"rgba(0,0,0,0.5)",lineHeight:1.55,margin:0,fontFamily:"'DM Sans',sans-serif",display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{entry.aiNote}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="fade-up" style={{display:"flex",gap:"10px",alignItems:"flex-start",background:"rgba(255,255,255,0.35)",borderRadius:"14px",padding:"14px 18px",border:"1px solid rgba(255,255,255,0.6)",marginTop:"24px"}}>
          <span style={{fontSize:"14px",flexShrink:0}}>🔒</span>
          <p style={{margin:0,fontSize:"11px",color:"rgba(0,0,0,0.3)",lineHeight:1.75,fontWeight:"500"}}>
            <strong style={{color:"rgba(0,0,0,0.4)"}}>Disclaimer:</strong> This is a wellness overview tool, not a medical diagnosis. All insights are based on self-reported data and AI analysis. Always consult a qualified healthcare professional.
          </p>
        </div>

      </div>
    </div>
  );
}