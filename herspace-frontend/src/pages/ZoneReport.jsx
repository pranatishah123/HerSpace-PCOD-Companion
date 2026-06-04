import React, { useEffect, useState, useRef } from "react";
import healthyImg  from "../assets/zones/Build Consistency.jpeg";
import mildImg     from "../assets/zones/maintain & optimize.jpeg";
import moderateImg from "../assets/zones/stabilize & recover.jpeg";
import highImg     from "../assets/zones/Support Sensitivity.jpeg";

const API = "http://localhost:5000/api";
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const AI_MODELS = [
  "google/gemma-3-4b-it:free",
  "google/gemma-3-12b-it:free",
  "mistralai/mistral-7b-instruct:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "deepseek/deepseek-r1-distill-llama-8b:free",
  "qwen/qwen3-4b:free",
];

async function tryAIModel(model, messages) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "HerSpace Zone Report",
    },
    body: JSON.stringify({ model, messages, max_tokens: 900, temperature: 0.7 }),
  });

  let data;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok || data?.error) {
    const msg = data?.error?.message || `AI request failed (HTTP ${res.status || "?"})`;
    const hint =
      res.status === 404
        ? " If you're using free models, check OpenRouter privacy/provider settings (Free model publication) or try a different model."
        : "";
    const err = new Error(`${msg}${hint}`);
    err.is429 = data?.error?.code === 429 || res.status === 429;
    throw err;
  }

  return data?.choices?.[0]?.message?.content || "{}";
}

async function runAIJson(messages, validator) {
  let lastError;
  for (const model of AI_MODELS) {
    try {
      const text = await tryAIModel(model, messages);
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      if (validator(parsed)) return parsed;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("AI unavailable");
}

function buildInsightFallback(zoneKey) {
  const fallbackByZone = {
    healthy: {
      summary: "Your answers look reassuring overall. Keep protecting the routines that are helping your body stay balanced.",
      insights: [
        { title: "Your current pattern looks steady", body: "Right now your symptoms do not point to a strong PCOD risk pattern, which is a good sign to preserve with consistency.", icon: "🌿" },
        { title: "Prevention still matters", body: "Regular sleep, movement, and cycle awareness will help you stay in this stable range over time.", icon: "💡" },
        { title: "Keep noticing small shifts", body: "Even in a healthy zone, checking in early makes it easier to act before symptoms build up.", icon: "🌸" },
      ],
    },
    mild: {
      summary: "A few early signals are showing up, but this is still a very workable stage for gentle course correction.",
      insights: [
        { title: "These are early body signals", body: "Your pattern suggests mild hormonal stress rather than a severe picture, which means steady habits can still make a big difference.", icon: "🌿" },
        { title: "Lifestyle has extra impact here", body: "Food quality, sleep timing, and stress recovery are especially important when the risk is still mild.", icon: "💡" },
        { title: "Consistency matters more than perfection", body: "Small routines done repeatedly will help more than occasional intense efforts.", icon: "🌸" },
      ],
    },
    moderate: {
      summary: "Your body seems to be asking for more structured support right now, and this is the right time to respond with care.",
      insights: [
        { title: "Multiple patterns are adding up", body: "This result suggests more than one hormonal stress signal is active, so your plan should be more intentional now.", icon: "🌿" },
        { title: "Support needs to be practical", body: "Balanced meals, movement you can sustain, and symptom tracking will help you understand what is helping and what is not.", icon: "💡" },
        { title: "Professional guidance can help early", body: "You do not need to panic, but a doctor can help you rule out stronger imbalance and guide next steps with clarity.", icon: "🌸" },
      ],
    },
    high: {
      summary: "This pattern deserves extra attention now. With timely support, you can still move this in a safer direction.",
      insights: [
        { title: "Your result shows stronger risk signals", body: "Several answers point toward a higher-risk hormonal pattern, so this is the moment to take symptoms seriously.", icon: "🌿" },
        { title: "Early care is a strength, not panic", body: "Seeking support now gives you a better chance of improving symptoms before they become harder to manage.", icon: "💡" },
        { title: "You deserve calm, structured help", body: "A doctor plus a realistic action plan can help turn this into something manageable step by step.", icon: "🌸" },
      ],
    },
  };

  return fallbackByZone[zoneKey] || fallbackByZone.mild;
}

function buildActionPlanFallback(zoneKey, stability = "Stable") {
  const tone =
    stability === "Improving"
      ? "You are moving in the right direction, so this plan focuses on protecting that progress."
      : stability === "Worsening"
      ? "Your recent check-ins suggest you need gentler but more consistent support right now."
      : "This plan is built to keep your hormones steadier through the next check-in cycle.";

  const plans = {
    healthy: {
      diet: ["Keep meals protein-balanced to avoid energy dips.", "Stay hydrated and reduce ultra-processed snacks.", "Add one anti-inflammatory food daily like seeds, berries, or leafy greens."],
      movement: ["Aim for regular movement 4-5 times this week.", "Mix walking with one strength or yoga session.", "Avoid overtraining if your body feels run down."],
      selfCare: ["Sleep on a steady schedule.", "Track any new symptoms before your next check-in.", "Use your calmer days to build routines that feel easy to repeat."],
    },
    mild: {
      diet: ["Cut down refined sugar where you can this week.", "Build meals around protein, fiber, and healthy fats.", "Choose one consistent breakfast that keeps you full."],
      movement: ["Walk daily, even if briefly.", "Add 2-3 strength or low-impact sessions this week.", "Use movement to support energy, not punish your body."],
      selfCare: ["Protect sleep quality before midnight when possible.", "Notice whether stress is worsening your symptoms.", "Keep your next check-in honest so the plan can improve."],
    },
    moderate: {
      diet: ["Reduce high-sugar and high-carb grazing.", "Focus on meals that keep blood sugar more steady.", "Prep at least one easy anti-inflammatory meal option."],
      movement: ["Choose gentle consistency over intensity.", "Include walks after meals if possible.", "Add mobility, yoga, or stretching to reduce stress load."],
      selfCare: ["Make sleep recovery non-negotiable this week.", "Keep symptom notes, especially for cycle and skin shifts.", "Consider planning a doctor visit if symptoms keep stacking up."],
    },
    high: {
      diet: ["Keep meals regular to avoid big blood sugar swings.", "Prioritize simple, anti-inflammatory foods you can repeat easily.", "Avoid treating cravings with highly processed comfort foods every day."],
      movement: ["Stick to manageable low-impact movement.", "Aim for short daily walks instead of intense bursts.", "Use movement to regulate stress, not to exhaust yourself."],
      selfCare: ["Take symptoms seriously and track changes closely.", "Rest deeply and lower pressure where you can.", "Prepare to speak with a doctor if the next check-in stays risky."],
    },
  };

  return {
    ...(plans[zoneKey] || plans.mild),
    insight: tone,
  };
}

function buildCareFallback(zoneKey, count) {
  if (zoneKey === "high" || count >= 2) {
    return "Your recent check-ins suggest that your body needs more than routine wellness support right now. Please take extra care, stay gentle with yourself, and connect with a doctor for proper guidance.";
  }
  return "Your pattern has stayed concerning across repeated check-ins, so this is a good time to add professional support alongside your current self-care plan.";
}

const ZONE_CONFIG = {
  mild: {
    label:"Support Sensitivity", emoji:"💎", color:"#4a7fc1", lightColor:"#7ab3e8",
    glowColor:"rgba(74,127,193,0.4)", border:"rgba(74,127,193,0.22)",
    grad:"linear-gradient(135deg,#4a7fc1,#7ab3e8)",
    gradSoft:"linear-gradient(135deg,rgba(74,127,193,0.15),rgba(122,179,232,0.08))",
    bgImage:mildImg,
    overlay:"linear-gradient(160deg,rgba(220,235,250,0.78) 0%,rgba(200,225,245,0.72) 50%,rgba(210,230,250,0.75) 100%)",
    subtitle:"Form habits that stick & thrive.\nYou're on the right track — build consistent habits around exercise, nutrition, and sleep.",
    explanation:"You're on the right track! Build consistent habits around exercise, nutrition, and sleep to strengthen your hormonal health. Your current patterns show good foundation but could benefit from more structure and consistency.",
    subtext:"Build consistent habits around exercise, nutrition, and sleep.",
    badge:"Support Sensitivity", badgeColor:"rgba(74,127,193,0.12)",
  },
  moderate: {
    label:"Build Consistency", emoji:"🌸", color:"#b565a7", lightColor:"#d48fd0",
    glowColor:"rgba(181,101,167,0.4)", border:"rgba(181,101,167,0.22)",
    grad:"linear-gradient(135deg,#b565a7,#d48fd0)",
    gradSoft:"linear-gradient(135deg,rgba(181,101,167,0.15),rgba(212,143,208,0.08))",
    bgImage:moderateImg,
    overlay:"linear-gradient(160deg,rgba(245,220,240,0.78) 0%,rgba(235,200,230,0.72) 50%,rgba(240,210,235,0.75) 100%)",
    subtitle:"Rest, heal & restore balance.\nYour body is asking for gentle care — prioritize deep rest, healing foods, and stress relief.",
    explanation:"Your body is asking for gentle care. Prioritize deep rest, healing foods, and stress relief to restore hormonal balance. Your current patterns suggest you need more recovery and stabilization.",
    subtext:"Prioritize deep rest, healing foods, and stress relief.",
    badge:"Build Consistency", badgeColor:"rgba(181,101,167,0.12)",
  },
  high: {
    label:"Maintain & Optimize", emoji:"🌺", color:"#c45e8a", lightColor:"#e88ab8",
    glowColor:"rgba(196,94,138,0.4)", border:"rgba(196,94,138,0.22)",
    grad:"linear-gradient(135deg,#c45e8a,#e88ab8)",
    gradSoft:"linear-gradient(135deg,rgba(196,94,138,0.15),rgba(232,138,184,0.08))",
    bgImage:highImg,
    overlay:"linear-gradient(160deg,rgba(250,220,235,0.78) 0%,rgba(245,200,225,0.72) 50%,rgba(248,210,230,0.75) 100%)",
    subtitle:"Nurture with calm & care.\nYour system is sensitive right now — embrace calming routines, nourishing food, and mindful stress management.",
    explanation:"Your system is sensitive right now. Embrace calming routines, nourishing food, and mindful stress management. Your patterns indicate you need extra support and sensitivity in your approach.",
    subtext:"Embrace calming routines, nourishing food, and mindful stress management.",
    badge:"Maintain & Optimize", badgeColor:"rgba(196,94,138,0.12)",
  },
  healthy: {
    label:"Stabilize & Recover", emoji:"✨", color:"#5b9e8a", lightColor:"#7dcbb8",
    glowColor:"rgba(91,158,138,0.4)", border:"rgba(91,158,138,0.22)",
    grad:"linear-gradient(135deg,#5b9e8a,#7dcbb8)",
    gradSoft:"linear-gradient(135deg,rgba(91,158,138,0.15),rgba(125,203,184,0.08))",
    bgImage:healthyImg,
    overlay:"linear-gradient(160deg,rgba(220,245,235,0.78) 0%,rgba(200,240,220,0.72) 50%,rgba(210,235,230,0.75) 100%)",
    subtitle:"You're thriving — keep going!\nMaintain your excellent habits and optimize further with advanced wellness practices and cycle syncing.",
    explanation:"You're thriving! Maintain your excellent habits and optimize further with advanced wellness practices and cycle syncing. Your patterns show excellent hormonal health that you want to preserve.",
    subtext:"Maintain your excellent habits and optimize further.",
    badge:"Stabilize & Recover", badgeColor:"rgba(91,158,138,0.12)",
  },
};

const SYMPTOM_LABELS = {
  irregularPeriods:"Irregular periods", acne:"Acne / oily skin",
  facialHair:"Excess facial or body hair", weightGain:"Weight gain / difficulty losing weight",
  hairThinning:"Hair thinning / hair fall", darkPatches:"Dark skin patches",
  moodSwings:"Mood swings / fatigue", ovulationIssues:"Ovulation / fertility difficulty",
};
const SYMPTOM_ICONS = {
  irregularPeriods:"🌸", acne:"✨", facialHair:"🌿",
  weightGain:"⚖️", hairThinning:"💆‍♀️", darkPatches:"🌑",
  moodSwings:"🌊", ovulationIssues:"🤍",
};

function Confetti() {
  const pieces = Array.from({length:36},(_,i)=>({id:i,left:`${(i*7.3)%100}%`,delay:`${(i*0.08)%1.2}s`,duration:`${1.2+(i*0.07)%1}s`,size:`${6+(i*2)%8}px`,color:["#1D9E75","#b565a7","#4a7fc1","#BA7517","#D85A30","#f5c842"][i%6],shape:i%3}));
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:100,overflow:"hidden"}}>
      <style>{`@keyframes cFall{0%{opacity:1;transform:translateY(-20px) rotate(0deg)}100%{opacity:0;transform:translateY(110vh) rotate(720deg)}}@keyframes cSway{0%,100%{margin-left:0}25%{margin-left:18px}75%{margin-left:-18px}}`}</style>
      {pieces.map(p=><div key={p.id} style={{position:"absolute",top:"-20px",left:p.left,width:p.size,height:p.size,background:p.color,borderRadius:p.shape===0?"50%":p.shape===1?"2px":"0",animation:`cFall ${p.duration} ${p.delay} ease-in forwards,cSway ${p.duration} ${p.delay} ease-in-out infinite`}}/>)}
    </div>
  );
}

