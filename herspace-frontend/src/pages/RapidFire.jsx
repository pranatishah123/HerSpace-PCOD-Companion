import React, { useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import dashBg from "../assets/dashboard.png";

// ⭐ CHANGE 1 — Shuffle helper
function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

const SYMPTOM_QUESTIONS = [
  {
    id: "irregularPeriods",
    q: "Have your periods been a bit unpredictable lately? 🌸",
    reassurance: "Don't worry — many women experience this. We're just trying to understand your body better.",
    emoji: "🌸",
    severityLabels: [
      "Rarely — just occasionally off",
      "Sometimes — fairly often irregular",
      "Often — hard to predict most months",
      "Almost always — completely unpredictable",
    ],
  },
  {
    id: "acne",
    q: "Has your skin been acting up lately — more breakouts or oiliness? ✨",
    reassurance: "Skin changes are super common. This helps us spot hormonal patterns early.",
    emoji: "✨",
    severityLabels: [
      "Rarely — mild occasional breakouts",
      "Sometimes — recurring acne",
      "Often — frequent and inflamed",
      "Almost always — severe and persistent",
    ],
  },
  {
    id: "facialHair",
    q: "Have you noticed more facial or body hair than usual? 🌿",
    reassurance: "This is more common than you think. No judgment here — just honest answers help us most.",
    emoji: "🌿",
    severityLabels: [
      "Rarely — just a little noticeable",
      "Sometimes — moderate growth",
      "Often — quite noticeable",
      "Almost always — heavy and fast growing",
    ],
  },
  {
    id: "weightGain",
    q: "Has managing your weight been harder than usual lately? ⚖️",
    reassurance: "Hormonal changes can make this really difficult. You're not alone in this.",
    emoji: "⚖️",
    severityLabels: [
      "Rarely — slightly harder to lose",
      "Sometimes — noticeable changes",
      "Often — significant gain",
      "Almost always — rapid uncontrolled gain",
    ],
  },
  {
    id: "hairThinning",
    q: "Have you been noticing more hair fall than usual? 💆‍♀️",
    reassurance: "Hair fall can be an early signal. Being aware of it is already a great step.",
    emoji: "💆‍♀️",
    severityLabels: [
      "Rarely — just a little more than usual",
      "Sometimes — moderate hair fall",
      "Often — heavy loss",
      "Almost always — visible patches or bald spots",
    ],
  },
  {
    id: "darkPatches",
    q: "Have you noticed darker skin patches on your neck or underarms? 🌑",
    reassurance: "This can be a skin response to hormonal changes. It's good that you're paying attention.",
    emoji: "🌑",
    severityLabels: [
      "Rarely — faint, barely there",
      "Sometimes — noticeable patches",
      "Often — prominent and dark",
      "Almost always — very dark and widespread",
    ],
  },
  {
    id: "moodSwings",
    q: "Have you been feeling more mood swings or fatigue lately? 🌊",
    reassurance: "Your emotional health matters just as much. This is a safe space to be honest.",
    emoji: "🌊",
    severityLabels: [
      "Rarely — occasionally, not too bad",
      "Sometimes — fairly often",
      "Often — most days",
      "Almost always — every single day",
    ],
  },
  {
    id: "ovulationIssues",
    q: "Have you had concerns about ovulation or fertility? 🤍",
    reassurance: "Many women have these concerns. Knowing early helps you take control of your health.",
    emoji: "🤍",
    severityLabels: [
      "Rarely — just a feeling something's off",
      "Sometimes — occasionally irregular",
      "Often — frequently irregular",
      "Almost always — confirmed absent",
    ],
  },
];

// Same symptom ids as SYMPTOM_QUESTIONS (required for backend scoring) — wording by age band
const SYMPTOM_QUESTIONS_TEEN = [
  {
    id: "irregularPeriods",
    q: "Have your periods been a bit all over the place lately? 🌸",
    reassurance: "Lots of teens have irregular cycles at first — we’re just learning your pattern.",
    emoji: "🌸",
    severityLabels: [
      "Rarely — mostly fine",
      "Sometimes — a bit unpredictable",
      "Often — pretty irregular",
      "Almost always — can’t predict at all",
    ],
  },
  {
    id: "acne",
    q: "Has your skin been breaking out more — face or back? ✨",
    reassurance: "Breakouts are super common in your teens. Honest answers help us help you.",
    emoji: "✨",
    severityLabels: [
      "Rarely — a spot here and there",
      "Sometimes — keeps coming back",
      "Often — quite a few spots",
      "Almost always — really bad or painful",
    ],
  },
  {
    id: "facialHair",
    q: "Noticed more hair on your upper lip, chin, or body than your friends? 🌿",
    reassurance: "This happens to many girls — it’s nothing to be embarrassed about.",
    emoji: "🌿",
    severityLabels: [
      "Rarely — barely notice",
      "Sometimes — a little more",
      "Often — pretty noticeable",
      "Almost always — a lot / spreads fast",
    ],
  },
  {
    id: "weightGain",
    q: "Has your weight gone up even when you didn’t change how you eat much? ⚖️",
    reassurance: "Hormones can change how your body holds weight — you’re not alone.",
    emoji: "⚖️",
    severityLabels: [
      "Rarely — a little change",
      "Sometimes — noticeable",
      "Often — clear gain",
      "Almost always — fast / hard to control",
    ],
  },
  {
    id: "hairThinning",
    q: "Is more hair than usual coming out when you brush or wash? 💆‍♀️",
    reassurance: "Noticing hair fall early really helps your doctor if you ever need one.",
    emoji: "💆‍♀️",
    severityLabels: [
      "Rarely — a bit more",
      "Sometimes — clearly more",
      "Often — lots in the brush",
      "Almost always — thin patches / obvious loss",
    ],
  },
  {
    id: "darkPatches",
    q: "Any darker patches on your neck or underarms? 🌑",
    reassurance: "This can be related to insulin — worth tracking, not judging.",
    emoji: "🌑",
    severityLabels: [
      "Rarely — barely see it",
      "Sometimes — a bit darker",
      "Often — clear patches",
      "Almost always — very dark / large areas",
    ],
  },
  {
    id: "moodSwings",
    q: "Do you feel your mood swings more than your friends seem to? 🌊",
    reassurance: "Mood and hormones are linked — your feelings are valid.",
    emoji: "🌊",
    severityLabels: [
      "Rarely — mostly steady",
      "Sometimes — up and down",
      "Often — most days feel rough",
      "Almost always — every day is a rollercoaster",
    ],
  },
  {
    id: "ovulationIssues",
    q: "Do periods sometimes skip or feel very irregular? 🤍",
    reassurance: "Irregular cycles are common in PCOD — tracking helps you stay ahead.",
    emoji: "🤍",
    severityLabels: [
      "Rarely — mostly on track",
      "Sometimes — skips or changes",
      "Often — very unpredictable",
      "Almost always — very long gaps or no period",
    ],
  },
];

const SYMPTOM_QUESTIONS_HORMONAL = [
  {
    id: "irregularPeriods",
    q: "Have your cycles become shorter, longer, or harder to predict (perimenopause)? 🌸",
    reassurance: "Cycle changes in your 40s+ are common — we’re mapping what’s normal for you.",
    emoji: "🌸",
    severityLabels: [
      "Rarely — still fairly predictable",
      "Sometimes — noticeable shifts",
      "Often — clearly irregular",
      "Almost always — very unpredictable / long gaps",
    ],
  },
  {
    id: "acne",
    q: "Adult acne, oiliness, or sudden dryness — has your skin pattern changed? ✨",
    reassurance: "Skin can change a lot as hormones shift — detail helps.",
    emoji: "✨",
    severityLabels: [
      "Rarely — mostly stable",
      "Sometimes — mild flare or dryness",
      "Often — clear hormonal pattern",
      "Almost always — severe or constant issues",
    ],
  },
  {
    id: "facialHair",
    q: "New or faster facial / body hair growth than a few years ago? 🌿",
    reassurance: "Androgen shifts can change hair growth — you’re not imagining it.",
    emoji: "🌿",
    severityLabels: [
      "Rarely — little change",
      "Sometimes — a bit more",
      "Often — clearly more",
      "Almost always — heavy / fast growth",
    ],
  },
  {
    id: "weightGain",
    q: "Weight or waist gain even when habits haven’t changed much? ⚖️",
    reassurance: "Midlife weight shifts are frustrating — hormones play a real role.",
    emoji: "⚖️",
    severityLabels: [
      "Rarely — stable",
      "Sometimes — mild gain",
      "Often — clear gain around middle",
      "Almost always — rapid / hard to budge",
    ],
  },
  {
    id: "hairThinning",
    q: "Scalp thinning, widening part, or more fall than before? 💆‍♀️",
    reassurance: "Hair density changes are a common hormonal signal — worth noting.",
    emoji: "💆‍♀️",
    severityLabels: [
      "Rarely — minimal",
      "Sometimes — more in brush / shower",
      "Often — visible thinning",
      "Almost always — obvious patches / loss",
    ],
  },
  {
    id: "darkPatches",
    q: "Neck / underarm darkening or skin tags — new or worse lately? 🌑",
    reassurance: "Insulin resistance can show on skin — tracking helps your clinician.",
    emoji: "🌑",
    severityLabels: [
      "Rarely — none / faint",
      "Sometimes — noticeable",
      "Often — darker patches",
      "Almost always — widespread / very dark",
    ],
  },
  {
    id: "moodSwings",
    q: "Mood swings, anxiety, or brain fog — feeling more than you used to? 🌊",
    reassurance: "Emotional symptoms in hormonal transition are very real.",
    emoji: "🌊",
    severityLabels: [
      "Rarely — mostly okay",
      "Sometimes — on/off rough patches",
      "Often — most weeks are hard",
      "Almost always — daily struggle",
    ],
  },
  {
    id: "ovulationIssues",
    q: "Concerns about cycle changes, fertility, or bleeding pattern in this life stage? 🤍",
    reassurance: "Questions about timing and symptoms are valid at any age — we’ve got you.",
    emoji: "🤍",
    severityLabels: [
      "Rarely — mild concern",
      "Sometimes — noticeable changes worry me",
      "Often — frequent worry",
      "Almost always — top of mind / affecting life",
    ],
  },
];

function symptomSetForAge(ageKey) {
  if (ageKey === "teen") return SYMPTOM_QUESTIONS_TEEN;
  if (ageKey === "hormonal") return SYMPTOM_QUESTIONS_HORMONAL;
  return SYMPTOM_QUESTIONS;
}

const LIFESTYLE_QUESTIONS = {
  teen: [
    { id: "exercise", q: "How often do you move your body — sports, walks, anything? 🏃‍♀️", emoji: "🏃‍♀️" },
    { id: "junkFood", q: "How often do you reach for chips, soda, or sugary snacks? 🍔",    emoji: "🍔" },
    { id: "sleep",    q: "Is your sleep schedule consistent on school days? 🌙",             emoji: "🌙" },
    { id: "stress",   q: "How often does exam stress just take over your mood? 📚",          emoji: "📚" },
  ],
  young: [
    { id: "exercise", q: "Real talk — how often do you work out or stay active? 💪",          emoji: "💪" },
    { id: "junkFood", q: "How often are you eating out or grabbing processed food? 🥡",       emoji: "🥡" },
    { id: "sleep",    q: "Is your sleep schedule something you'd call consistent? 😴",         emoji: "😴" },
    { id: "stress",   q: "How often does work or college stress overwhelm you? 💼",           emoji: "💼" },
  ],
  adult: [
    { id: "exercise", q: "How often does your week include any physical activity? 🏋️‍♀️",   emoji: "🏋️‍♀️" },
    { id: "junkFood", q: "How often are high-carb or processed meals part of your day? 🍕",  emoji: "🍕" },
    { id: "sleep",    q: "Honestly, how's your sleep quality been lately? 🛌",                emoji: "🛌" },
    { id: "stress",   q: "How often does life stress affect how you feel physically? 🧠",     emoji: "🧠" },
  ],
  hormonal: [
    { id: "exercise", q: "How often do you fit in gentle movement — yoga, walks? 🧘‍♀️",      emoji: "🧘‍♀️" },
    { id: "junkFood", q: "How often do sugary or inflammatory foods sneak into your meals? 🍭", emoji: "🍭" },
    { id: "sleep",    q: "Do you wake up tired even after a full night's sleep? 🌛",           emoji: "🌛" },
    { id: "stress",   q: "How often does stress show up as physical symptoms for you? 🌊",    emoji: "🌊" },
  ],
};

const LIFESTYLE_OPTIONS = [
  { label: "Never",     value: "Never",     emoji: "✅", color: "green" },
  { label: "Sometimes", value: "Sometimes", emoji: "🤔", color: "blue"  },
  { label: "Often",     value: "Often",     emoji: "😟", color: "amber" },
  { label: "Always",    value: "Always",    emoji: "🔴", color: "red"   },
];

const COLOR_STYLES = {
  green: { bg:"rgba(91,158,138,0.12)",  border:"rgba(91,158,138,0.35)",  sel:"linear-gradient(135deg,#5b9e8a,#4a8fa8)" },
  blue:  { bg:"rgba(74,127,193,0.12)",  border:"rgba(74,127,193,0.35)",  sel:"linear-gradient(135deg,#4a7fc1,#5b8fd4)" },
  amber: { bg:"rgba(186,117,23,0.12)",  border:"rgba(186,117,23,0.35)",  sel:"linear-gradient(135deg,#ba7517,#ef9f27)" },
  red:   { bg:"rgba(220,60,100,0.12)",  border:"rgba(220,60,100,0.35)",  sel:"linear-gradient(135deg,#dc3c64,#c45e8a)" },
};

function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i, left: `${(i * 7.3) % 100}%`,
    delay: `${(i * 0.08) % 1.2}s`, duration: `${1.2 + (i * 0.07) % 1}s`,
    size: `${6 + (i * 2) % 8}px`,
    color: ["#1D9E75","#7c5cbf","#4a7fc1","#b565a7","#BA7517","#f5c842"][i % 6],
    shape: i % 3,
  }));
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:100, overflow:"hidden" }}>
      <style>{`
        @keyframes cFall { 0%{opacity:1;transform:translateY(-20px) rotate(0deg)} 100%{opacity:0;transform:translateY(110vh) rotate(720deg)} }
        @keyframes cSway { 0%,100%{margin-left:0} 25%{margin-left:18px} 75%{margin-left:-18px} }
      `}</style>
      {pieces.map(p => (
        <div key={p.id} style={{ position:"absolute", top:"-20px", left:p.left, width:p.size, height:p.size, background:p.color, borderRadius: p.shape===0?"50%":p.shape===1?"2px":"0", animation:`cFall ${p.duration} ${p.delay} ease-in forwards, cSway ${p.duration} ${p.delay} ease-in-out infinite` }}/>
      ))}
    </div>
  );
}

