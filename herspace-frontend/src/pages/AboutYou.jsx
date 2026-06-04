import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import dashBg from "../assets/dashboard.png";
import aboutGirl from "../assets/aboutYou-girl.png";

const AGE_GROUPS = [
  { label: "Teen",            range: "13–17", emoji: "🌱", color: "#7ab3e8", light: "rgba(122,179,232,0.15)", value: "teen" },
  { label: "Young Adult",     range: "18–25", emoji: "✨", color: "#b565a7", light: "rgba(181,101,167,0.15)", value: "young" },
  { label: "Adult",           range: "26–35", emoji: "💎", color: "#7c5cbf", light: "rgba(124,92,191,0.15)",  value: "adult" },
  { label: "Hormone Balance Stage", range: "35+", emoji: "🌸", color: "#c45e8a", light: "rgba(196,94,138,0.15)", value: "hormonal" },
];
const LIFE_STAGES = [
  { label: "Student",               emoji: "📚", desc: "School / College" },
  { label: "College / Early Career",emoji: "🎓", desc: "Just starting out" },
  { label: "Working Professional",  emoji: "💼", desc: "Full-time career" },
  { label: "Homemaker",             emoji: "🏡", desc: "Managing home & family" },
];
const SUPPORT_TYPES = [
  { label: "Structure",             emoji: "📅", desc: "Routines & discipline" },
  { label: "Emotional Balance",     emoji: "💞", desc: "Mood & mental health" },
  { label: "Energy Boost",          emoji: "⚡", desc: "Beat fatigue & tiredness" },
  { label: "Long-term Optimization",emoji: "🚀", desc: "Advanced wellness goals" },
];
const SLEEP_OPTIONS  = ["Less than 5 hrs 😵", "5–6 hrs 😴", "7–8 hrs 😌", "9+ hrs 🛌"];
const STRESS_OPTIONS = ["Low 😊", "Moderate 😐", "High 😟", "Very High 😰"];
const RANDOM_QUOTE = [
  "Your body is your most loyal companion. Treat her well. 🌸",
  "Wellness is not a destination, it's a daily act of self-love. ✨",
  "Small steps every day lead to a healthier, happier you. 💎",
][Math.floor(Math.random() * 3)];

const TOTAL_STEPS = 6;