function RiskMeter({ score, maxScore, color, glowColor }) {
  const pct = Math.min(Math.max((score / maxScore) * 100, 0), 100);
  const cx=110, cy=100, r=72;
  const toRad = d => (d*Math.PI)/180;
  const arcPath = (sp,ep,t=13) => {
    const sd=-180+(sp/100)*180, ed=-180+(ep/100)*180;
    const oR=r, iR=r-t;
    const x1=cx+oR*Math.cos(toRad(sd)), y1=cy+oR*Math.sin(toRad(sd));
    const x2=cx+oR*Math.cos(toRad(ed)), y2=cy+oR*Math.sin(toRad(ed));
    const x3=cx+iR*Math.cos(toRad(ed)), y3=cy+iR*Math.sin(toRad(ed));
    const x4=cx+iR*Math.cos(toRad(sd)), y4=cy+iR*Math.sin(toRad(sd));
    return `M${x1} ${y1} A${oR} ${oR} 0 ${(ep-sp)>50?1:0} 1 ${x2} ${y2} L${x3} ${y3} A${iR} ${iR} 0 ${(ep-sp)>50?1:0} 0 ${x4} ${y4}Z`;
  };
  const nA=-180+(pct/100)*180, nR=toRad(nA);
  const nTX=cx+(r-16)*Math.cos(nR), nTY=cy+(r-16)*Math.sin(nR);
  const nB1X=cx+7*Math.cos(nR+Math.PI/2), nB1Y=cy+7*Math.sin(nR+Math.PI/2);
  const nB2X=cx+7*Math.cos(nR-Math.PI/2), nB2Y=cy+7*Math.sin(nR-Math.PI/2);
  return (
    <div style={{position:"relative"}}>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-60%)",width:"120px",height:"60px",background:glowColor,filter:"blur(28px)",borderRadius:"50%",pointerEvents:"none",opacity:0.6}}/>
      <svg width="220" height="122" viewBox="0 0 220 122" style={{display:"block",margin:"0 auto",overflow:"visible",position:"relative",zIndex:1}}>
        <path d={arcPath(0,100,13)} fill="rgba(0,0,0,0.06)"/>
        <path d={arcPath(0,25,13)} fill="#1D9E75" opacity="0.9"/>
        <path d={arcPath(25,50,13)} fill="#BA7517" opacity="0.9"/>
        <path d={arcPath(50,75,13)} fill="#D85A30" opacity="0.9"/>
        <path d={arcPath(75,100,13)} fill="#A32D2D" opacity="0.9"/>
        {[0,25,50,75,100].map(p => {
          const d=-180+(p/100)*180, rad=toRad(d);
          return <line key={p} x1={cx+(r-1)*Math.cos(rad)} y1={cy+(r-1)*Math.sin(rad)} x2={cx+(r+5)*Math.cos(rad)} y2={cy+(r+5)*Math.sin(rad)} stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"/>;
        })}
        <polygon points={`${nTX},${nTY} ${nB1X},${nB1Y} ${nB2X},${nB2Y}`} fill={color} opacity="0.9"/>
        <circle cx={cx} cy={cy} r="8" fill="rgba(255,255,255,0.9)" style={{filter:`drop-shadow(0 0 6px ${glowColor})`}}/>
        <circle cx={cx} cy={cy} r="3.5" fill={color}/>
        <text x={cx} y={cy-20} textAnchor="middle" fontSize="13" fontWeight="900" fill={color} fontFamily="'Nunito',sans-serif">{score}/{maxScore}</text>
        <text x="16"  y="118" textAnchor="middle" fontSize="7" fontWeight="800" fill="#1D9E75">Stabilize</text>
        <text x="65"  y="118" textAnchor="middle" fontSize="7" fontWeight="800" fill="#BA7517">Support</text>
        <text x="152" y="118" textAnchor="middle" fontSize="7" fontWeight="800" fill="#D85A30">Build</text>
        <text x="204" y="118" textAnchor="middle" fontSize="7" fontWeight="800" fill="#A32D2D">Maintain</text>
      </svg>
    </div>
  );
}

function StatBar({ label, value, displayValue, max, color, glowColor }) {
  const pct = Math.min(Math.max((value/max)*100,0),100);
  return (
    <div style={{marginBottom:"14px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
        <span style={{fontSize:"11px",fontWeight:"700",color:"rgba(0,0,0,0.4)",fontFamily:"'Nunito',sans-serif"}}>{label}</span>
        <span style={{fontSize:"12px",fontWeight:"900",color,fontFamily:"'Nunito',sans-serif"}}>{displayValue??value}</span>
      </div>
      <div style={{height:"6px",background:"rgba(0,0,0,0.07)",borderRadius:"10px",overflow:"visible",position:"relative"}}>
        <div style={{height:"100%",borderRadius:"10px",background:`linear-gradient(90deg,${color},${color}cc)`,width:`${pct}%`,transition:"width 1.6s cubic-bezier(0.22,1,0.36,1)",boxShadow:`0 0 10px ${glowColor||color}`,position:"relative"}}>
          <div style={{position:"absolute",right:0,top:"50%",transform:"translateY(-50%)",width:"10px",height:"10px",borderRadius:"50%",background:color,boxShadow:`0 0 8px 3px ${glowColor||color}`}}/>
        </div>
      </div>
    </div>
  );
}

function CountdownRing({ days, label, total, color, glowColor, urgent }) {
  const pct=Math.max(0,Math.min(1,days/total)), r=30, cx=38, cy=38;
  const circ=2*Math.PI*r, dash=circ*pct;
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"6px"}}>
      <div style={{position:"relative",width:"76px",height:"76px"}}>
        <svg width="76" height="76" style={{transform:"rotate(-90deg)"}}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="6"/>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={urgent?"#A32D2D":color} strokeWidth="6"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{transition:"stroke-dasharray 1.4s cubic-bezier(0.22,1,0.36,1)",filter:`drop-shadow(0 0 6px ${urgent?"rgba(163,45,45,0.5)":glowColor})`}}/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
          <span style={{fontSize:"18px",fontWeight:"900",color:urgent?"#A32D2D":color,fontFamily:"'Nunito',sans-serif",lineHeight:1}}>{days}</span>
          <span style={{fontSize:"8px",fontWeight:"700",color:"rgba(0,0,0,0.35)",fontFamily:"'Nunito',sans-serif"}}>days</span>
        </div>
      </div>
      <span style={{fontSize:"10px",fontWeight:"700",color:urgent?"#A32D2D":"rgba(0,0,0,0.4)",fontFamily:"'Nunito',sans-serif",textAlign:"center",maxWidth:"70px",lineHeight:1.3}}>{label}</span>
    </div>
  );
}