export default function RapidFire({ userData, onGoToZoneReport }) {
  const ageKey   = userData?.ageGroup?.value || userData?.ageGroup || "young";
  const userName = userData?.name || "you";

  // ⭐ Symptom questions: same ids for scoring; copy varies for teen vs 35+ hormonal vs adults
  const [symptomQuestions] = useState(() => shuffleArray(symptomSetForAge(ageKey)));

  // ⭐ CHANGE 3 — Shuffle lifestyle questions
  const [lifestyleQs] = useState(() =>
    shuffleArray(LIFESTYLE_QUESTIONS[ageKey] || LIFESTYLE_QUESTIONS.young)
  );

  // ⭐ CHANGE 4 — Use shuffled array lengths (safe now, both declared above)
  const totalQs = symptomQuestions.length + lifestyleQs.length;

  const [stage,        setStage]        = useState("intro");
  const [sAIndex,      setSAIndex]      = useState(0);
  const [sBIndex,      setSBIndex]      = useState(0);
  const [symAnswers,   setSymAnswers]   = useState({});
  const [symPick,      setSymPick]      = useState(null);
  const [lifAnswers,   setLifAnswers]   = useState([]);
  const [lifPick,      setLifPick]      = useState(null);
  const [animKey,      setAnimKey]      = useState(0);
  const [direction,    setDirection]    = useState("next");
  const [showConfetti, setShowConfetti] = useState(false);

  // ⭐ CHANGE 2 (cont.) — Use shuffled array for current question
  const currentSym  = symptomQuestions[sAIndex]  || symptomQuestions[0];
  const currentLife = lifestyleQs[sBIndex] || lifestyleQs[0];

  // ⭐ CHANGE 5 — Fix progress to use shuffled array length
  const doneQs =
    stage === "submitting"
      ? totalQs
      : stage === "sectionA" || stage === "sectionADetail"
      ? sAIndex
      : stage === "sectionB"
      ? symptomQuestions.length + sBIndex
      : 0;
  const progressPct = Math.round((doneQs / totalQs) * 100);

  const handleSymYesNo = (choice) => {
    setSymPick(choice);
    if (choice === "no") {
      setTimeout(() => {
        const newAnswers = { ...symAnswers, [currentSym.id]: { present: false, severity: 0 } };
        setSymAnswers(newAnswers);
        advanceSectionA();
      }, 400);
    } else {
      setTimeout(() => setStage("sectionADetail"), 400);
    }
  };

  const handleSeverity = (sev) => {
    const newAnswers = { ...symAnswers, [currentSym.id]: { present: true, severity: sev } };
    setSymAnswers(newAnswers);
    setTimeout(() => advanceSectionA(), 400);
  };

  const advanceSectionA = () => {
    const currentIndex = sAIndex;
    const totalSymptoms = symptomQuestions.length;
    if (currentIndex + 1 < totalSymptoms) {
      setSymPick(null); setDirection("next"); setAnimKey(k => k + 1);
      setSAIndex(currentIndex + 1); setStage("sectionA");
    } else {
      setSymPick(null); setDirection("next"); setAnimKey(k => k + 1); setSBIndex(0);
      toast.success("Section A done! You're halfway there 🎉", {
        position: "top-center", autoClose: 2800,
        style: { fontFamily:"'Nunito',sans-serif", fontWeight:"700", fontSize:"13px" },
      });
      setStage("sectionBIntro");
    }
  };

  // ⭐ CHANGE 6 — Include id in lifestyle answer payload + fix stale closure
  const handleLifestyle = (opt) => {
    setLifPick(opt.value);
    const newAnswers = [
      ...lifAnswers,
      {
        id:       currentLife.id,
        question: currentLife.q,
        answer:   opt.value,
      },
    ];
    // capture current index NOW before any state update
    const currentIndex = sBIndex;
    const totalLifestyle = lifestyleQs.length;
    setTimeout(() => {
      setLifAnswers(newAnswers);
      if (currentIndex + 1 < totalLifestyle) {
        setLifPick(null); setDirection("next"); setAnimKey(k => k + 1);
        setSBIndex(currentIndex + 1);
      } else {
        submitAssessment(newAnswers);
      }
    }, 450);
  };

  const submitAssessment = async (finalLifAnswers) => {
    setLifPick(null);
    setSBIndex(lifestyleQs.length);
    setStage("submitting");
    try {
      // ⭐ CHANGE 7 — Map from shuffled array, not original constant
      const symptomAnswers = symptomQuestions.map(q => ({
        symptom:  q.id,
        present:  symAnswers[q.id]?.present  ?? false,
        severity: symAnswers[q.id]?.severity ?? 0,
      }));
      const { data } = await axios.post(
        "http://localhost:5000/api/rapidfire",
        { ageGroup: ageKey, symptomAnswers, lifestyleAnswers: finalLifAnswers },
        { withCredentials: true }
      );

      toast.success("Your PCOD zone is ready! 🌸", {
        position: "top-center", autoClose: 2000,
        style: { fontFamily:"'Nunito',sans-serif", fontWeight:"700", fontSize:"13px" },
      });
      if (data.zone === "healthy") {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3200);
      }

      // Navigate to ZoneReport after toast shows
      setTimeout(() => {
        if (onGoToZoneReport) onGoToZoneReport(data);
      }, 2200);

    } catch (err) {
      console.error("RapidFire submit error:", err);
      setStage("sectionB");
    }
  };

  const handlePrev = () => {
    const activeStages = ["sectionA", "sectionADetail", "sectionB"];
    if (activeStages.includes(stage)) {
      toast("Going back won't lose your answers 💾", {
        position: "top-center", autoClose: 2000,
        style: { fontFamily:"'Nunito',sans-serif", fontWeight:"700", fontSize:"13px" },
      });
    }
    if (stage === "sectionADetail")                { setSymPick(null); setStage("sectionA"); return; }
    if (stage === "sectionA" && sAIndex > 0)       { setDirection("prev"); setAnimKey(k=>k+1); setSAIndex(i=>i-1); setSymPick(null); return; }
    if (stage === "sectionA" && sAIndex === 0)     { setStage("sectionAIntro"); return; }
    if (stage === "sectionBIntro")                 {
      setDirection("prev"); setAnimKey(k=>k+1);
      // ⭐ CHANGE 9 — Use shuffled array length for back nav
      setSAIndex(symptomQuestions.length - 1);
      setStage("sectionA"); setSymPick(null); return;
    }
    if (stage === "sectionB" && sBIndex > 0)       { setDirection("prev"); setAnimKey(k=>k+1); setSBIndex(i=>i-1); setLifAnswers(a=>a.slice(0,-1)); setLifPick(null); return; }
    if (stage === "sectionB" && sBIndex === 0)     { setStage("sectionBIntro"); }
  };

  const showProgress = stage === "sectionA" || stage === "sectionADetail" || stage === "sectionB";

  return (
    <div style={{ ...S.root, background: stage === "submitting" ? "rgba(124,92,191,0.08)" : "#ede0f7", transition:"background 0.8s ease" }}>
      <div style={S.bgImage}/><div style={S.bgOverlay}/>
      {showConfetti && <Confetti/>}
      <style>{CSS}</style>
      <ToastContainer toastStyle={{ borderRadius:"16px", boxShadow:"0 8px 28px rgba(181,101,167,0.2)" }}/>
      {[...Array(10)].map((_,i) => (
        <div key={i} style={{ position:"fixed", pointerEvents:"none", zIndex:2, top:`${(i*17)%95}%`, left:`${(i*13)%95}%`, fontSize:`${10+(i*3)%10}px`, animation:`${i%2===0?"bigSparkle":"starTwinkle"} ${3+(i*0.6)%4}s ${(i*0.5)%6}s ease-in-out infinite`, opacity:0 }}>
          {i%3===0?"✨":i%3===1?"⭐":"💫"}
        </div>
      ))}

      <div style={S.page}>
        <div style={S.card}>

          {/* ══ INTRO ══ */}
          {stage === "intro" && (
            <div className="pop-in" style={{ textAlign:"center" }}>
              <div style={{ fontSize:"54px", marginBottom:"14px" }}>🔥</div>
              <div style={S.badge}>⚡ PCOD Risk Screening</div>
              <h1 style={{ ...S.title, margin:"14px 0 10px" }}>Quick check-in, {userName}!</h1>
              <p style={{ fontSize:"14px", color:"#5a4070", lineHeight:1.75, marginBottom:"20px" }}>
                Answer honestly — this helps us understand your PCOD risk and give you the most accurate zone.
              </p>
              <div style={{ display:"flex", justifyContent:"center", gap:"12px", marginBottom:"28px" }}>
                {[
                  { emoji:"🩺", val:"8",      label:"Symptom Qs" },
                  { emoji:"💬", val:"4",      label:"Lifestyle Qs" },
                  { emoji:"⏱️", val:"~3 min", label:"Duration" },
                ].map((s,i) => (
                  <div key={i} style={S.statBox}>
                    <div style={{ fontSize:"22px" }}>{s.emoji}</div>
                    <div style={{ fontSize:"15px", fontWeight:"900", color:"#2d1a4a", fontFamily:"'Nunito',sans-serif" }}>{s.val}</div>
                    <div style={{ fontSize:"11px", color:"#9b7cc0", fontWeight:"700" }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"24px" }}>
                <div style={{ background:"rgba(181,101,167,0.08)", borderRadius:"14px", padding:"14px 16px", border:"1px solid rgba(181,101,167,0.18)", textAlign:"left" }}>
                  <div style={{ fontSize:"20px", marginBottom:"6px" }}>🩺</div>
                  <div style={{ fontSize:"12px", fontWeight:"800", color:"#7c5cbf", fontFamily:"'Nunito',sans-serif", marginBottom:"4px" }}>Section A</div>
                  <div style={{ fontSize:"11px", color:"#5a4070", fontWeight:"600", lineHeight:1.6 }}>PCOD symptoms — same for everyone</div>
                </div>
                <div style={{ background:"rgba(91,158,138,0.08)", borderRadius:"14px", padding:"14px 16px", border:"1px solid rgba(91,158,138,0.18)", textAlign:"left" }}>
                  <div style={{ fontSize:"20px", marginBottom:"6px" }}>🌿</div>
                  <div style={{ fontSize:"12px", fontWeight:"800", color:"#5b9e8a", fontFamily:"'Nunito',sans-serif", marginBottom:"4px" }}>Section B</div>
                  <div style={{ fontSize:"11px", color:"#5a4070", fontWeight:"600", lineHeight:1.6 }}>Lifestyle questions — personalised for you</div>
                </div>
              </div>
              <button className="start-btn" onClick={() => setStage("sectionAIntro")} style={S.primaryBtn}>
                Let's Begin 🚀
              </button>
            </div>
          )}

          {/* ══ SECTION A INTRO ══ */}
          {stage === "sectionAIntro" && (
            <div className="pop-in" style={{ textAlign:"center" }}>
              <div style={{ fontSize:"52px", marginBottom:"14px" }}>🩺</div>
              <div style={{ ...S.badge, background:"linear-gradient(135deg,rgba(181,101,167,0.2),rgba(124,92,191,0.2))", color:"#7c5cbf" }}>Section A of 2</div>
              <h2 style={{ ...S.title, margin:"16px 0 10px" }}>Symptom Check</h2>
              <p style={{ fontSize:"14px", color:"#5a4070", lineHeight:1.8, marginBottom:"20px" }}>
                We'll ask about <strong>8 common PCOD symptoms</strong>. Tell us if you experience each one — and if yes, how severe.
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"20px", textAlign:"left" }}>
                {[
                  { emoji:"🌸", text:"Irregular periods & ovulation" },
                  { emoji:"✨", text:"Skin, hair & weight changes"   },
                  { emoji:"🌊", text:"Mood swings & energy"          },
                  { emoji:"🤍", text:"Fertility-related concerns"    },
                ].map((item, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:"10px", background:"rgba(181,101,167,0.07)", borderRadius:"12px", padding:"12px 14px", border:"1px solid rgba(181,101,167,0.15)" }}>
                    <span style={{ fontSize:"18px" }}>{item.emoji}</span>
                    <span style={{ fontSize:"12px", fontWeight:"700", color:"#3d2060", fontFamily:"'Nunito',sans-serif" }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <div style={{ background:"rgba(124,92,191,0.07)", borderRadius:"12px", padding:"12px 16px", marginBottom:"20px", border:"1px solid rgba(124,92,191,0.15)" }}>
                <p style={{ fontSize:"12px", color:"#7c5cbf", margin:0, fontWeight:"700", fontFamily:"'Nunito',sans-serif" }}>
                  💡 Answer based on your experience over the last 3–6 months
                </p>
              </div>
              <button className="start-btn" onClick={() => { setStage("sectionA"); setAnimKey(k=>k+1); }} style={S.primaryBtn}>
                Start Section A 🩺
              </button>
              <button onClick={() => setStage("intro")} style={S.ghostBtn}>← Back to overview</button>
            </div>
          )}

          {/* ══ PROGRESS BAR ══ */}
          {showProgress && (
            <>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                <button className="prev-btn" onClick={handlePrev} style={S.prevBtn}>← Back</button>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:"11px", fontWeight:"800", color:"#b565a7", fontFamily:"'Nunito',sans-serif" }}>
                    {stage === "sectionB" ? "Section B — Lifestyle" : "Section A — Symptoms"}
                  </div>
                  <div style={{ fontSize:"11px", color:"#9b7cc0", fontWeight:"700", fontFamily:"'Nunito',sans-serif" }}>
                    {progressPct}% complete
                  </div>
                </div>
                <div style={S.badge}>{stage === "sectionB" ? "🌿 Lifestyle" : "🩺 Symptoms"}</div>
              </div>
              <div style={{ height:"6px", background:"rgba(181,101,167,0.15)", borderRadius:"10px", marginBottom:"24px", overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:"10px", background:"linear-gradient(90deg,#b565a7,#7c5cbf,#4a7fc1)", width:`${progressPct}%`, transition:"width 0.4s ease" }}/>
              </div>
            </>
          )}

          {/* ══ SECTION A — Yes/No ══ */}
          {stage === "sectionA" && (
            <div key={animKey} className={direction==="next"?"slide-next":"slide-prev"}>
              <div style={{ textAlign:"center", marginBottom:"20px" }}>
                <div style={{ fontSize:"38px", marginBottom:"10px" }}>{currentSym.emoji}</div>
                {/* ⭐ CHANGE 8 — Use shuffled array length in counter */}
                <div style={{ fontSize:"11px", fontWeight:"800", color:"#9b7cc0", fontFamily:"'Nunito',sans-serif", letterSpacing:"1px", marginBottom:"10px" }}>
                  SYMPTOM {sAIndex + 1} OF {symptomQuestions.length}
                </div>
                <h2 style={{ fontFamily:"'Nunito',sans-serif", fontSize:"clamp(15px,2.5vw,18px)", fontWeight:"900", color:"#2d1a4a", margin:"0 0 10px", lineHeight:1.5 }}>
                  {currentSym.q}
                </h2>
                <p style={{ fontSize:"12px", color:"#9b7cc0", fontWeight:"600", fontFamily:"'DM Sans',sans-serif", lineHeight:1.65, margin:"0 4px", fontStyle:"italic" }}>
                  {currentSym.reassurance}
                </p>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
                {[
                  { label:"Not really",      sublabel:"Doesn't apply to me",  color:"green", val:"no"  },
                  { label:"Yes, this is me", sublabel:"I do experience this", color:"red",   val:"yes" },
                ].map((opt) => {
                  const cs     = COLOR_STYLES[opt.color];
                  const picked = symPick === opt.val;
                  return (
                    <button key={opt.val} className="opt-card" onClick={() => handleSymYesNo(opt.val)} style={{
                      display:"flex", flexDirection:"column", alignItems:"center", gap:"8px",
                      padding:"28px 16px", borderRadius:"20px", cursor:"pointer",
                      background: picked ? cs.sel : cs.bg,
                      border:`1.5px solid ${cs.border}`,
                      boxShadow: picked ? `0 8px 28px ${cs.border}` : "0 2px 10px rgba(181,101,167,0.07)",
                      transform: picked ? "scale(1.05)" : "scale(1)",
                      transition:"all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                    }}>
                      <span style={{ fontSize:"16px", fontWeight:"900", color:picked?"#fff":"#2d1a4a", fontFamily:"'Nunito',sans-serif", textAlign:"center", lineHeight:1.3 }}>{opt.label}</span>
                      <span style={{ fontSize:"11px", fontWeight:"700", color:picked?"rgba(255,255,255,0.8)":"#9b7cc0", fontFamily:"'Nunito',sans-serif" }}>{opt.sublabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ SECTION A — Severity (vertical rows like screenshot) ══ */}
          {stage === "sectionADetail" && (
            <div className="pop-in">
              <div style={{ textAlign:"center", marginBottom:"24px" }}>
                <div style={{ fontSize:"34px", marginBottom:"10px" }}>{currentSym.emoji}</div>
                <div style={{ fontSize:"12px", fontWeight:"800", color:"#b565a7", fontFamily:"'Nunito',sans-serif", marginBottom:"10px", letterSpacing:"0.5px" }}>
                  HOW BAD IS IT REALLY? 👀
                </div>
                <h2 style={{ fontFamily:"'Nunito',sans-serif", fontSize:"clamp(15px,2.5vw,17px)", fontWeight:"900", color:"#2d1a4a", margin:"0 0 10px", lineHeight:1.5 }}>
                  {currentSym.q}
                </h2>
                <p style={{ fontSize:"12px", color:"#9b7cc0", fontWeight:"600", fontFamily:"'DM Sans',sans-serif", lineHeight:1.65, margin:"0 4px", fontStyle:"italic" }}>
                  {currentSym.reassurance}
                </p>
              </div>
              {/* Full-width vertical rows: number badge left, label right */}
              <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                {currentSym.severityLabels.map((label, i) => {
                  const sev  = i + 1;
                  const RAMP = [
                    { bg:"rgba(250,238,218,0.75)", border:"rgba(186,117,23,0.28)",  circle:"linear-gradient(135deg,#EF9F27,#BA7517)", text:"#633806" },
                    { bg:"rgba(245,220,190,0.75)", border:"rgba(186,117,23,0.45)",  circle:"linear-gradient(135deg,#BA7517,#854F0B)", text:"#412402" },
                    { bg:"rgba(245,196,179,0.75)", border:"rgba(216,90,48,0.38)",   circle:"linear-gradient(135deg,#D85A30,#993C1D)", text:"#712B13" },
                    { bg:"rgba(244,192,209,0.75)", border:"rgba(212,83,126,0.38)",  circle:"linear-gradient(135deg,#D4537E,#993556)", text:"#4B1528" },
                  ];
                  const r = RAMP[i] || RAMP[3];
                  return (
                    <button key={sev} className="sev-row" onClick={() => handleSeverity(sev)} style={{
                      display:"flex", alignItems:"center", gap:"18px",
                      width:"100%", padding:"18px 22px", borderRadius:"18px",
                      background: r.bg, border:`1.5px solid ${r.border}`,
                      cursor:"pointer", textAlign:"left",
                      boxShadow:"0 2px 12px rgba(181,101,167,0.08)",
                      transition:"all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                    }}>
                      <div style={{ width:"40px", height:"40px", borderRadius:"50%", background: r.circle, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 14px ${r.border}` }}>
                        <span style={{ fontSize:"16px", fontWeight:"900", color:"#fff", fontFamily:"'Nunito',sans-serif" }}>{sev}</span>
                      </div>
                      <span style={{ fontSize:"15px", fontWeight:"800", color: r.text, fontFamily:"'Nunito',sans-serif", lineHeight:1.45, flex:1 }}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ SECTION B INTRO ══ */}
          {stage === "sectionBIntro" && (
            <div className="pop-in" style={{ textAlign:"center" }}>
              <div style={{ fontSize:"52px", marginBottom:"14px" }}>🌿</div>
              <div style={{ ...S.badge, background:"linear-gradient(135deg,rgba(91,158,138,0.2),rgba(74,143,168,0.2))", color:"#5b9e8a" }}>Section B of 2</div>
              <h2 style={{ ...S.title, margin:"16px 0 10px" }}>Lifestyle Check</h2>
              <p style={{ fontSize:"14px", color:"#5a4070", lineHeight:1.8, marginBottom:"20px" }}>
                Almost there! <strong>4 personalised lifestyle questions</strong> based on your age group.
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"20px", textAlign:"left" }}>
                {[
                  { emoji:"💪", text:"Exercise habits"     },
                  { emoji:"🍕", text:"Diet & food choices" },
                  { emoji:"😴", text:"Sleep quality"       },
                  { emoji:"🧠", text:"Stress levels"       },
                ].map((item, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:"10px", background:"rgba(91,158,138,0.07)", borderRadius:"12px", padding:"12px 14px", border:"1px solid rgba(91,158,138,0.18)" }}>
                    <span style={{ fontSize:"18px" }}>{item.emoji}</span>
                    <span style={{ fontSize:"12px", fontWeight:"700", color:"#3d2060", fontFamily:"'Nunito',sans-serif" }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <div style={{ background:"rgba(91,158,138,0.07)", borderRadius:"12px", padding:"12px 16px", marginBottom:"20px", border:"1px solid rgba(91,158,138,0.18)" }}>
                <p style={{ fontSize:"12px", color:"#5b9e8a", margin:0, fontWeight:"700", fontFamily:"'Nunito',sans-serif" }}>
                  🎯 Section A complete! Your zone report is just 4 questions away.
                </p>
              </div>
              <button className="start-btn" onClick={() => { setStage("sectionB"); setAnimKey(k=>k+1); }} style={{ ...S.primaryBtn, background:"linear-gradient(135deg,#5b9e8a,#4a8fa8,#4a7fc1)" }}>
                Start Section B 🌿
              </button>
              <button onClick={handlePrev} style={S.ghostBtn}>← Back to symptoms</button>
            </div>
          )}

          {/* ══ SECTION B — Lifestyle ══ */}
          {stage === "sectionB" && (
            <div key={`b-${animKey}`} className={direction==="next"?"slide-next":"slide-prev"}>
              <div style={{ textAlign:"center", marginBottom:"22px" }}>
                <div style={{ fontSize:"36px", marginBottom:"10px" }}>{currentLife.emoji}</div>
                <div style={{ fontSize:"11px", fontWeight:"800", color:"#5b9e8a", fontFamily:"'Nunito',sans-serif", letterSpacing:"1px", marginBottom:"8px" }}>
                  LIFESTYLE {sBIndex + 1} OF {lifestyleQs.length}
                </div>
                <h2 style={{ fontFamily:"'Nunito',sans-serif", fontSize:"clamp(14px,2.5vw,17px)", fontWeight:"900", color:"#2d1a4a", margin:"0 0 10px", lineHeight:1.5 }}>
                  {currentLife.q}
                </h2>
                <p style={{ fontSize:"12px", color:"#9b7cc0", fontWeight:"600", fontFamily:"'DM Sans',sans-serif", lineHeight:1.65, margin:"0 4px", fontStyle:"italic" }}>
                  There are no right or wrong answers — just be honest with yourself. 🌿
                </p>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                {LIFESTYLE_OPTIONS.map((opt) => {
                  const cs     = COLOR_STYLES[opt.color];
                  const picked = lifPick === opt.value;
                  return (
                    <button key={opt.value} className="opt-card" onClick={() => handleLifestyle(opt)} style={{
                      display:"flex", flexDirection:"column", alignItems:"center", gap:"8px",
                      padding:"24px 12px", borderRadius:"18px", cursor:"pointer",
                      background: picked ? cs.sel : cs.bg,
                      border:`1.5px solid ${cs.border}`,
                      boxShadow: picked ? `0 6px 24px ${cs.border}` : "0 2px 8px rgba(181,101,167,0.07)",
                      transform: picked ? "scale(1.04)" : "scale(1)",
                      transition:"all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                    }}>
                      <span style={{ fontSize:"28px" }}>{opt.emoji}</span>
                      <span style={{ fontSize:"14px", fontWeight:"900", color:picked?"#fff":"#2d1a4a", fontFamily:"'Nunito',sans-serif" }}>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ SUBMITTING ══ */}
          {stage === "submitting" && (
            <div style={{ textAlign:"center", padding:"40px 0" }}>
              <div style={{ fontSize:"56px", marginBottom:"16px", animation:"spin 1.5s linear infinite", display:"inline-block" }}>⏳</div>
              <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:"17px", fontWeight:"900", color:"#2d1a4a" }}>Analysing your responses…</p>
              <p style={{ fontSize:"13px", color:"#9b7cc0", fontWeight:"700", fontFamily:"'Nunito',sans-serif" }}>Calculating your PCOD risk zone</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&family=Nunito:wght@600;700;800;900&display=swap');
  @keyframes slideInNext { from{opacity:0;transform:translateX(52px)} to{opacity:1;transform:translateX(0)} }
  @keyframes slideInPrev { from{opacity:0;transform:translateX(-52px)} to{opacity:1;transform:translateX(0)} }
  @keyframes popIn       { from{opacity:0;transform:scale(0.88) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes starTwinkle { 0%,100%{opacity:0;transform:scale(0.3)} 50%{opacity:1;transform:scale(1.2)} }
  @keyframes bigSparkle  { 0%,100%{opacity:0;transform:scale(0) rotate(0deg)} 40%{opacity:0.9;transform:scale(1.3) rotate(45deg)} }
  @keyframes spin        { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  .slide-next  { animation: slideInNext 0.38s cubic-bezier(0.22,1,0.36,1) both; }
  .slide-prev  { animation: slideInPrev 0.38s cubic-bezier(0.22,1,0.36,1) both; }
  .pop-in      { animation: popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
  .opt-card    { transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1); border:none; }
  .opt-card:hover { transform: translateY(-4px) scale(1.03) !important; }
  .sev-row:hover  { transform: translateX(8px) !important; box-shadow: 0 6px 22px rgba(181,101,167,0.2) !important; }
  .start-btn:hover  { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(148,108,210,0.5) !important; }
  .prev-btn:hover   { background: rgba(181,101,167,0.18) !important; }
`;

const S = {
  root:       { minHeight:"100vh", fontFamily:"'DM Sans',sans-serif", position:"relative", overflow:"hidden" },
  bgImage:    { position:"fixed", inset:0, zIndex:0, backgroundImage:`url(${dashBg})`, backgroundSize:"cover", backgroundPosition:"center", filter:"blur(14px) brightness(0.82) saturate(1.3)", transform:"scale(1.08)", pointerEvents:"none" },
  bgOverlay:  { position:"fixed", inset:0, zIndex:1, background:"linear-gradient(160deg,rgba(240,225,255,0.45) 0%,rgba(220,200,255,0.35) 40%,rgba(200,220,255,0.4) 100%)", pointerEvents:"none" },
  page:       { position:"relative", zIndex:3, maxWidth:"680px", margin:"0 auto", padding:"40px 32px 60px", display:"flex", alignItems:"center", minHeight:"100vh", boxSizing:"border-box" },
  card:       { width:"100%", background:"rgba(255,255,255,0.68)", backdropFilter:"blur(28px)", WebkitBackdropFilter:"blur(28px)", borderRadius:"32px", padding:"36px 40px", boxShadow:"0 16px 56px rgba(181,101,167,0.2), inset 0 1px 0 rgba(255,255,255,0.95)", border:"1px solid rgba(255,255,255,0.85)" },
  badge:      { display:"inline-block", background:"linear-gradient(135deg,rgba(181,101,167,0.18),rgba(148,108,210,0.18))", color:"#7c5cbf", fontWeight:"800", fontSize:"12px", padding:"5px 14px", borderRadius:"20px", border:"1px solid rgba(181,101,167,0.25)", fontFamily:"'Nunito',sans-serif" },
  prevBtn:    { background:"rgba(181,101,167,0.1)", border:"1px solid rgba(181,101,167,0.2)", borderRadius:"12px", padding:"6px 14px", fontSize:"12px", fontWeight:"800", color:"#7c5cbf", cursor:"pointer", fontFamily:"'Nunito',sans-serif" },
  title:      { fontFamily:"'Playfair Display',serif", fontSize:"clamp(20px,3vw,26px)", fontWeight:"900", color:"#2d1a4a" },
  statBox:    { display:"flex", flexDirection:"column", alignItems:"center", gap:"4px", background:"rgba(255,255,255,0.6)", border:"1px solid rgba(181,101,167,0.18)", borderRadius:"16px", padding:"14px 22px", minWidth:"90px" },
  primaryBtn: { width:"100%", padding:"15px", border:"none", borderRadius:"22px", background:"linear-gradient(135deg,#b565a7,#7c5cbf,#4a7fc1)", color:"#fff", fontWeight:"800", fontSize:"15px", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 6px 24px rgba(148,108,210,0.4)", transition:"all 0.2s ease" },
  ghostBtn:   { width:"100%", padding:"10px", border:"none", borderRadius:"14px", background:"transparent", color:"#9b7cc0", fontWeight:"700", fontSize:"13px", cursor:"pointer", fontFamily:"'Nunito',sans-serif", marginTop:"10px" },
};