export default function AboutYou({ onComplete, onBack }) {
  const [authChecked, setAuthChecked] = useState(false);
  const [step, setStep]               = useState(0);
  const [direction, setDirection]     = useState("next");
  const [animKey, setAnimKey]         = useState(0);
  const [form, setForm]               = useState({ name: "", ageGroup: null, lifeStage: "", supportType: [], sleep: "", stress: "" });
  const [error, setError]             = useState("");
  const [submitted, setSubmitted]     = useState(false);

  // ✅ Auth check on mount — must be logged in
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          credentials: "include",
        });
        if (!res.ok) { onBack(); return; }
        setAuthChecked(true);
      } catch {
        onBack();
      }
    };
    verifyAuth();
  }, [onBack]);

  // ✅ REMOVED: checkProfile useEffect that was skipping the form silently
  // Dashboard already handles this — if userData exists, it goes straight to RapidFire
  // AboutYou should always show the form when explicitly opened

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(""); };
  const goTo = (nextStep, dir = "next") => { setDirection(dir); setAnimKey(k => k + 1); setStep(nextStep); setError(""); };

  const validateStep = () => {
    if (step === 1 && !form.name.trim())              return "Please tell us your name 💕";
    if (step === 2 && !form.ageGroup)                 return "Please pick your age group";
    if (step === 3 && !form.lifeStage)                return "Please pick your life stage";
    if (step === 4 && form.supportType.length === 0)  return "Please pick at least one";
    if (step === 5 && !form.sleep)                    return "Please pick your sleep pattern";
    if (step === 6 && !form.stress)                   return "Please pick your stress level";
    return "";
  };

  const handleNext = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    if (step < TOTAL_STEPS) { goTo(step + 1, "next"); return; }
    if (submitted) return;
    setSubmitted(true);
    const cat = form.ageGroup;

    try {
      const res = await fetch("http://localhost:5000/api/about", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:        form.name,
          ageGroup:    form.ageGroup.value,
          lifeStage:   form.lifeStage,
          supportType: form.supportType,
          sleep:       form.sleep,
          stress:      form.stress,
        }),
      });

      const data = await res.json();

      // ✅ FIX: 409 means profile already exists — use PUT to update instead
      if (res.status === 409) {
        // Profile already exists — try updating it with new data
        const putRes = await fetch("http://localhost:5000/api/about", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name:        form.name,
            ageGroup:    form.ageGroup.value,
            lifeStage:   form.lifeStage,
            supportType: form.supportType,
            sleep:       form.sleep,
            stress:      form.stress,
          }),
        });
        const putData = await putRes.json();
        if (!putRes.ok) {
          setError(putData.message || "Could not update profile. Please try again.");
          setSubmitted(false);
          return;
        }
        // Updated successfully — proceed
      } else if (!res.ok) {
        setError(data.message || "Something went wrong. Please try again.");
        setSubmitted(false);
        return;
      }

      // ✅ Success — show toast and proceed
      toast.success(
        <div style={{ fontFamily: "'Nunito', sans-serif" }}>
          <div style={{ fontSize: "15px", fontWeight: "900", marginBottom: "4px" }}>
            🎉 You are in <span style={{ color: cat.color }}>{cat.label} Wellness Category ({cat.range})</span>
          </div>
          <div style={{ fontSize: "12px", opacity: 0.85 }}>Let's do a quick Rapid Fire to understand your lifestyle! 🔥</div>
        </div>,
        { position: "top-center", autoClose: 2500, style: { borderRadius: "18px", fontFamily: "'Nunito',sans-serif", minWidth: "340px" } }
      );
      setTimeout(() => onComplete({ ...form, category: cat }), 2600);

    } catch (e) {
      console.error("SaveAboutYou error:", e);
      setError("Network error. Please check your connection.");
      setSubmitted(false);
    }
  };

  const handleBack = () => { if (step === 0) { onBack(); return; } goTo(step - 1, "prev"); };
  const progress = step === 0 ? 0 : (step / TOTAL_STEPS) * 100;

  if (!authChecked) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#ede0f7", flexDirection:"column", gap:"16px" }}>
      <div style={{ fontSize:"48px" }}>🔒</div>
      <p style={{ color:"#7c5cbf", fontWeight:"700", fontFamily:"'Nunito', sans-serif", fontSize:"15px" }}>Checking authentication...</p>
    </div>
  );

  return (
    <div style={S.root}>
      <div style={S.bgImage} />
      <div style={S.bgOverlay} />
      <ToastContainer />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&family=Nunito:wght@600;700;800;900&display=swap');
        @keyframes slideInNext { from{opacity:0;transform:translateX(60px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideInPrev { from{opacity:0;transform:translateX(-60px)} to{opacity:1;transform:translateX(0)} }
        @keyframes starTwinkle { 0%,100%{opacity:0;transform:scale(0.3)} 50%{opacity:1;transform:scale(1.2)} }
        @keyframes bigSparkle  { 0%,100%{opacity:0;transform:scale(0) rotate(0deg)} 40%{opacity:0.9;transform:scale(1.3) rotate(45deg)} }
        @keyframes popWelcome  { from{opacity:0;transform:scale(0.92) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .slide-next   { animation: slideInNext 0.38s cubic-bezier(0.22,1,0.36,1) both; }
        .slide-prev   { animation: slideInPrev 0.38s cubic-bezier(0.22,1,0.36,1) both; }
        .welcome-anim { animation: popWelcome 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
        .sel-card  { transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1)!important; cursor:pointer; }
        .sel-card:hover  { transform:translateY(-5px) scale(1.04)!important; box-shadow:0 10px 28px rgba(148,108,210,0.28)!important; }
        .pill-opt  { transition: all 0.18s ease!important; }
        .pill-opt:hover  { transform:translateY(-3px) scale(1.05)!important; }
        .next-btn:hover  { transform:translateY(-2px); box-shadow:0 10px 32px rgba(148,108,210,0.5)!important; }
        .back-lnk:hover  { color:#7c5cbf!important; }
        input:focus { outline:none; border-color:rgba(181,101,167,0.6)!important; box-shadow:0 0 0 3px rgba(181,101,167,0.12)!important; }
      `}</style>

      {[...Array(14)].map((_, i) => (
        <div key={i} style={{ position:"fixed", pointerEvents:"none", zIndex:2, top:`${(i*17.3)%95}%`, left:`${(i*13.7)%95}%`, fontSize:`${10+(i*3)%10}px`, animation:`${i%2===0?"bigSparkle":"starTwinkle"} ${3+(i*0.6)%4}s ${(i*0.5)%7}s ease-in-out infinite`, opacity:0 }}>
          {i%3===0?"✨":i%3===1?"⭐":"💫"}
        </div>
      ))}

      {/* ══ INTRO ══ */}
      {step === 0 && (
        <div style={S.pageWide}>
          <div className="welcome-anim" style={S.splitCard}>
            <div style={{ flex:"0 0 35%", background:"rgba(255,255,255,0.82)", backdropFilter:"blur(28px)", WebkitBackdropFilter:"blur(28px)", padding:"40px 36px", display:"flex", flexDirection:"column", justifyContent:"center" }}>
              <div style={{ marginBottom:"20px" }}>
                <button onClick={handleBack} className="back-lnk" style={S.backBtn}>← Back</button>
              </div>
              <div style={{ fontSize:"44px", marginBottom:"12px" }}>🌸</div>
              <h1 style={{ ...S.title, textAlign:"left", marginBottom:"10px" }}>Let's get to<br/>know you</h1>
              <p style={{ ...S.sub, textAlign:"left", margin:"0 0 18px" }}>
                Answer 6 quick questions and we'll personalize your entire wellness journey just for you.
              </p>
              <div style={{ ...S.quoteBox, margin:"0 0 18px", maxWidth:"100%" }}>
                <span style={{ fontSize:"18px" }}>💬</span>
                <p style={S.quoteText}>"{RANDOM_QUOTE}"</p>
              </div>
              <div style={{ display:"flex", gap:"8px", marginBottom:"24px" }}>
                {["🌸","🫧","🍀","🍓","⭐️"].map((e,i) => (
                  <span key={i} style={{ fontSize:"18px", opacity:0.75 }}>{e}</span>
                ))}
              </div>
              <button onClick={() => { setStep(1); setAnimKey(k=>k+1); setDirection("next"); }}
                style={{ width:"100%", padding:"15px", border:"none", borderRadius:"22px", background:"linear-gradient(135deg,#b565a7,#7c5cbf,#4a7fc1)", color:"#fff", fontWeight:"900", fontSize:"15px", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 6px 22px rgba(181,101,167,0.45)" }}>
                Let's Begin ✨
              </button>
            </div>
            <div style={{ flex:"0 0 65%", position:"relative", overflow:"hidden", background:"linear-gradient(160deg,#fce8f3,#ede0f7)" }}>
              <img src={aboutGirl} alt="about you" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center center", display:"block" }} />
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right,rgba(255,255,255,0.18) 0%,transparent 18%)", pointerEvents:"none" }} />
            </div>
          </div>
        </div>
      )}

      {/* ══ STEPS 1–6 ══ */}
      {step > 0 && (
        <div style={S.page}>
          <div style={S.card}>
            <div style={S.topBar}>
              <button onClick={handleBack} className="back-lnk" style={S.backBtn}>← Prev</button>
              <span style={S.stepLabel}>{step} / {TOTAL_STEPS}</span>
              <span style={S.badge}>📋 About You</span>
            </div>
            <div style={S.barBg}>
              <div style={{ ...S.barFill, width:`${progress}%`, transition:"width 0.4s ease" }} />
            </div>
            <div key={animKey} className={direction==="next"?"slide-next":"slide-prev"} style={S.stepWrap}>

              {step===1 && (
                <div>
                  <QLabel num="01" text="What should we call you? ✨" />
                  <input autoFocus value={form.name} onChange={e=>set("name",e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleNext()} placeholder="e.g. Priya, Ananya..." style={S.input} />
                </div>
              )}

              {step===2 && (
                <div>
                  <QLabel num="02" text="What age group do you belong to? 🎂" />
                  <div style={S.cardGrid}>
                    {AGE_GROUPS.map(ag => {
                      const sel = form.ageGroup?.value===ag.value;
                      return (
                        <button key={ag.value} className="sel-card" onClick={()=>{ setForm(f=>({...f,ageGroup:ag})); setError(""); setTimeout(()=>goTo(3,"next"),300); }}
                          style={{ ...S.selCard, background:sel?ag.light:"rgba(255,255,255,0.6)", border:sel?`2px solid ${ag.color}`:"1.5px solid rgba(181,101,167,0.18)", boxShadow:sel?`0 6px 24px ${ag.light}`:"0 2px 8px rgba(181,101,167,0.06)" }}>
                          <span style={{fontSize:"30px"}}>{ag.emoji}</span>
                          <div style={{fontWeight:"800",fontSize:"14px",color:sel?ag.color:"#3d2060",fontFamily:"'Nunito',sans-serif"}}>{ag.label}</div>
                          <div style={{fontSize:"12px",color:sel?ag.color:"#9b7cc0",fontWeight:"700"}}>{ag.range}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step===3 && (
                <div>
                  <QLabel num="03" text="What best describes your current life stage? 💫" />
                  <div style={S.cardGrid}>
                    {LIFE_STAGES.map(ls => {
                      const sel = form.lifeStage===ls.label;
                      return (
                        <button key={ls.label} className="sel-card" onClick={()=>{ setForm(f=>({...f,lifeStage:ls.label})); setError(""); setTimeout(()=>goTo(4,"next"),300); }}
                          style={{ ...S.selCard, background:sel?"linear-gradient(135deg,rgba(181,101,167,0.18),rgba(148,108,210,0.18))":"rgba(255,255,255,0.6)", border:sel?"2px solid rgba(181,101,167,0.5)":"1.5px solid rgba(181,101,167,0.18)", boxShadow:sel?"0 6px 24px rgba(181,101,167,0.2)":"0 2px 8px rgba(181,101,167,0.06)" }}>
                          <span style={{fontSize:"30px"}}>{ls.emoji}</span>
                          <div style={{fontWeight:"800",fontSize:"13px",color:sel?"#7c5cbf":"#3d2060",fontFamily:"'Nunito',sans-serif"}}>{ls.label}</div>
                          <div style={{fontSize:"11px",color:"#9b7cc0",fontWeight:"600"}}>{ls.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step===4 && (
                <div>
                  <QLabel num="04" text="What kind of support are you looking for? 🎯" />
                  <p style={{fontSize:"12px",color:"#9b7cc0",fontWeight:"700",fontFamily:"'Nunito',sans-serif",margin:"0 0 14px"}}>✨ Select all that apply</p>
                  <div style={S.cardGrid}>
                    {SUPPORT_TYPES.map(st => {
                      const sel = form.supportType.includes(st.label);
                      return (
                        <button key={st.label} className="sel-card" onClick={()=>{ setForm(f=>{ const arr=f.supportType.includes(st.label)?f.supportType.filter(x=>x!==st.label):[...f.supportType,st.label]; return {...f,supportType:arr}; }); setError(""); }}
                          style={{ ...S.selCard, position:"relative", background:sel?"linear-gradient(135deg,rgba(124,92,191,0.18),rgba(74,127,193,0.18))":"rgba(255,255,255,0.6)", border:sel?"2px solid rgba(124,92,191,0.5)":"1.5px solid rgba(181,101,167,0.18)", boxShadow:sel?"0 6px 24px rgba(124,92,191,0.2)":"0 2px 8px rgba(181,101,167,0.06)" }}>
                          {sel && <div style={{position:"absolute",top:"8px",right:"10px",width:"18px",height:"18px",borderRadius:"50%",background:"linear-gradient(135deg,#7c5cbf,#b565a7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",color:"#fff",fontWeight:"900"}}>✓</div>}
                          <span style={{fontSize:"30px"}}>{st.emoji}</span>
                          <div style={{fontWeight:"800",fontSize:"13px",color:sel?"#7c5cbf":"#3d2060",fontFamily:"'Nunito',sans-serif"}}>{st.label}</div>
                          <div style={{fontSize:"11px",color:"#9b7cc0",fontWeight:"600"}}>{st.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step===5 && (
                <div>
                  <QLabel num="05" text="How many hours do you sleep daily? 😴" />
                  <div style={S.pillGrid}>
                    {SLEEP_OPTIONS.map(opt => {
                      const sel = form.sleep===opt;
                      return (
                        <button key={opt} className="pill-opt" onClick={()=>{ setForm(f=>({...f,sleep:opt})); setError(""); setTimeout(()=>goTo(6,"next"),300); }}
                          style={{...S.pillBtn,...(sel?S.pillBtnSel:{})}}>{opt}</button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step===6 && (
                <div>
                  <QLabel num="06" text="What's your current stress level? 🧠" />
                  <div style={S.pillGrid}>
                    {STRESS_OPTIONS.map(opt => {
                      const sel = form.stress===opt;
                      return (
                        <button key={opt} className="pill-opt" onClick={()=>set("stress",opt)}
                          style={{...S.pillBtn,...(sel?S.pillBtnSel:{})}}>{opt}</button>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {error && <div style={S.errMsg}>⚠️ {error}</div>}

            <div style={S.navBtns}>
              {step===6 ? (
                <button onClick={handleNext} disabled={submitted} className="next-btn" style={S.nextBtn}>
                  {submitted?"Hold on... ✨":"Submit & Start Rapid Fire 🚀"}
                </button>
              ) : step===2||step===3||step===4||step===5 ? (
                <button onClick={handleNext} className="next-btn" style={{...S.nextBtn,background:"rgba(181,101,167,0.15)",color:"#7c5cbf",boxShadow:"none",border:"1.5px solid rgba(181,101,167,0.3)"}}>Next →</button>
              ) : (
                <button onClick={handleNext} className="next-btn" style={S.nextBtn}>Next →</button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

function QLabel({ num, text }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"20px"}}>
      <div style={{width:"28px",height:"28px",borderRadius:"50%",flexShrink:0,background:"linear-gradient(135deg,#b565a7,#7c5cbf)",color:"#fff",fontSize:"11px",fontWeight:"900",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Nunito',sans-serif",boxShadow:"0 3px 10px rgba(181,101,167,0.35)"}}>{num}</div>
      <div style={{fontSize:"16px",fontWeight:"800",color:"#2d1a4a",fontFamily:"'Nunito',sans-serif",lineHeight:1.35}}>{text}</div>
    </div>
  );
}

const S = {
  root:      { minHeight:"100vh", fontFamily:"'DM Sans',sans-serif", position:"relative", overflow:"hidden", background:"#ede0f7" },
  bgImage:   { position:"fixed", inset:0, zIndex:0, backgroundImage:`url(${dashBg})`, backgroundSize:"cover", backgroundPosition:"center", filter:"blur(14px) brightness(0.82) saturate(1.3)", transform:"scale(1.08)", pointerEvents:"none" },
  bgOverlay: { position:"fixed", inset:0, zIndex:1, background:"linear-gradient(160deg,rgba(240,225,255,0.45) 0%,rgba(220,200,255,0.35) 40%,rgba(200,220,255,0.4) 100%)", pointerEvents:"none" },
  pageWide:  { position:"relative", zIndex:3, maxWidth:"980px", margin:"0 auto", padding:"32px 24px", display:"flex", alignItems:"center", minHeight:"100vh", boxSizing:"border-box" },
  splitCard: { width:"100%", borderRadius:"32px", overflow:"hidden", boxShadow:"0 20px 64px rgba(181,101,167,0.28),0 0 0 1px rgba(200,180,255,0.3)", display:"flex", minHeight:"600px" },
  page:      { position:"relative", zIndex:3, maxWidth:"620px", margin:"0 auto", padding:"40px 24px 60px", display:"flex", alignItems:"center", minHeight:"100vh", boxSizing:"border-box" },
  card:      { width:"100%", background:"rgba(255,255,255,0.68)", backdropFilter:"blur(28px)", WebkitBackdropFilter:"blur(28px)", borderRadius:"32px", padding:"36px 40px", boxShadow:"0 16px 56px rgba(181,101,167,0.2),inset 0 1px 0 rgba(255,255,255,0.95)", border:"1px solid rgba(255,255,255,0.85)" },
  topBar:    { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" },
  backBtn:   { background:"none", border:"none", color:"#9b7cc0", fontWeight:"700", fontSize:"13px", cursor:"pointer", fontFamily:"'Nunito',sans-serif", transition:"color 0.2s" },
  stepLabel: { fontSize:"12px", fontWeight:"800", color:"#b565a7", fontFamily:"'Nunito',sans-serif" },
  badge:     { background:"linear-gradient(135deg,rgba(181,101,167,0.18),rgba(148,108,210,0.18))", color:"#7c5cbf", fontWeight:"800", fontSize:"12px", padding:"6px 14px", borderRadius:"20px", border:"1px solid rgba(181,101,167,0.25)", fontFamily:"'Nunito',sans-serif" },
  barBg:     { height:"5px", background:"rgba(181,101,167,0.15)", borderRadius:"10px", marginBottom:"28px", overflow:"hidden" },
  barFill:   { height:"100%", borderRadius:"10px", background:"linear-gradient(90deg,#b565a7,#7c5cbf,#4a7fc1)" },
  stepWrap:  { minHeight:"260px" },
  title:     { fontFamily:"'Playfair Display',serif", fontSize:"clamp(22px,3vw,28px)", fontWeight:"900", color:"#2d1a4a", margin:"0 0 8px" },
  sub:       { fontSize:"14px", color:"#7a5a9a", lineHeight:1.6 },
  quoteBox:  { display:"flex", gap:"10px", alignItems:"flex-start", background:"linear-gradient(135deg,rgba(181,101,167,0.1),rgba(148,108,210,0.1))", borderRadius:"14px", padding:"12px 16px", border:"1px solid rgba(181,101,167,0.18)" },
  quoteText: { fontSize:"13px", fontStyle:"italic", color:"#5a3a7a", fontWeight:"600", margin:0, lineHeight:1.7 },
  cardGrid:  { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" },
  selCard:   { display:"flex", flexDirection:"column", alignItems:"center", gap:"7px", padding:"18px 10px", borderRadius:"18px", cursor:"pointer", textAlign:"center", backdropFilter:"blur(6px)" },
  input:     { width:"100%", padding:"14px 18px", borderRadius:"16px", border:"1.5px solid rgba(181,101,167,0.25)", background:"rgba(255,255,255,0.75)", fontSize:"15px", color:"#2d1a4a", fontFamily:"'DM Sans',sans-serif", transition:"all 0.2s", boxSizing:"border-box" },
  pillGrid:  { display:"flex", flexDirection:"column", gap:"10px" },
  pillBtn:   { width:"100%", padding:"14px 20px", borderRadius:"16px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:"14px", fontWeight:"600", color:"#5a4070", background:"rgba(255,255,255,0.6)", border:"1.5px solid rgba(181,101,167,0.2)", textAlign:"left", transition:"all 0.18s ease" },
  pillBtnSel:{ background:"linear-gradient(135deg,#b565a7,#7c5cbf)", color:"#fff", border:"2px solid transparent", fontWeight:"700", boxShadow:"0 4px 16px rgba(148,108,210,0.35)" },
  errMsg:    { fontSize:"12px", color:"#c0305a", fontWeight:"700", fontFamily:"'Nunito',sans-serif", textAlign:"center", margin:"10px 0 0", padding:"8px 14px", background:"rgba(220,60,100,0.08)", borderRadius:"10px" },
  navBtns:   { marginTop:"28px" },
  nextBtn:   { width:"100%", padding:"15px", border:"none", borderRadius:"22px", background:"linear-gradient(135deg,#b565a7,#7c5cbf,#4a7fc1)", color:"#fff", fontWeight:"800", fontSize:"15px", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 6px 24px rgba(148,108,210,0.4)", transition:"all 0.2s ease" },
};