function MiniCheckinModal({ zc, onClose, onSubmit }) {
  const [answers, setAnswers]       = useState({ energy:"", symptoms:"", skin:"", stress:"", overall:"" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState(null);
  const questions = [
    { key:"energy",   label:"How is your energy compared to last check?", opts:["Improved","Same","Worse"] },
    { key:"symptoms", label:"Have your symptoms changed?",                 opts:["Reduced","Same","Increased"] },
    { key:"skin",     label:"How is your skin / acne doing?",              opts:["Better","Same","Worse"] },
    { key:"stress",   label:"How are your stress levels?",                 opts:["Lower","Same","Higher"] },
    { key:"overall",  label:"Overall, how do you feel?",                   opts:["Better","Same","Worse"] },
  ];
  const allAnswered = Object.values(answers).every(v => v !== "");
  const handleSubmit = async () => {
    if (!allAnswered) return;
    setSubmitting(true); setError(null);
    try {
      const res  = await fetch(`${API}/zones/mini`, { method:"POST", credentials:"include", headers:{"Content-Type":"application/json"}, body:JSON.stringify(answers) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");
      onSubmit(data);
    } catch (e) { setError(e.message); setSubmitting(false); }
  };
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",background:"rgba(0,0,0,0.35)",backdropFilter:"blur(8px)"}}>
      <div style={{background:"rgba(255,255,255,0.97)",backdropFilter:"blur(32px)",borderRadius:"24px",padding:"32px 36px",maxWidth:"520px",width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.18)",border:"1px solid rgba(255,255,255,0.9)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"24px"}}>
          <div>
            <div style={{fontSize:"10px",fontWeight:"900",color:"rgba(0,0,0,0.3)",fontFamily:"'Nunito',sans-serif",letterSpacing:"2.5px",marginBottom:"4px"}}>MINI CHECK-IN</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:"900",color:"#1a1a2e"}}>How are you doing? 🌸</div>
          </div>
          <button onClick={onClose} style={{width:"36px",height:"36px",borderRadius:"10px",border:"none",background:"rgba(0,0,0,0.06)",cursor:"pointer",fontSize:"16px",color:"rgba(0,0,0,0.4)"}}>✕</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"16px",marginBottom:"24px"}}>
          {questions.map(q => (
            <div key={q.key}>
              <div style={{fontSize:"13px",fontWeight:"700",color:"rgba(0,0,0,0.65)",fontFamily:"'DM Sans',sans-serif",marginBottom:"8px"}}>{q.label}</div>
              <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                {q.opts.map(opt => {
                  const sel = answers[q.key] === opt;
                  return <button key={opt} onClick={() => setAnswers(p => ({...p,[q.key]:opt}))} style={{padding:"8px 16px",borderRadius:"20px",border:`1.5px solid ${sel?zc.color:"rgba(0,0,0,0.12)"}`,background:sel?zc.gradSoft:"rgba(255,255,255,0.7)",color:sel?zc.color:"rgba(0,0,0,0.55)",fontWeight:"700",fontSize:"12px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",transition:"all 0.18s ease"}}>{opt}</button>;
                })}
              </div>
            </div>
          ))}
        </div>
        {error && <div style={{padding:"10px 14px",borderRadius:"10px",background:"rgba(216,90,48,0.08)",border:"1px solid rgba(216,90,48,0.2)",color:"#c45020",fontSize:"12px",fontWeight:"600",marginBottom:"14px"}}>{error}</div>}
        <button onClick={handleSubmit} disabled={!allAnswered||submitting} style={{width:"100%",padding:"14px",border:"none",borderRadius:"16px",background:allAnswered&&!submitting?zc.grad:"rgba(0,0,0,0.08)",color:allAnswered&&!submitting?"#fff":"rgba(0,0,0,0.3)",fontWeight:"800",fontSize:"14px",cursor:allAnswered&&!submitting?"pointer":"not-allowed",fontFamily:"'Nunito',sans-serif",transition:"all 0.2s ease"}}>
          {submitting ? "Generating your AI plan… ✨" : "Submit Check-in ✨"}
        </button>
      </div>
    </div>
  );
}

function ZoneDashboard({ tracker, zc, daysData, onMiniCheckin, onFullCheckin, onGoToDoctorConnect, riskLoopCount = 0 }) {
  const [showMiniModal,  setShowMiniModal]  = useState(false);
  const [localTracker,   setLocalTracker]   = useState(tracker);
  const [localDays,      setLocalDays]      = useState(daysData);
  const [aiPlan,         setAiPlan]         = useState(null);
  const [aiPlanLoading,  setAiPlanLoading]  = useState(false);
  const [careAdvice,     setCareAdvice]     = useState("");
  const [careLoading,    setCareLoading]    = useState(false);
  const [forceDoctorCta, setForceDoctorCta] = useState(() => {
    try {
      return window.localStorage.getItem("doctorCtaTestMode") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => { setLocalTracker(tracker); }, [tracker]);
  useEffect(() => { setLocalDays(daysData); },   [daysData]);

  const current       = localTracker?.current      || {};
  const actionPlan    = localTracker?.actionPlan   || null;
  const doctorRequest = localTracker?.doctorRequest || {};
  const previousSnapshot = localTracker?.history?.[0] || null;

  const daysUntilFull = localDays?.daysUntilFull ?? 14;
  const daysUntilMini = localDays?.daysUntilMini ?? 6;
  const daysSinceFull = localDays?.daysSinceFull  ?? 0;
  const currZone   = current.zone || "mild";
  const prevZone   = previousSnapshot?.zone || null;
  const zoneOrder  = { healthy:0, mild:1, moderate:2, high:3 };
  const zoneImproved = prevZone && (zoneOrder[currZone]??1) < (zoneOrder[prevZone]??1);
  const zoneWorsened = prevZone && (zoneOrder[currZone]??1) > (zoneOrder[prevZone]??1);

  const stability      = actionPlan?.stabilityScore || "Stable";
  const stabilityColor = stability==="Improving"?"#1D9E75":stability==="Worsening"?"#A32D2D":"#BA7517";
  const stabilityEmoji = stability==="Improving"?"📈":stability==="Worsening"?"📉":"➡️";
  const trackerRiskCount = (localTracker?.riskEvents || []).filter((event) => event.level === "high").length;
  const highRiskCount = Math.max(riskLoopCount, trackerRiskCount);
  const isDoctorEligibleZone = currZone === "moderate" || currZone === "high";
  const showDoctor = forceDoctorCta ||  (isDoctorEligibleZone && (highRiskCount >= 2 || doctorRequest?.triggered));
  const effectivePlan = aiPlan || actionPlan;
  const totalAssessments = (localTracker?.history?.length || 0) + (current?.zone ? 1 : 0);

  useEffect(() => {
    if (!current?.zone || !OPENROUTER_KEY) {
      setAiPlan(null);
      return;
    }

    let alive = true;
    setAiPlanLoading(true);

    runAIJson(
      [{
        role: "user",
        content: `You are a warm women's wellness guide for a PCOD app.
Current zone: ${current.zone}
Current score: ${current.finalScore ?? 0}
Detected symptoms: ${(current.detectedSymptoms || []).join(", ") || "none"}
Stability: ${stability}
Latest mini check-in:
- Energy: ${localTracker?.miniCheckin?.energy || "unknown"}
- Symptoms: ${localTracker?.miniCheckin?.symptoms || "unknown"}
- Skin: ${localTracker?.miniCheckin?.skin || "unknown"}
- Stress: ${localTracker?.miniCheckin?.stress || "unknown"}
- Overall: ${localTracker?.miniCheckin?.overall || "unknown"}

Return ONLY valid JSON:
{
  "diet": ["tip1","tip2","tip3"],
  "movement": ["tip1","tip2","tip3"],
  "selfCare": ["tip1","tip2","tip3"],
  "insight": "one warm human sentence"
}`,
      }],
      (parsed) => Array.isArray(parsed?.diet) && Array.isArray(parsed?.movement) && Array.isArray(parsed?.selfCare)
    )
      .then((plan) => {
        if (alive) setAiPlan(plan);
      })
      .catch(() => {
        if (alive) setAiPlan(buildActionPlanFallback(current.zone, stability));
      })
      .finally(() => {
        if (alive) setAiPlanLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [current.zone, current.finalScore, current.detectedSymptoms, localTracker?.miniCheckin, stability]);

  useEffect(() => {
    if (!showDoctor) {
      setCareAdvice("");
      return;
    }

    if (!OPENROUTER_KEY) {
      setCareAdvice(buildCareFallback(currZone, highRiskCount));
      return;
    }

    let alive = true;
    setCareLoading(true);

    runAIJson(
      [{
        role: "user",
        content: `Write a warm, human-sounding wellness note for a woman in a PCOD app.
Current zone: ${currZone}
High-risk loop count: ${highRiskCount}
Doctor already triggered: ${doctorRequest?.triggered ? "yes" : "no"}

Return ONLY valid JSON:
{
  "message": "2 to 3 compassionate sentences saying special care is needed now and that speaking with a doctor is the right next step"
}`,
      }],
      (parsed) => typeof parsed?.message === "string" && parsed.message.trim().length > 0
    )
      .then((parsed) => {
        if (alive) setCareAdvice(parsed.message.trim());
      })
      .catch(() => {
        if (alive) setCareAdvice(buildCareFallback(currZone, highRiskCount));
      })
      .finally(() => {
        if (alive) setCareLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [currZone, doctorRequest?.triggered, highRiskCount, showDoctor]);

  const gc = {
    background:"rgba(255,255,255,0.62)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",
    borderRadius:"20px",padding:"22px 26px",border:"1px solid rgba(255,255,255,0.88)",
    boxShadow:"0 6px 28px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.95)",
    marginBottom:"16px",position:"relative",overflow:"hidden",
  };
  const sL = (icon,text) => (
    <div style={{fontSize:"10px",fontWeight:"900",color:"rgba(0,0,0,0.45)",fontFamily:"'Nunito',sans-serif",letterSpacing:"2.5px",marginBottom:"14px",display:"flex",alignItems:"center",gap:"6px"}}>
      <span>{icon}</span><span>{text}</span>
    </div>
  );

  return (
    <div className="fade-up">
      <div style={{marginBottom:"28px"}}>
        <div style={{fontSize:"10px",fontWeight:"900",color:"rgba(0,0,0,0.28)",fontFamily:"'Nunito',sans-serif",letterSpacing:"3px",marginBottom:"8px"}}>ZONE DASHBOARD</div>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(24px,3vw,34px)",fontWeight:"900",color:"#1a1a2e",margin:0}}>Your <span style={{color:zc.color}}>Wellness</span> Overview</h1>
      </div>

      {daysUntilFull <= 0 && (
        <div style={{...gc,background:"linear-gradient(135deg,rgba(163,45,45,0.09),rgba(226,75,74,0.06))",border:`1.5px solid ${zc.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:"16px",flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <div style={{width:"40px",height:"40px",borderRadius:"12px",background:zc.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0}}>🔁</div>
            <div>
              <div style={{fontSize:"11px",fontWeight:"900",color:zc.color,fontFamily:"'Nunito',sans-serif",letterSpacing:"2px",marginBottom:"2px"}}>FULL RE-ASSESSMENT DUE</div>
              <div style={{fontSize:"13px",color:"rgba(0,0,0,0.6)",fontWeight:"600",fontFamily:"'DM Sans',sans-serif"}}>It's been {daysSinceFull} days — time for your full zone re-check.</div>
            </div>
          </div>
          <button onClick={onFullCheckin} className="primary-btn" style={{padding:"10px 22px",border:"none",borderRadius:"14px",background:zc.grad,color:"#fff",fontWeight:"800",fontSize:"13px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",flexShrink:0}}>Start Re-check →</button>
        </div>
      )}

      {daysUntilMini <= 0 && daysUntilFull > 0 && (
        <div style={{...gc,background:"linear-gradient(135deg,rgba(102,126,234,0.09),rgba(118,75,162,0.06))",border:"1.5px solid rgba(102,126,234,0.2)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"16px",flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <div style={{width:"40px",height:"40px",borderRadius:"12px",background:"linear-gradient(135deg,#667eea,#764ba2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0}}>📋</div>
            <div>
              <div style={{fontSize:"11px",fontWeight:"900",color:"#667eea",fontFamily:"'Nunito',sans-serif",letterSpacing:"2px",marginBottom:"2px"}}>WEEKLY CHECK-IN DUE</div>
              <div style={{fontSize:"13px",color:"rgba(0,0,0,0.6)",fontWeight:"600",fontFamily:"'DM Sans',sans-serif"}}>A quick 5-question check-in to track your progress.</div>
            </div>
          </div>
          <button onClick={() => setShowMiniModal(true)} className="primary-btn" style={{padding:"10px 22px",border:"none",borderRadius:"14px",background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",fontWeight:"800",fontSize:"13px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",flexShrink:0}}>Start Check-in →</button>
        </div>
      )}

      {/* Hero */}
      <div className="fade-up delay-1" style={{...gc,background:"linear-gradient(135deg,rgba(255,255,255,0.82),rgba(255,255,255,0.65))",padding:"28px 32px"}}>
        <div style={{position:"absolute",top:"-30px",right:"-30px",width:"200px",height:"200px",background:zc.glowColor,filter:"blur(60px)",borderRadius:"50%",opacity:0.3,pointerEvents:"none"}}/>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"20px",flexWrap:"wrap",position:"relative"}}>
          <div style={{flex:1,minWidth:"200px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
              <span style={{fontSize:"28px"}}>{zc.emoji}</span>
              <div>
                <div style={{fontSize:"10px",fontWeight:"900",color:"rgba(0,0,0,0.3)",fontFamily:"'Nunito',sans-serif",letterSpacing:"2.5px"}}>CURRENT ZONE STATUS</div>
                <div style={{fontSize:"22px",fontWeight:"900",color:zc.color,fontFamily:"'Nunito',sans-serif",lineHeight:1.1}}>{zc.label}</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"14px"}}>
              <span style={{fontSize:"11px",fontWeight:"900",color:"rgba(0,0,0,0.35)",fontFamily:"'Nunito',sans-serif"}}>Stability:</span>
              <span style={{padding:"3px 12px",borderRadius:"20px",fontSize:"11px",fontWeight:"900",color:stabilityColor,background:`${stabilityColor}14`,fontFamily:"'Nunito',sans-serif",border:`1px solid ${stabilityColor}30`}}>{stabilityEmoji} {stability}</span>
            </div>
            {effectivePlan?.insight && <p style={{fontSize:"13px",color:"rgba(0,0,0,0.5)",lineHeight:1.75,margin:0,fontStyle:"italic",fontFamily:"'DM Sans',sans-serif",maxWidth:"400px"}}>"{effectivePlan.insight}"</p>}
          </div>
          <div style={{display:"flex",gap:"24px",alignItems:"center",flexShrink:0}}>
            <CountdownRing days={daysUntilMini} label={daysUntilMini<=0?"Check-in Due!":"Until Mini Check-in"} total={7}  color="#667eea"       glowColor="rgba(102,126,234,0.35)" urgent={daysUntilMini<=0}/>
            <CountdownRing days={daysUntilFull} label={daysUntilFull<=0?"Re-check Due!":"Until Full Re-check"}  total={14} color={zc.lightColor} glowColor={zc.glowColor}            urgent={daysUntilFull<=0}/>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="fade-up delay-1" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"14px",marginBottom:"16px"}}>
        {[
          {icon:"📊",label:"Risk Score",        value:`${current.finalScore??0}`, sub:`/${current.maxScore??120}`, color:zc.lightColor,  glow:zc.glowColor},
          {icon:"📋",label:"Total Assessments", value:`${totalAssessments}`,       sub:"completed",                color:"#667eea",      glow:"rgba(102,126,234,0.3)"},
          {icon:stabilityEmoji,label:"Stability",value:stability,                  sub:"zone trend",               color:stabilityColor, glow:`${stabilityColor}44`},
        ].map((s,i)=>(
          <div key={i} style={{...gc,textAlign:"center",padding:"22px 18px",marginBottom:0}}>
            <div style={{position:"absolute",top:"-10px",right:"-10px",width:"60px",height:"60px",background:s.glow,filter:"blur(20px)",borderRadius:"50%",opacity:0.4}}/>
            <div style={{fontSize:"24px",marginBottom:"6px"}}>{s.icon}</div>
            <div style={{fontSize:"22px",fontWeight:"900",color:s.color,fontFamily:"'Nunito',sans-serif",lineHeight:1}}>{s.value}</div>
            <div style={{fontSize:"11px",fontWeight:"700",color:"rgba(0,0,0,0.4)",fontFamily:"'Nunito',sans-serif",marginTop:"4px"}}>{s.label}</div>
            <div style={{fontSize:"10px",color:"rgba(0,0,0,0.25)",fontWeight:"500",marginTop:"2px"}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Action Plan */}
      {(effectivePlan || aiPlanLoading) && (
        <div className="fade-up delay-2" style={gc}>
          <div style={{position:"absolute",top:"-20px",right:"-20px",width:"120px",height:"120px",background:zc.glowColor,filter:"blur(40px)",borderRadius:"50%",opacity:0.25,pointerEvents:"none"}}/>
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"20px",position:"relative"}}>
            <div style={{width:"38px",height:"38px",borderRadius:"12px",background:"linear-gradient(135deg,#667eea,#764ba2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0,boxShadow:"0 4px 14px rgba(102,126,234,0.4)"}}>💡</div>
            <div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"18px",fontWeight:"900",color:"#1a1a2e"}}>AI Action Plan</div>
              <div style={{fontSize:"11px",color:"rgba(0,0,0,0.35)",fontWeight:"600",fontFamily:"'Nunito',sans-serif"}}>Personalised from your frontend AI key · updated with each check-in</div>
            </div>
            <div style={{marginLeft:"auto",padding:"4px 12px",borderRadius:"20px",background:`${stabilityColor}14`,border:`1px solid ${stabilityColor}30`,fontSize:"10px",fontWeight:"900",color:stabilityColor,fontFamily:"'Nunito',sans-serif"}}>{stabilityEmoji} {stability}</div>
          </div>
          {aiPlanLoading ? (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px"}}>
              {["Diet", "Movement", "Self-Care"].map((title) => (
                <div key={title} style={{background:"rgba(255,255,255,0.55)",borderRadius:"16px",padding:"18px 16px",border:"1px solid rgba(255,255,255,0.85)"}}>
                  <div style={{fontSize:"12px",fontWeight:"900",color:"#667eea",fontFamily:"'Nunito',sans-serif",marginBottom:"12px"}}>{title}</div>
                  {[0,1,2].map((idx) => (
                    <div key={idx} style={{height:"14px",borderRadius:"10px",background:"rgba(102,126,234,0.12)",marginBottom:"10px",animation:"shimmer 1.6s ease-in-out infinite"}}/>
                  ))}
                </div>
              ))}
            </div>
          ) : (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px"}}>
            {[
              {icon:"🥗",title:"Diet",     key:"diet",     color:"#1D9E75",glow:"rgba(29,158,117,0.3)"},
              {icon:"🏃",title:"Movement", key:"movement", color:"#667eea", glow:"rgba(102,126,234,0.3)"},
              {icon:"🧘",title:"Self-Care",key:"selfCare", color:"#b565a7", glow:"rgba(181,101,167,0.3)"},
            ].map(cat=>(
              <div key={cat.key} style={{background:"rgba(255,255,255,0.55)",borderRadius:"16px",padding:"18px 16px",border:"1px solid rgba(255,255,255,0.85)",boxShadow:`0 4px 16px ${cat.glow}`}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"12px"}}>
                  <div style={{width:"32px",height:"32px",borderRadius:"10px",background:`${cat.color}14`,border:`1px solid ${cat.color}28`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"15px",flexShrink:0}}>{cat.icon}</div>
                  <div style={{fontSize:"12px",fontWeight:"900",color:cat.color,fontFamily:"'Nunito',sans-serif"}}>{cat.title}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:"7px"}}>
                  {(effectivePlan?.[cat.key]||[]).slice(0,3).map((item,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"6px"}}>
                      <div style={{width:"5px",height:"5px",borderRadius:"50%",background:cat.color,marginTop:"6px",flexShrink:0}}/>
                      <span style={{fontSize:"11.5px",color:"rgba(0,0,0,0.6)",lineHeight:1.6,fontFamily:"'DM Sans',sans-serif",fontWeight:"500"}}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          )}
          {effectivePlan?.insight && (
            <div style={{marginTop:"14px",padding:"12px 18px",borderRadius:"12px",background:zc.gradSoft,border:`1px solid ${zc.border}`,display:"flex",gap:"10px",alignItems:"flex-start"}}>
              <span style={{fontSize:"16px",flexShrink:0}}>💬</span>
              <p style={{margin:0,fontSize:"13px",fontStyle:"italic",color:"rgba(0,0,0,0.55)",fontWeight:"600",fontFamily:"'DM Sans',sans-serif",lineHeight:1.6}}>{effectivePlan.insight}</p>
            </div>
          )}
        </div>
      )}

      {/* Doctor recommendation for moderate/high risk */}
      {(currZone === "moderate" || currZone === "high") && (
        <div className="fade-up delay-3" style={{...gc,background:"linear-gradient(135deg,rgba(255,235,225,0.85),rgba(255,240,235,0.78))",border:`1.5px solid ${zc.border}`}}>
          <div style={{position:"absolute",top:"-20px",right:"-20px",width:"100px",height:"100px",background:zc.glowColor,filter:"blur(30px)",borderRadius:"50%",opacity:0.35,pointerEvents:"none"}}/>
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"18px",position:"relative"}}>
            <div style={{width:"42px",height:"42px",borderRadius:"12px",background:zc.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0,boxShadow:`0 4px 14px ${zc.glowColor}`}}>👩‍⚕️</div>
            <div>
              <div style={{fontSize:"11px",fontWeight:"900",color:zc.color,fontFamily:"'Nunito',sans-serif",letterSpacing:"2px",marginBottom:"2px"}}>RECOMMENDED SUPPORT</div>
              <div style={{fontSize:"16px",fontWeight:"800",color:"#1a1a2e",fontFamily:"'Playfair Display',serif"}}>Connect with Dr. Lata Singh</div>
            </div>
          </div>
          <div style={{background:"rgba(255,255,255,0.65)",border:`1px solid ${zc.border}`,borderRadius:"14px",padding:"16px 18px",marginBottom:"16px"}}>
            <div style={{fontSize:"14px",fontWeight:"900",color:"#1a1a2e",marginBottom:"4px"}}>Dr. Lata Singh</div>
            <div style={{fontSize:"12px",fontWeight:"700",color:zc.color,marginBottom:"8px"}}>MBBS, MD (Obstetrics & Gynecology)</div>
            <div style={{fontSize:"12px",color:"rgba(0,0,0,0.65)",lineHeight:1.6,marginBottom:"10px"}}>Specialized in PCOD/PCOS management, hormonal wellness, and menstrual health with 12+ years of experience.</div>
            <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px"}}>
              <span style={{fontSize:"14px"}}>📞</span>
              <span style={{fontSize:"13px",fontWeight:"700",color:"#1a1a2e"}}>{currZone === "moderate" ? "7045754607" : "7045754607"}</span>
            </div>
            <div style={{fontSize:"11px",color:"rgba(0,0,0,0.5)",fontWeight:"600"}}>Available for consultation</div>
          </div>
          <div style={{padding:"12px 16px",borderRadius:"12px",background:zc.gradSoft,border:`1px solid ${zc.border}`,marginBottom:"16px"}}>
            <p style={{margin:0,fontSize:"13px",color:zc.color,fontWeight:"700",lineHeight:1.6}}>
              {currZone === "moderate" 
                ? "Professional guidance can help clarify your symptoms and create a personalized treatment plan." 
                : "Given your assessment results, we strongly recommend scheduling a consultation to discuss your health and next steps."}
            </p>
          </div>
          <button onClick={() => onGoToDoctorConnect && onGoToDoctorConnect(localTracker)} style={{width:"100%",padding:"12px 18px",border:"none",borderRadius:"12px",background:zc.grad,color:"#fff",fontWeight:"800",fontSize:"13px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:`0 4px 12px ${zc.glowColor}`,transition:"all 0.2s ease"}}>
            Connect with Dr. Lata Singh 👩‍⚕️
          </button>
        </div>
      )}

      {/* Zone comparison */}
      {prevZone && (
        <div className="fade-up delay-2" style={gc}>
          {sL("📊","YOUR PROGRESS")}
          <div style={{display:"flex",alignItems:"center",gap:"16px",flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:"120px",padding:"16px 20px",borderRadius:"14px",background:"rgba(0,0,0,0.04)",border:"1px solid rgba(0,0,0,0.07)",textAlign:"center"}}>
              <div style={{fontSize:"10px",fontWeight:"900",color:"rgba(0,0,0,0.3)",fontFamily:"'Nunito',sans-serif",letterSpacing:"2px",marginBottom:"6px"}}>LAST ZONE</div>
              <div style={{fontSize:"18px",marginBottom:"4px"}}>{ZONE_CONFIG[prevZone]?.emoji}</div>
              <div style={{fontSize:"15px",fontWeight:"900",color:ZONE_CONFIG[prevZone]?.color,fontFamily:"'Nunito',sans-serif"}}>{ZONE_CONFIG[prevZone]?.label}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",flexShrink:0}}>
              <div style={{fontSize:"28px"}}>{zoneImproved?"⬇️":zoneWorsened?"⬆️":"➡️"}</div>
              <div style={{fontSize:"11px",fontWeight:"800",color:zoneImproved?"#1D9E75":zoneWorsened?"#A32D2D":"#BA7517",fontFamily:"'Nunito',sans-serif"}}>{zoneImproved?"Improved ✅":zoneWorsened?"Worsened ⚠️":"No Change"}</div>
            </div>
            <div style={{flex:1,minWidth:"120px",padding:"16px 20px",borderRadius:"14px",background:zc.gradSoft,border:`1px solid ${zc.border}`,textAlign:"center"}}>
              <div style={{fontSize:"10px",fontWeight:"900",color:zc.color,fontFamily:"'Nunito',sans-serif",letterSpacing:"2px",marginBottom:"6px"}}>CURRENT ZONE</div>
              <div style={{fontSize:"18px",marginBottom:"4px"}}>{zc.emoji}</div>
              <div style={{fontSize:"15px",fontWeight:"900",color:zc.color,fontFamily:"'Nunito',sans-serif"}}>{zc.label}</div>
            </div>
          </div>
          <div style={{marginTop:"14px",padding:"12px 16px",borderRadius:"12px",background:zoneImproved?"rgba(29,158,117,0.07)":zoneWorsened?"rgba(163,45,45,0.07)":"rgba(186,117,23,0.07)",border:`1px solid ${zoneImproved?"rgba(29,158,117,0.18)":zoneWorsened?"rgba(163,45,45,0.18)":"rgba(186,117,23,0.18)"}`}}>
            <p style={{margin:0,fontSize:"13px",color:"rgba(0,0,0,0.55)",fontWeight:"600",fontFamily:"'DM Sans',sans-serif",lineHeight:1.6}}>
              {zoneImproved?"🎉 Great progress! Your zone has improved since your last assessment.":zoneWorsened?"⚠️ Your zone has worsened. Consider the action plan and consult your doctor.":"➡️ Your zone remains unchanged. Stay consistent with your wellness plan."}
            </p>
          </div>
        </div>
      )}

      {!showDoctor && (
        <div className="fade-up delay-3" style={{...gc, background:"linear-gradient(135deg,rgba(255,236,236,0.8),rgba(255,247,243,0.8))", border:"1px solid rgba(196,94,138,0.2)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px", flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:"10px",fontWeight:"900",color:"#c45e8a",fontFamily:"'Nunito',sans-serif",letterSpacing:"2px",marginBottom:"3px"}}>TEST MODE</div>
            <div style={{fontSize:"13px",fontWeight:"600",color:"rgba(0,0,0,0.6)",fontFamily:"'DM Sans',sans-serif"}}>
              Need to test doctor flow now? Enable test mode to show doctor CTA instantly.
            </div>
          </div>
          <button
            onClick={() => onGoToDoctorConnect && onGoToDoctorConnect(localTracker)}
            className="primary-btn"
            style={{padding:"10px 18px",border:"none",borderRadius:"12px",background:"linear-gradient(135deg,#c45e8a,#e88ab8)",color:"#fff",fontWeight:"800",fontSize:"12px",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}
          >
            Doctor Test
          </button>
        </div>
      )}

      {/* Doctor CTA */}
      {showDoctor && (
        <div className="fade-up delay-4" style={{...gc,background:"linear-gradient(135deg,rgba(255,225,225,0.85),rgba(255,240,235,0.78))",border:"1.5px solid rgba(163,45,45,0.22)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"20px",flexWrap:"wrap"}}>
          <div style={{position:"absolute",top:"-20px",right:"-20px",width:"100px",height:"100px",background:"rgba(163,45,45,0.25)",filter:"blur(30px)",borderRadius:"50%",opacity:0.35,pointerEvents:"none"}}/>
          <div style={{display:"flex",alignItems:"center",gap:"14px",flex:1,minWidth:0,position:"relative"}}>
            <div style={{width:"44px",height:"44px",borderRadius:"12px",background:"linear-gradient(135deg,#A32D2D,#E24B4A)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",flexShrink:0}}>👩‍⚕️</div>
            <div>
              <div style={{fontSize:"11px",fontWeight:"900",color:"#A32D2D",fontFamily:"'Nunito',sans-serif",letterSpacing:"2px",marginBottom:"3px"}}>CONSULT A DOCTOR</div>
              <div style={{marginBottom:"8px",padding:"10px 12px",borderRadius:"12px",background:"rgba(255,255,255,0.62)",border:"1px solid rgba(163,45,45,0.12)"}}>
                <div style={{fontSize:"10px",fontWeight:"900",color:"#A32D2D",fontFamily:"'Nunito',sans-serif",letterSpacing:"1.5px",marginBottom:"4px"}}>AI CARE NOTE</div>
                <div style={{fontSize:"12.5px",fontWeight:"600",color:"rgba(0,0,0,0.58)",fontFamily:"'DM Sans',sans-serif",lineHeight:1.6}}>
                  {careLoading ? "Writing a gentle care note for you..." : careAdvice || buildCareFallback(currZone, highRiskCount)}
                </div>
              </div>
              {doctorRequest?.triggered && (
                <div style={{fontSize:"13px",fontWeight:"600",color:"rgba(0,0,0,0.6)",fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>
                  {doctorRequest.doctorResponse || "Our wellness team will review your symptoms and respond within 24 hours."}
                </div>
              )}
            </div>
          </div>
          {!doctorRequest?.triggered&&(
            <div style={{display:"flex",gap:"8px",flexShrink:0,position:"relative"}}>
              <button onClick={() => onGoToDoctorConnect && onGoToDoctorConnect(localTracker)} style={{padding:"10px 18px",border:"none",borderRadius:"12px",color:"#fff",fontWeight:"800",fontSize:"12px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",background:"linear-gradient(135deg,#25D366,#128C7E)",whiteSpace:"nowrap"}}>👩‍⚕️ Connect with Doctor</button>
              {forceDoctorCta && (
                <button
                  onClick={() => {
                    setForceDoctorCta(false);
                    try { window.localStorage.removeItem("doctorCtaTestMode"); } catch {}
                  }}
                  style={{padding:"10px 14px",border:"1px solid rgba(0,0,0,0.14)",borderRadius:"12px",background:"rgba(255,255,255,0.8)",color:"rgba(0,0,0,0.6)",fontWeight:"800",fontSize:"12px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",whiteSpace:"nowrap"}}
                >
                  Disable Test
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {showMiniModal&&(
        <MiniCheckinModal zc={zc} onClose={()=>setShowMiniModal(false)} onSubmit={(data)=>{
          setShowMiniModal(false);
          if(data.tracker) setLocalTracker(data.tracker);
          if(data.daysUntilMini!==undefined) setLocalDays({daysSinceFull:data.daysSinceFull,daysSinceMini:data.daysSinceMini,daysUntilMini:data.daysUntilMini,daysUntilFull:data.daysUntilFull});
          if(onMiniCheckin) onMiniCheckin(data);
        }}/>
      )}
    </div>
  );
}

function AIInsightsSection({ zc, zoneKey, score, confidencePct, detected, lifestyleAnswers }) {
  const [insights,setInsights]=useState(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    let alive = true;

    if (!OPENROUTER_KEY) {
      setInsights(buildInsightFallback(zoneKey));
      setLoading(false);
      return () => {
        alive = false;
      };
    }

    setLoading(true);
    runAIJson(
      [{
        role: "user",
        content: `You are a compassionate women's health AI for a PCOD wellness app.
Zone: ${zoneKey}
Score: ${score}
Confidence: ${confidencePct}%
Symptoms: ${(detected || []).join(", ") || "none"}
Lifestyle: ${(lifestyleAnswers || []).map((item) => `${item.question}: ${item.answer}`).join("; ") || "none"}

Return ONLY valid JSON:
{
  "summary": "one warm summary sentence",
  "insights": [
    {"title":"...","body":"...","icon":"🌸"},
    {"title":"...","body":"...","icon":"💡"},
    {"title":"...","body":"...","icon":"🌿"}
  ]
}`,
      }],
      (parsed) => typeof parsed?.summary === "string" && Array.isArray(parsed?.insights) && parsed.insights.length > 0
    )
      .then((parsed) => {
        if (alive) setInsights(parsed);
      })
      .catch(() => {
        if (alive) {
          setInsights(buildInsightFallback(zoneKey));
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [confidencePct, detected, lifestyleAnswers, score, zoneKey]);
  const gc={background:"rgba(255,255,255,0.62)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderRadius:"20px",padding:"22px 26px",border:"1px solid rgba(255,255,255,0.88)",boxShadow:"0 6px 28px rgba(0,0,0,0.07)",marginBottom:"16px",position:"relative",overflow:"hidden"};
  if(loading) return <div style={{...gc,display:"flex",alignItems:"center",justifyContent:"center",gap:"14px",padding:"36px"}}><div style={{fontSize:"24px",animation:"spin 2s linear infinite"}}>🌸</div><p style={{margin:0,color:zc.color,fontWeight:"700",fontFamily:"'Nunito',sans-serif",fontSize:"14px"}}>Generating your AI insights…</p></div>;
  if(!insights) return null;
  return (
    <div className="fade-up delay-3" style={gc}>
      <div style={{position:"absolute",top:"-20px",right:"-20px",width:"120px",height:"120px",background:zc.glowColor,filter:"blur(40px)",borderRadius:"50%",opacity:0.25,pointerEvents:"none"}}/>
      <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"20px",position:"relative"}}>
        <div style={{width:"38px",height:"38px",borderRadius:"12px",background:"linear-gradient(135deg,#667eea,#764ba2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0,boxShadow:"0 4px 14px rgba(102,126,234,0.4)"}}>🧠</div>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"18px",fontWeight:"900",color:"#1a1a2e"}}>AI Insights</div>
          <div style={{fontSize:"11px",color:"rgba(0,0,0,0.35)",fontWeight:"600",fontFamily:"'Nunito',sans-serif"}}>Personalised for you · based on your results</div>
        </div>
      </div>
      {insights.summary&&<div style={{padding:"14px 18px",borderRadius:"14px",background:zc.gradSoft,border:`1px solid ${zc.border}`,marginBottom:"16px",display:"flex",gap:"10px",alignItems:"flex-start"}}><span style={{fontSize:"16px",flexShrink:0}}>💬</span><p style={{margin:0,fontSize:"13.5px",fontStyle:"italic",color:"rgba(0,0,0,0.6)",fontWeight:"600",fontFamily:"'DM Sans',sans-serif",lineHeight:1.7}}>{insights.summary}</p></div>}
      <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
        {(insights.insights||[]).map((ins,i)=>(
          <div key={i} style={{display:"flex",gap:"14px",alignItems:"flex-start",background:"rgba(255,255,255,0.6)",borderRadius:"14px",padding:"16px 18px",border:"1px solid rgba(255,255,255,0.85)"}}>
            <div style={{width:"38px",height:"38px",borderRadius:"12px",background:zc.gradSoft,border:`1px solid ${zc.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0}}>{ins.icon||"🌸"}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:"13px",fontWeight:"800",color:zc.color,fontFamily:"'Nunito',sans-serif",marginBottom:"5px"}}>{ins.title}</div>
              <div style={{fontSize:"13px",color:"rgba(0,0,0,0.6)",lineHeight:1.7,fontFamily:"'DM Sans',sans-serif",fontWeight:"500"}}>{ins.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ZoneReport({ result, onGoToDashboard, onGoToDoctorConnect }) {
  const [part,         setPart]         = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [tracker,      setTracker]      = useState(null);
  const [daysData,     setDaysData]     = useState(null);
  const contentRef  = useRef(null);
  // ✅ KEY FIX: sync is called at most ONCE per ZoneReport mount (per quiz result)
  const syncedRef   = useRef(false);

  // On mount: READ ONLY — just fetch current tracker, do NOT sync here
  useEffect(() => {
    fetch(`${API}/zones/me`, { credentials:"include" })
      .then(r => r.json())
      .then(data => {
        if (data.hasZones && data.tracker) {
          setTracker(data.tracker);
          setDaysData({ daysSinceFull:data.daysSinceFull??0, daysSinceMini:data.daysSinceMini??null, daysUntilMini:data.daysUntilMini??7, daysUntilFull:data.daysUntilFull??14 });
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (result?.zone === "healthy") { setTimeout(()=>setShowConfetti(true),100); setTimeout(()=>setShowConfetti(false),3300); }
  }, [result]);

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTo({ top:0, behavior:"smooth" });
  }, [part]);

  if (!result && !tracker) {
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f5eefa"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:"48px",marginBottom:"12px",animation:"spin 2s linear infinite"}}>🌸</div>
          <p style={{color:"#9b7cc0",fontWeight:"700",fontFamily:"'Nunito',sans-serif"}}>Loading your zone report…</p>
        </div>
      </div>
    );
  }

  const fallbackResult = tracker?.current
    ? {
        zone: tracker.current.zone || "mild",
        score: tracker.current.finalScore ?? 0,
        finalScore: tracker.current.finalScore ?? 0,
        maxScore: tracker.current.maxScore ?? 120,
        confidencePct: tracker.current.confidencePct ?? 0,
        detectedSymptoms: tracker.current.detectedSymptoms || [],
        persistentRisk: tracker.current.persistentRisk || false,
        lifestyleAnswers: tracker.current.lifestyleAnswers || [],
      }
    : null;

  const viewResult = result || fallbackResult || {
    zone: "mild",
    score: 0,
    finalScore: 0,
    maxScore: 120,
    confidencePct: 0,
    detectedSymptoms: [],
    persistentRisk: false,
    lifestyleAnswers: [],
  };

  const activeZone    = tracker?.current?.zone || viewResult?.zone || "mild";
  const zc            = ZONE_CONFIG[activeZone] || ZONE_CONFIG.mild;
  const detected      = viewResult.detectedSymptoms || [];
  const score         = viewResult.score ?? viewResult.finalScore ?? 0;
  const maxScore      = viewResult.maxScore ?? 120;
  const confidencePct = viewResult.confidencePct ?? 0;
  const persistentRisk = viewResult.persistentRisk || false;
  const showPersistentRiskDoctorCta =
    persistentRisk && (activeZone === "moderate" || activeZone === "high");
  const lifestyleAnswers = viewResult.result?.lifestyleAnswers || viewResult.lifestyleAnswers || [];

  // ✅ Sync called ONCE, guarded by syncedRef
  const handleSyncAndGoToDashboard = async () => {
    try {
      if (!syncedRef.current) {
        syncedRef.current = true;
        await fetch(`${API}/zones/sync`, { method:"POST", credentials:"include", headers:{"Content-Type":"application/json"} });
      }
      const res  = await fetch(`${API}/zones/me`, { credentials:"include" });
      const data = await res.json();
      if (data.hasZones && data.tracker) {
        setTracker(data.tracker);
        setDaysData({ daysSinceFull:data.daysSinceFull??0, daysSinceMini:data.daysSinceMini??null, daysUntilMini:data.daysUntilMini??7, daysUntilFull:data.daysUntilFull??14 });
      }
    } catch(e) { console.error(e); }
    setPart(3);
    if (onGoToDashboard) onGoToDashboard();
  };

  const gc = {
    background:"rgba(255,255,255,0.62)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",
    borderRadius:"20px",padding:"22px 26px",border:"1px solid rgba(255,255,255,0.88)",
    boxShadow:"0 6px 28px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.95)",
    marginBottom:"16px",position:"relative",overflow:"hidden",
  };
  const sL = (icon,text) => (
    <div style={{fontSize:"10px",fontWeight:"900",color:"rgba(0,0,0,0.45)",fontFamily:"'Nunito',sans-serif",letterSpacing:"2.5px",marginBottom:"14px",display:"flex",alignItems:"center",gap:"6px"}}>
      <span>{icon}</span><span>{text}</span>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",fontFamily:"'DM Sans',sans-serif",position:"relative"}}>
      <div style={{position:"fixed",inset:0,zIndex:0,backgroundImage:`url(${zc.bgImage})`,backgroundSize:"cover",backgroundPosition:"center",filter:"blur(20px) brightness(0.92) saturate(1.15)",transform:"scale(1.1)",pointerEvents:"none"}}/>
      <div style={{position:"fixed",inset:0,zIndex:1,background:zc.overlay,pointerEvents:"none"}}/>
      <div style={{position:"fixed",top:"20%",left:"15%",width:"300px",height:"300px",background:zc.glowColor,filter:"blur(80px)",borderRadius:"50%",opacity:0.3,pointerEvents:"none",zIndex:1}}/>
      <div style={{position:"fixed",bottom:"20%",right:"15%",width:"250px",height:"250px",background:zc.glowColor,filter:"blur(60px)",borderRadius:"50%",opacity:0.2,pointerEvents:"none",zIndex:1}}/>
      {showConfetti&&<Confetti/>}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&family=Nunito:wght@600;700;800;900&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes shimmer{0%,100%{opacity:0.4}50%{opacity:0.8}}
        .fade-up{animation:fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both;}
        .delay-1{animation-delay:0.08s;}.delay-2{animation-delay:0.16s;}.delay-3{animation-delay:0.24s;}.delay-4{animation-delay:0.32s;}.delay-5{animation-delay:0.40s;}
        .primary-btn:hover{transform:translateY(-2px)!important;filter:brightness(1.08);}
        .nav-pill:hover{background:rgba(255,255,255,0.35)!important;}
        .sym-card:hover{transform:translateY(-2px);background:rgba(255,255,255,0.75)!important;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.15);border-radius:4px;}
      `}</style>

      <div style={{position:"relative",zIndex:2,display:"flex",minHeight:"100vh"}}>

        {/* SIDEBAR */}
        <div style={{width:"270px",flexShrink:0,position:"sticky",top:0,height:"100vh",padding:"24px 16px",boxSizing:"border-box",background:"rgba(255,255,255,0.42)",backdropFilter:"blur(28px)",WebkitBackdropFilter:"blur(28px)",borderRight:"1px solid rgba(255,255,255,0.65)",overflowY:"auto",display:"flex",flexDirection:"column"}}>
          <div style={{textAlign:"center",marginBottom:"20px"}}>
            <div style={{position:"relative",display:"inline-block",marginBottom:"14px"}}>
              <div style={{position:"absolute",inset:"-4px",borderRadius:"22px",background:zc.grad,opacity:0.3,filter:"blur(8px)"}}/>
              <img src={zc.bgImage} alt={zc.label} style={{width:"110px",height:"110px",objectFit:"cover",borderRadius:"18px",border:"3px solid rgba(255,255,255,0.95)",boxShadow:`0 8px 28px rgba(0,0,0,0.15), 0 0 0 1px ${zc.border}`,display:"block",position:"relative"}}/>
              <div style={{position:"absolute",bottom:"-8px",left:"50%",transform:"translateX(-50%)",background:zc.grad,borderRadius:"20px",padding:"3px 12px",fontSize:"10px",fontWeight:"900",color:"#fff",fontFamily:"'Nunito',sans-serif",whiteSpace:"nowrap"}}>{zc.badge}</div>
            </div>
            <div style={{fontSize:"9px",fontWeight:"900",color:"rgba(0,0,0,0.3)",fontFamily:"'Nunito',sans-serif",letterSpacing:"2.5px",marginBottom:"8px",marginTop:"12px"}}>YOUR PCOD RISK ZONE</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",marginBottom:"8px"}}>
              <span style={{fontSize:"22px"}}>{zc.emoji}</span>
              <span style={{fontSize:"20px",fontWeight:"900",color:zc.color,fontFamily:"'Nunito',sans-serif"}}>{zc.label}</span>
            </div>
            <p style={{fontSize:"12px",color:"rgba(0,0,0,0.62)",fontWeight:"600",lineHeight:1.7,margin:0,whiteSpace:"pre-line",fontFamily:"'DM Sans',sans-serif"}}>{zc.subtitle}</p>
          </div>

          {daysData && (
            <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"16px"}}>
              {[
                {icon:"📋",label:"Mini Check-in",due:daysData.daysUntilMini<=0,text:daysData.daysUntilMini<=0?"Due now!":`${daysData.daysUntilMini}d left`,color:"#667eea"},
                {icon:"🔁",label:"Full Re-check", due:daysData.daysUntilFull<=0,text:daysData.daysUntilFull<=0?"Due now!":`${daysData.daysUntilFull}d left`,color:zc.color},
              ].map((row,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:"12px",background:row.due?`${row.color}18`:"rgba(255,255,255,0.4)",border:row.due?`1px solid ${row.color}30`:"1px solid rgba(255,255,255,0.6)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                    <span style={{fontSize:"14px"}}>{row.icon}</span>
                    <span style={{fontSize:"11px",fontWeight:"700",color:"rgba(0,0,0,0.5)",fontFamily:"'Nunito',sans-serif"}}>{row.label}</span>
                  </div>
                  <span style={{fontSize:"12px",fontWeight:"900",color:row.due?row.color:"rgba(0,0,0,0.45)",fontFamily:"'Nunito',sans-serif"}}>{row.text}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{height:"1px",background:"linear-gradient(90deg,transparent,rgba(0,0,0,0.1),transparent)",marginBottom:"16px"}}/>
          <div style={{fontSize:"9px",fontWeight:"900",color:"rgba(0,0,0,0.28)",fontFamily:"'Nunito',sans-serif",letterSpacing:"2.5px",marginBottom:"14px"}}>BREAKDOWN</div>
          <StatBar label="Confidence Score"  value={confidencePct}   displayValue={`${confidencePct}%`} max={100}      color={zc.lightColor} glowColor={zc.glowColor}/>
          <StatBar label="Symptoms Detected" value={detected.length} displayValue={detected.length}     max={8}        color="#b565a7"        glowColor="rgba(181,101,167,0.3)"/>
          <StatBar label="Risk Score"        value={score}           displayValue={score}               max={maxScore} color={zc.lightColor} glowColor={zc.glowColor}/>

          <div style={{height:"1px",background:"linear-gradient(90deg,transparent,rgba(0,0,0,0.1),transparent)",margin:"16px 0"}}/>

          <div style={{display:"flex",flexDirection:"column",gap:"6px",marginBottom:"16px"}}>
            {[{id:1,label:"Zone Reveal",emoji:"🎯",desc:"Your risk summary"},{id:2,label:"Full Report",emoji:"📋",desc:"Deep dive + AI insights"},{id:3,label:"Dashboard",emoji:"🏠",desc:"Track & check-in"}].map(p=>(
              <button key={p.id} className="nav-pill" onClick={()=>setPart(p.id)}
                style={{display:"flex",alignItems:"center",gap:"10px",width:"100%",padding:"11px 14px",borderRadius:"14px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",fontSize:"13px",fontWeight:"800",textAlign:"left",transition:"all 0.18s ease",border:`1.5px solid ${part===p.id?zc.border:"transparent"}`,background:part===p.id?"rgba(255,255,255,0.65)":"transparent",color:part===p.id?zc.color:"#555",boxShadow:part===p.id?`0 4px 16px ${zc.glowColor}`:"none"}}>
                <span style={{fontSize:"18px"}}>{p.emoji}</span>
                <div><div>{p.label}</div><div style={{fontSize:"10px",fontWeight:"600",color:"rgba(0,0,0,0.35)",marginTop:"1px"}}>{p.desc}</div></div>
              </button>
            ))}
          </div>

          <button onClick={handleSyncAndGoToDashboard} className="primary-btn"
            style={{width:"100%",padding:"12px",border:"none",borderRadius:"16px",background:zc.grad,color:"#fff",fontWeight:"800",fontSize:"13px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:`0 6px 20px ${zc.glowColor}`,transition:"all 0.2s ease",marginTop:"auto"}}>
            Go to Dashboard 🌸
          </button>
        </div>

        {/* CONTENT */}
        <div ref={contentRef} style={{flex:1,padding:"48px 52px 80px",overflowY:"auto",maxHeight:"100vh",boxSizing:"border-box"}}>

          {/* PART 1 */}
          {part===1&&(
            <div className="fade-up">
              <div style={{...gc,background:"linear-gradient(135deg,rgba(255,255,255,0.75),rgba(255,255,255,0.55))",marginBottom:"24px",padding:"32px 36px"}}>
                <div style={{position:"absolute",top:"-30px",right:"-30px",width:"200px",height:"200px",background:zc.glowColor,filter:"blur(60px)",borderRadius:"50%",opacity:0.3,pointerEvents:"none"}}/>
                <div style={{display:"flex",alignItems:"center",gap:"16px",marginBottom:"16px",position:"relative"}}>
                  <div style={{padding:"6px 16px",borderRadius:"30px",background:zc.gradSoft,border:`1px solid ${zc.border}`,fontSize:"11px",fontWeight:"900",color:zc.color,fontFamily:"'Nunito',sans-serif",letterSpacing:"1px"}}>{zc.emoji} {zc.badge}</div>
                  <div style={{fontSize:"10px",fontWeight:"700",color:"rgba(0,0,0,0.3)",fontFamily:"'Nunito',sans-serif",letterSpacing:"2px"}}>PCOD RISK ASSESSMENT RESULT</div>
                </div>
                <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(28px,3.5vw,40px)",fontWeight:"900",color:"#1a1a2e",margin:"0 0 12px",lineHeight:1.15}}>
                  {zc.label} <span style={{color:zc.color}}>Zone</span>
                </h1>
                <p style={{fontSize:"15px",color:"rgba(0,0,0,0.5)",lineHeight:1.8,margin:"0 0 20px",fontWeight:"500",maxWidth:"560px"}}>{zc.explanation}</p>
                <div style={{padding:"14px 20px",borderRadius:"14px",background:zc.gradSoft,border:`1px solid ${zc.border}`,display:"inline-block"}}>
                  <p style={{fontSize:"14px",color:zc.color,fontWeight:"700",margin:0,fontStyle:"italic"}}>{zc.subtext}</p>
                </div>
              </div>

              <div className="fade-up delay-1" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"14px",marginBottom:"16px"}}>
                {[
                  {icon:"🎯",label:"Confidence",     val:`${confidencePct}%`,      sub:"Assessment accuracy",    color:zc.color,      glow:zc.glowColor},
                  {icon:"🩺",label:"Symptoms Found", val:`${detected.length} / 8`, sub:"PCOD indicators",        color:"#b565a7",     glow:"rgba(181,101,167,0.3)"},
                  {icon:"📊",label:"Risk Score",     val:`${score}`,               sub:`out of ${maxScore} max`, color:zc.lightColor, glow:zc.glowColor},
                ].map((s,i)=>(
                  <div key={i} style={{...gc,textAlign:"center",padding:"24px 20px",marginBottom:0}}>
                    <div style={{position:"absolute",top:"-10px",right:"-10px",width:"60px",height:"60px",background:s.glow,filter:"blur(20px)",borderRadius:"50%",opacity:0.4}}/>
                    <div style={{fontSize:"28px",marginBottom:"8px"}}>{s.icon}</div>
                    <div style={{fontSize:"28px",fontWeight:"900",color:s.color,fontFamily:"'Nunito',sans-serif",lineHeight:1}}>{s.val}</div>
                    <div style={{fontSize:"13px",fontWeight:"700",color:"rgba(0,0,0,0.55)",fontFamily:"'Nunito',sans-serif",margin:"4px 0 2px"}}>{s.label}</div>
                    <div style={{fontSize:"11px",color:"rgba(0,0,0,0.3)",fontWeight:"500"}}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {detected.length>0&&(
                <div className="fade-up delay-2" style={gc}>
                  {sL("🔍","DETECTED PATTERNS")}
                  <div style={{display:"flex",flexDirection:"column",gap:"9px"}}>
                    {detected.map((sym,i)=>(
                      <div key={i} className="sym-card" style={{display:"flex",alignItems:"center",gap:"14px",background:"rgba(255,255,255,0.55)",border:`1px solid ${zc.border}`,borderRadius:"14px",padding:"14px 18px",transition:"all 0.2s ease"}}>
                        <div style={{width:"38px",height:"38px",borderRadius:"10px",background:zc.gradSoft,border:`1px solid ${zc.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",flexShrink:0}}>{SYMPTOM_ICONS[sym]||"🌸"}</div>
                        <div style={{flex:1}}><div style={{fontSize:"13px",fontWeight:"700",color:"rgba(0,0,0,0.65)",fontFamily:"'DM Sans',sans-serif"}}>{SYMPTOM_LABELS[sym]||sym}</div></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="fade-up delay-3" style={{...gc,background:zc.gradSoft,border:`1.5px solid ${zc.border}`,textAlign:"center",padding:"32px"}}>
                <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"200px",height:"80px",background:zc.glowColor,filter:"blur(40px)",borderRadius:"50%",opacity:0.3,pointerEvents:"none"}}/>
                <div style={{fontSize:"36px",marginBottom:"12px"}}>📋</div>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:"900",color:"#1a1a2e",margin:"0 0 8px"}}>Your complete wellness report is ready</h3>
                <p style={{fontSize:"14px",color:"rgba(0,0,0,0.45)",marginBottom:"20px",lineHeight:1.6}}>See clear insights, practical next steps, and a personalized plan tailored to your current zone.</p>
                <button onClick={()=>setPart(2)} className="primary-btn" style={{padding:"14px 36px",border:"none",borderRadius:"22px",background:zc.grad,color:"#fff",fontWeight:"800",fontSize:"15px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:`0 8px 28px ${zc.glowColor}`}}>View Full Report → ✨</button>
              </div>
            </div>
          )}

          {/* PART 2 */}
          {part===2&&(
            <div className="fade-up">
              <div style={{marginBottom:"28px"}}>
                <div style={{fontSize:"10px",fontWeight:"900",color:"rgba(0,0,0,0.28)",fontFamily:"'Nunito',sans-serif",letterSpacing:"3px",marginBottom:"8px"}}>FULL WELLNESS REPORT</div>
                <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(24px,3vw,34px)",fontWeight:"900",color:"#1a1a2e",margin:0}}>Your <span style={{color:zc.color}}>{zc.label}</span> Analysis</h1>
              </div>

              <div className="fade-up delay-1" style={{...gc,background:"linear-gradient(135deg,rgba(255,255,255,0.82),rgba(255,255,255,0.65))"}}>
                <div style={{position:"absolute",top:"-20px",right:"-20px",width:"100px",height:"100px",background:zc.glowColor,filter:"blur(35px)",borderRadius:"50%",opacity:0.3,pointerEvents:"none"}}/>
                <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"18px",position:"relative"}}>
                  <div style={{width:"42px",height:"42px",borderRadius:"12px",background:zc.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"19px",flexShrink:0,boxShadow:`0 4px 14px ${zc.glowColor}`}}>💡</div>
                  <div>
                    <div style={{fontSize:"10px",fontWeight:"900",color:"rgba(0,0,0,0.38)",fontFamily:"'Nunito',sans-serif",letterSpacing:"2.5px",marginBottom:"2px"}}>WHAT THIS MEANS</div>
                    <div style={{fontSize:"16px",fontWeight:"800",color:"#1a1a2e",fontFamily:"'Playfair Display',serif"}}>Understanding Your Zone</div>
                  </div>
                </div>
                <p style={{fontSize:"14.5px",color:"rgba(0,0,0,0.78)",lineHeight:2.0,margin:"0 0 18px",fontWeight:"500",fontFamily:"'DM Sans',sans-serif"}}>{zc.explanation}</p>
                <div style={{display:"inline-flex",alignItems:"center",gap:"12px",padding:"14px 20px",borderRadius:"14px",background:zc.grad,boxShadow:`0 4px 16px ${zc.glowColor}`}}>
                  <span style={{fontSize:"16px",flexShrink:0}}>📌</span>
                  <p style={{fontSize:"14px",color:"#fff",fontWeight:"700",margin:0,lineHeight:1.6,fontFamily:"'DM Sans',sans-serif"}}>{zc.subtext}</p>
                </div>
              </div>

              <div className="fade-up delay-2" style={{...gc,marginBottom:"16px"}}>
                {sL("📊","PCOD RISK METER")}
                <RiskMeter score={score} maxScore={maxScore} color={zc.color} glowColor={zc.glowColor}/>
              </div>

              {lifestyleAnswers.length>0&&(
                <div className="fade-up delay-2" style={gc}>
                  {sL("🌿","LIFESTYLE INSIGHTS")}
                  <div style={{display:"flex",flexDirection:"column",gap:"9px"}}>
                    {lifestyleAnswers.map((la,i)=>{
                      const isRisk=la.answer==="Often"||la.answer==="Always";
                      const isGood=la.answer==="Never";
                      return (
                        <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px",background:isRisk?"rgba(216,90,48,0.07)":isGood?"rgba(29,158,117,0.07)":"rgba(255,255,255,0.45)",border:`1px solid ${isRisk?"rgba(216,90,48,0.18)":isGood?"rgba(29,158,117,0.18)":"rgba(255,255,255,0.7)"}`,borderRadius:"12px",padding:"12px 16px"}}>
                          <div style={{display:"flex",alignItems:"center",gap:"8px",flex:1}}>
                            <span style={{fontSize:"16px"}}>{isRisk?"⚠️":isGood?"✅":"💬"}</span>
                            <span style={{fontSize:"12px",fontWeight:"500",color:"rgba(0,0,0,0.72)",lineHeight:1.5,fontFamily:"'DM Sans',sans-serif"}}>{la.question}</span>
                          </div>
                          <span style={{fontSize:"11px",fontWeight:"800",color:isRisk?"#c45020":isGood?"#1a6b4a":"#7a5500",fontFamily:"'Nunito',sans-serif",background:isRisk?"rgba(216,90,48,0.10)":isGood?"rgba(29,158,117,0.10)":"rgba(186,117,23,0.10)",padding:"4px 12px",borderRadius:"20px",flexShrink:0,whiteSpace:"nowrap"}}>{la.answer}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {showPersistentRiskDoctorCta&&(
                <div className="fade-up delay-3" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"20px",background:"linear-gradient(135deg,rgba(255,225,225,0.85),rgba(255,240,235,0.78))",backdropFilter:"blur(20px)",borderRadius:"18px",padding:"18px 24px",border:`1.5px solid ${zc.border}`,marginBottom:"16px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:"-20px",right:"-20px",width:"100px",height:"100px",background:zc.glowColor,filter:"blur(30px)",borderRadius:"50%",opacity:0.35,pointerEvents:"none"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:"14px",flex:1,minWidth:0}}>
                    <div style={{width:"44px",height:"44px",borderRadius:"12px",background:`linear-gradient(135deg,${zc.color},${zc.lightColor})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",flexShrink:0}}>⚠️</div>
                    <div>
                      <div style={{fontSize:"11px",fontWeight:"900",color:zc.color,fontFamily:"'Nunito',sans-serif",letterSpacing:"2px",marginBottom:"3px"}}>PERSISTENT RISK DETECTED</div>
                      <div style={{fontSize:"13.5px",fontWeight:"600",color:"rgba(0,0,0,0.65)",fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>You've landed in the <strong style={{color:zc.color}}>same zone 2+ times</strong> — this strongly suggests consulting a gynecologist soon.</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:"8px",flexShrink:0}}>
                    <button onClick={() => onGoToDoctorConnect && onGoToDoctorConnect(tracker)} style={{padding:"10px 18px",border:"none",borderRadius:"12px",color:"#fff",fontWeight:"800",fontSize:"12px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",background:"linear-gradient(135deg,#25D366,#128C7E)",whiteSpace:"nowrap"}}>👩‍⚕️ Connect with Doctor</button>
                    <button onClick={()=>window.open("https://www.practo.com/","_blank")} style={{padding:"10px 18px",border:"none",borderRadius:"12px",color:"#fff",fontWeight:"800",fontSize:"12px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",background:`linear-gradient(135deg,${zc.color},${zc.lightColor})`,whiteSpace:"nowrap"}}>📅 Book</button>
                  </div>
                </div>
              )}

              <AIInsightsSection
                zc={zc}
                zoneKey={activeZone}
                score={score}
                confidencePct={confidencePct}
                detected={detected}
                lifestyleAnswers={lifestyleAnswers}
              />

              <div className="fade-up delay-5" style={{display:"flex",gap:"12px",alignItems:"flex-start",background:"rgba(255,255,255,0.35)",borderRadius:"16px",padding:"16px 20px",border:"1px solid rgba(255,255,255,0.65)",marginBottom:"16px"}}>
                <span style={{fontSize:"16px",flexShrink:0}}>🔒</span>
                <p style={{margin:0,fontSize:"11px",color:"rgba(0,0,0,0.35)",lineHeight:1.75,fontWeight:"500"}}><strong style={{color:"rgba(0,0,0,0.45)"}}>Disclaimer:</strong> This is a wellness screening tool, not a medical diagnosis. Always consult a qualified gynecologist for professional advice.</p>
              </div>
            </div>
          )}

          {/* PART 3 */}
          {part===3&&tracker&&(
            <ZoneDashboard tracker={tracker} zc={zc} daysData={daysData} riskLoopCount={(tracker?.riskEvents || []).filter((event) => event.level === "high").length}
              onGoToDoctorConnect={onGoToDoctorConnect}
              onMiniCheckin={(data)=>{
                if(data.tracker) setTracker(data.tracker);
                if(data.daysUntilMini!==undefined) setDaysData({daysSinceFull:data.daysSinceFull,daysSinceMini:data.daysSinceMini,daysUntilMini:data.daysUntilMini,daysUntilFull:data.daysUntilFull});
              }}
              onFullCheckin={()=>setPart(1)}
            />
          )}
          {part===3&&!tracker&&(
            <div style={{textAlign:"center",padding:"80px 0"}}>
              <div style={{fontSize:"48px",marginBottom:"16px",animation:"spin 2s linear infinite"}}>🌸</div>
              <p style={{color:zc.color,fontWeight:"700",fontFamily:"'Nunito',sans-serif",fontSize:"15px"}}>Loading your dashboard…</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}