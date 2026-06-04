import React, { useState, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import skinBg from "../assets/skin-bg.jpeg";

const SEVERITY_CONFIG = {
  Low:      { color:"#1a6b4a", light:"#2d9e6f", bg:"rgba(29,158,117,0.10)", border:"rgba(29,158,117,0.28)", bar:"linear-gradient(90deg,#1D9E75,#2d9e6f)", emoji:"🟢", label:"Low Risk" },
  Moderate: { color:"#7a5500", light:"#c07a10", bg:"rgba(186,117,23,0.10)", border:"rgba(186,117,23,0.28)", bar:"linear-gradient(90deg,#BA7517,#EF9F27)", emoji:"🟡", label:"Moderate" },
  High:     { color:"#6b1010", light:"#a32d2d", bg:"rgba(163,45,45,0.10)",  border:"rgba(163,45,45,0.28)",  bar:"linear-gradient(90deg,#A32D2D,#E24B4A)", emoji:"🔴", label:"High Risk" },
};

function ScoreRing({ value, max = 10, color, size = 100 }) {
  const r = 38, cx = 50, cy = 50;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(value / max, 0), 1);
  const dash = circ * pct;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="8"/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 50 50)" style={{ transition:"stroke-dasharray 1.4s cubic-bezier(0.22,1,0.36,1)" }}/>
      <text x="50" y="54" textAnchor="middle" fontSize="18" fontWeight="900" fill={color} fontFamily="'Nunito',sans-serif">{value}</text>
      <text x="50" y="66" textAnchor="middle" fontSize="8" fill="rgba(0,0,0,0.35)" fontFamily="'Nunito',sans-serif">/ {max}</text>
    </svg>
  );
}

function GlassCard({ children, style = {}, className = "", hover = false }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className={className}
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: "rgba(255,255,255,0.62)",
        backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
        borderRadius: "24px", border: "1px solid rgba(255,255,255,0.88)",
        boxShadow: hovered ? "0 20px 60px rgba(181,101,167,0.22), inset 0 1px 0 rgba(255,255,255,0.95)" : "0 8px 32px rgba(139,101,167,0.10), inset 0 1px 0 rgba(255,255,255,0.95)",
        transform: hovered ? "translateY(-4px) scale(1.01)" : "translateY(0) scale(1)",
        transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        ...style,
      }}
    >{children}</div>
  );
}

// ── UPLOAD PAGE ───────────────────────────────────────────────────────────────
function UploadPage({ onAnalyze, onBack }) {
  const [image,    setImage]    = useState(null);
  const [preview,  setPreview]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    if (!["image/jpeg","image/png","image/webp","image/jpg"].includes(file.type)) {
      toast.error("Only JPEG, PNG or WEBP images allowed."); return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleAnalyze = async () => {
    if (!image) {
      toast.warning("Please upload a skin image first 🌸");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", image);
      const { data } = await axios.post(
        "http://localhost:5000/api/skin/analyze",
        formData,
        { withCredentials: true }
      );
      onAnalyze(data, preview);
    } catch (err) {
      const serverMessage = err?.response?.data?.message;
      if (serverMessage?.includes("Unable to verify image safety")) {
        toast.error(
          "Unable to verify image safety. Please upload a clearer, unfiltered photo of your skin and try again."
        );
      } else {
        toast.error(serverMessage || "Analysis failed. Please try again.");
      }
      console.error("Skin analyzer error:", err?.response || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", overflow:"hidden", boxSizing:"border-box" }}>
      {/* TOP BAR */}
      <div style={{ padding:"16px 48px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <button onClick={onBack} style={{ background:"rgba(255,255,255,0.6)", border:"1px solid rgba(255,255,255,0.85)", borderRadius:"12px", padding:"8px 18px", fontSize:"13px", fontWeight:"700", color:"#7c4a7a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", backdropFilter:"blur(12px)" }}>
          ← Back
        </button>
        <div style={{ fontSize:"11px", fontWeight:"900", color:"rgba(0,0,0,0.3)", fontFamily:"'Nunito',sans-serif", letterSpacing:"2px" }}>AI SKIN HEALTH ANALYZER</div>
        <div style={{ width:"80px" }}/>
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ flex:1, display:"grid", gridTemplateColumns:"420px 1fr", gap:"20px", padding:"0 48px 24px", overflow:"hidden", maxWidth:"1200px", width:"100%", margin:"0 auto", boxSizing:"border-box", alignItems:"stretch" }}>
        {/* LEFT */}
        <GlassCard style={{ padding:"36px 32px", display:"flex", flexDirection:"column", justifyContent:"center", overflow:"hidden" }} className="fade-up">
          <div style={{ display:"inline-flex", alignItems:"center", gap:"6px", background:"linear-gradient(135deg,rgba(181,101,167,0.14),rgba(91,158,138,0.14))", border:"1px solid rgba(181,101,167,0.25)", borderRadius:"20px", padding:"5px 14px", marginBottom:"18px", alignSelf:"flex-start" }}>
            <span style={{ fontSize:"12px" }}>✨</span>
            <span style={{ fontSize:"10px", fontWeight:"900", color:"#7c4a7a", fontFamily:"'Nunito',sans-serif", letterSpacing:"1.5px" }}>AI SKIN ANALYSIS</span>
          </div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(26px,2.5vw,32px)", fontWeight:"900", color:"#2d1a2e", margin:"0 0 10px", lineHeight:1.2 }}>
            AI Skin Health<br/>Analyzer
          </h1>
          <p style={{ fontSize:"13px", color:"rgba(0,0,0,0.48)", lineHeight:1.8, margin:"0 0 24px", fontWeight:"500" }}>
            Upload a clear photo and our AI dermatologist instantly identifies your skin condition, possible causes, and personalized care tips.
          </p>
          <div style={{ height:"1px", background:"linear-gradient(90deg,transparent,rgba(181,101,167,0.2),transparent)", marginBottom:"20px" }}/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
            {[
              { icon:"⚡", label:"Instant Results",  desc:"Analysis in seconds"    },
              { icon:"🧬", label:"AI Powered",       desc:"Vision model analysis"  },
              { icon:"🔒", label:"Private & Secure", desc:"Your data stays yours"  },
              { icon:"💊", label:"PCOD Linked",      desc:"Hormonal skin insights" },
            ].map((s, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:"10px", background:"rgba(255,255,255,0.5)", border:"1px solid rgba(181,101,167,0.14)", borderRadius:"14px", padding:"11px 12px" }}>
                <div style={{ width:"32px", height:"32px", borderRadius:"10px", background:"linear-gradient(135deg,rgba(181,101,167,0.15),rgba(124,92,191,0.15))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"15px", flexShrink:0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize:"12px", fontWeight:"800", color:"#3d1a3a", fontFamily:"'Nunito',sans-serif", lineHeight:1.2 }}>{s.label}</div>
                  <div style={{ fontSize:"10px", color:"rgba(0,0,0,0.36)", fontWeight:"500" }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:"auto", paddingTop:"20px", display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={{ fontSize:"12px" }}>🔒</span>
            <span style={{ fontSize:"10px", color:"rgba(0,0,0,0.32)", fontWeight:"500", lineHeight:1.5 }}>AI screening tool only — not a medical diagnosis. Always consult a dermatologist.</span>
          </div>
        </GlassCard>

        {/* RIGHT */}
        <div style={{ display:"flex", flexDirection:"column", gap:"14px", overflow:"hidden" }} className="fade-up delay-1">
          <GlassCard style={{ flex:1, padding:"24px", display:"flex", flexDirection:"column" }}>
            <div style={{ fontSize:"11px", fontWeight:"900", color:"rgba(0,0,0,0.3)", fontFamily:"'Nunito',sans-serif", letterSpacing:"2px", marginBottom:"14px" }}>📸 UPLOAD SKIN IMAGE</div>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current.click()}
              style={{
                flex:1, border:`2px dashed ${dragOver?"#b565a7":"rgba(181,101,167,0.3)"}`,
                borderRadius:"18px", display:"flex", alignItems:"center", justifyContent:"center",
                flexDirection:"column", cursor:"pointer",
                background: dragOver?"rgba(181,101,167,0.05)":"rgba(255,255,255,0.35)",
                transition:"all 0.25s ease", marginBottom:"14px",
                minHeight: preview?"auto":"160px", padding: preview?"16px 20px":"20px",
              }}
            >
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={e => handleFile(e.target.files[0])} style={{ display:"none" }}/>
              {preview ? (
                <div style={{ display:"flex", alignItems:"center", gap:"18px", width:"100%" }}>
                  <img src={preview} alt="preview" style={{ width:"90px", height:"90px", objectFit:"cover", borderRadius:"14px", border:"3px solid rgba(181,101,167,0.4)", boxShadow:"0 4px 16px rgba(181,101,167,0.18)", flexShrink:0 }}/>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"4px" }}>
                      <span style={{ fontSize:"14px" }}>✅</span>
                      <span style={{ fontSize:"14px", fontWeight:"800", color:"#2d1a2e", fontFamily:"'Nunito',sans-serif" }}>Image ready for analysis</span>
                    </div>
                    <div style={{ fontSize:"12px", color:"rgba(0,0,0,0.38)", marginBottom:"10px" }}>{image?.name}</div>
                    <button onClick={e => { e.stopPropagation(); setImage(null); setPreview(null); }} style={{ background:"rgba(181,101,167,0.1)", border:"1px solid rgba(181,101,167,0.28)", borderRadius:"10px", padding:"5px 14px", fontSize:"12px", fontWeight:"700", color:"#b565a7", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                      Change Image
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ width:"56px", height:"56px", borderRadius:"16px", background:"linear-gradient(135deg,rgba(181,101,167,0.15),rgba(124,92,191,0.15))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"24px", marginBottom:"12px" }}>🖼️</div>
                  <div style={{ fontSize:"14px", fontWeight:"700", color:"#2d1a2e", fontFamily:"'Nunito',sans-serif", marginBottom:"4px" }}>Drop your image here</div>
                  <div style={{ fontSize:"12px", color:"rgba(0,0,0,0.36)", marginBottom:"14px" }}>or click to browse • JPEG, PNG, WEBP</div>
                  <div style={{ background:"linear-gradient(135deg,#b565a7,#7c5cbf)", color:"#fff", borderRadius:"10px", padding:"8px 20px", fontSize:"12px", fontWeight:"800", fontFamily:"'Nunito',sans-serif" }}>Browse Files</div>
                </>
              )}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px" }}>
              {[
                { emoji:"💡", text:"Good lighting" },
                { emoji:"📐", text:"Close to skin"  },
                { emoji:"🚫", text:"No filters"     },
              ].map((t, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:"6px", background:"rgba(228,253,225,0.5)", borderRadius:"10px", padding:"8px 10px", border:"1px solid rgba(138,203,136,0.28)" }}>
                  <span style={{ fontSize:"13px" }}>{t.emoji}</span>
                  <span style={{ fontSize:"10px", fontWeight:"600", color:"rgba(0,0,0,0.48)" }}>{t.text}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <button onClick={handleAnalyze} disabled={loading || !image} className="analyze-btn"
            style={{
              width:"100%", padding:"16px", border:"none", borderRadius:"16px",
              background: image?"linear-gradient(135deg,#b565a7,#7c5cbf,#5b9e8a)":"rgba(0,0,0,0.09)",
              color: image?"#fff":"rgba(0,0,0,0.28)",
              fontWeight:"900", fontSize:"15px", cursor: image?"pointer":"not-allowed",
              fontFamily:"'Nunito',sans-serif",
              boxShadow: image?"0 8px 28px rgba(181,101,167,0.4)":"none",
              transition:"all 0.3s ease", flexShrink:0, letterSpacing:"0.3px",
            }}>
            {loading ? (
              <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"10px" }}>
                <span style={{ display:"inline-block", animation:"spin 1s linear infinite" }}>⏳</span>
                Analyzing your skin…
              </span>
            ) : "🔬 Analyze My Skin"}
          </button>

          {loading && (
            <GlassCard style={{ padding:"20px 24px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
                <div style={{ fontSize:"32px", animation:"pulse 1.5s ease-in-out infinite", flexShrink:0 }}>🧬</div>
                <div>
                  <div style={{ fontSize:"14px", fontWeight:"800", color:"#2d1a2e", fontFamily:"'Nunito',sans-serif", marginBottom:"4px" }}>AI is scanning your skin…</div>
                  <div style={{ fontSize:"11px", color:"rgba(0,0,0,0.4)" }}>Identifying patterns and care advice</div>
                </div>
                <div style={{ marginLeft:"auto", display:"flex", gap:"5px" }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width:"7px", height:"7px", borderRadius:"50%", background:"#b565a7", animation:`bounce 0.8s ${i*0.15}s ease-in-out infinite` }}/>
                  ))}
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}

// ── RESULTS PAGE ──────────────────────────────────────────────────────────────
function ResultsPage({ result, preview, onReset, patternInsight }) {
  const sev = SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG.Low;
  // ✅ Doctor Advice tab REMOVED — only 2 tabs now
  const [activeTab, setActiveTab] = useState("causes");

  return (
    <div style={{ minHeight:"100vh", padding:"40px 24px 100px" }}>
      <div style={{ maxWidth:"960px", margin:"0 auto" }}>

        {/* ONE unified top bar — back button left, title center, cycle badges right */}
        <div className="fade-up" style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          gap:"12px", marginBottom:"28px", flexWrap:"wrap",
          background:"rgba(255,255,255,0.55)", backdropFilter:"blur(20px)",
          WebkitBackdropFilter:"blur(20px)", borderRadius:"20px",
          padding:"12px 20px", border:"1px solid rgba(255,255,255,0.85)",
          boxShadow:"0 4px 20px rgba(181,101,167,0.1)",
        }}>
          {/* left — back button */}
          <button onClick={onReset} style={{
            background:"rgba(181,101,167,0.1)", border:"1px solid rgba(181,101,167,0.22)",
            borderRadius:"12px", padding:"8px 16px", fontSize:"13px",
            fontWeight:"700", color:"#7c4a7a", cursor:"pointer",
            fontFamily:"'Nunito',sans-serif", transition:"all 0.2s", flexShrink:0,
          }}>
            ← New Analysis
          </button>

          {/* center — page title */}
          <div style={{
            fontSize:"11px", fontWeight:"900", color:"rgba(0,0,0,0.32)",
            fontFamily:"'Nunito',sans-serif", letterSpacing:"2px", textAlign:"center", flex:1,
          }}>
            🌸 SKIN ANALYSIS RESULT
          </div>

          {/* right — cycle badges (or empty spacer if none) */}
          <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap", justifyContent:"flex-end", flexShrink:0 }}>
            {result.cyclePhase && (
              <div style={{
                display:"inline-flex", alignItems:"center", gap:"6px",
                background:"rgba(181,101,167,0.1)", border:"1px solid rgba(181,101,167,0.22)",
                borderRadius:"20px", padding:"5px 12px",
              }}>
                <span style={{ fontSize:"13px" }}>
                  {result.cyclePhase==="Menstrual"?"🩸":result.cyclePhase==="Follicular"?"🌱":result.cyclePhase==="Ovulation"?"🥚":"🌙"}
                </span>
                <span style={{ fontSize:"11px", fontWeight:"800", color:"#7c4a7a", fontFamily:"'Nunito',sans-serif", whiteSpace:"nowrap" }}>
                  Day {result.cycleDay} · {result.cyclePhase}
                </span>
              </div>
            )}
            {result.savedWithCycleData && (
              <div style={{
                display:"inline-flex", alignItems:"center", gap:"5px",
                background:"rgba(91,158,138,0.1)", border:"1px solid rgba(91,158,138,0.25)",
                borderRadius:"20px", padding:"5px 12px",
              }}>
                <span style={{ fontSize:"11px" }}>✅</span>
                <span style={{ fontSize:"11px", fontWeight:"800", color:"#2d7a60", fontFamily:"'Nunito',sans-serif", whiteSpace:"nowrap" }}>Cycle linked</span>
              </div>
            )}
            {/* spacer so center title stays centered when no badges */}
            {!result.cyclePhase && !result.savedWithCycleData && (
              <div style={{ width:"120px" }}/>
            )}
          </div>
        </div>

        {/* HERO RESULT CARD */}
        <GlassCard style={{ padding:"36px 40px", marginBottom:"20px", position:"relative", overflow:"hidden" }} className="fade-up">
          <div style={{ position:"absolute", top:"-40px", right:"-40px", width:"200px", height:"200px", background:`radial-gradient(circle, ${sev.light}44, transparent 70%)`, pointerEvents:"none" }}/>
          <div style={{ position:"absolute", bottom:"-30px", left:"-30px", width:"150px", height:"150px", background:"radial-gradient(circle, rgba(181,101,167,0.15), transparent 70%)", pointerEvents:"none" }}/>
          <div style={{ display:"flex", alignItems:"center", gap:"28px", flexWrap:"wrap", position:"relative" }}>
            <div style={{ position:"relative", flexShrink:0 }}>
              <img src={preview} alt="analyzed skin" style={{ width:"110px", height:"110px", objectFit:"cover", borderRadius:"20px", border:`3px solid ${sev.border}`, boxShadow:`0 8px 28px ${sev.bg}` }}/>
              <div style={{ position:"absolute", bottom:"-10px", left:"50%", transform:"translateX(-50%)", background:sev.color, borderRadius:"20px", padding:"3px 12px", fontSize:"10px", fontWeight:"900", color:"#fff", fontFamily:"'Nunito',sans-serif", whiteSpace:"nowrap", boxShadow:`0 4px 12px ${sev.bg}` }}>
                {sev.emoji} {sev.label}
              </div>
            </div>
            <div style={{ flex:1, minWidth:"200px" }}>
              <div style={{ fontSize:"11px", fontWeight:"900", color:"rgba(0,0,0,0.32)", fontFamily:"'Nunito',sans-serif", letterSpacing:"2px", marginBottom:"6px" }}>DETECTED CONDITION</div>
              <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(24px,3.5vw,36px)", fontWeight:"900", color:"#2d1a2e", margin:"0 0 16px", lineHeight:1.15 }}>
                {result.condition || "Skin Analysis Complete"}
              </h1>
              {result.hormonalLink && (
                <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:"rgba(181,101,167,0.1)", border:"1px solid rgba(181,101,167,0.3)", borderRadius:"12px", padding:"8px 14px", marginBottom:"14px" }}>
                  <span>⚠️</span>
                  <span style={{ fontSize:"12px", fontWeight:"700", color:"#7c4a7a", fontFamily:"'Nunito',sans-serif" }}>
                    {result.hormonalNote || "May be linked to hormonal imbalance / PCOD"}
                  </span>
                </div>
              )}
            </div>
            <div style={{ flexShrink:0, textAlign:"center" }}>
              <ScoreRing value={result.severityScore || 0} max={10} color={sev.light} size={110}/>
              <div style={{ fontSize:"11px", fontWeight:"700", color:"rgba(0,0,0,0.38)", fontFamily:"'Nunito',sans-serif", marginTop:"4px" }}>Severity Score</div>
            </div>
          </div>
        </GlassCard>

        {/* QUICK STATS — removed Doctor Visit, kept Condition + Severity */}
        <div className="fade-up delay-1" style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"14px", marginBottom:"20px" }}>
          {[
            { label:"Condition", value: result.condition || "—", icon:"🔬", color:"#7c5cbf" },
            { label:"Severity",  value: result.severity  || "—", icon: sev.emoji, color: sev.color },
          ].map((s, i) => (
            <GlassCard key={i} style={{ padding:"20px 22px", textAlign:"center" }} hover>
              <div style={{ fontSize:"26px", marginBottom:"8px" }}>{s.icon}</div>
              <div style={{ fontSize:"15px", fontWeight:"900", color:s.color, fontFamily:"'Nunito',sans-serif", marginBottom:"4px" }}>{s.value}</div>
              <div style={{ fontSize:"11px", fontWeight:"700", color:"rgba(0,0,0,0.35)", fontFamily:"'Nunito',sans-serif" }}>{s.label}</div>
            </GlassCard>
          ))}
        </div>

        {/* TABS — Doctor Advice REMOVED */}
        <div className="fade-up delay-2" style={{ marginBottom:"20px" }}>
          <div style={{ display:"flex", gap:"8px", marginBottom:"16px", flexWrap:"wrap" }}>
            {[
              { id:"causes", label:"🧪 Possible Causes" },
              { id:"tips",   label:"💆‍♀️ Care Tips"      },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding:"10px 20px", border:"none", borderRadius:"14px", cursor:"pointer",
                fontFamily:"'Nunito',sans-serif", fontSize:"13px", fontWeight:"800",
                transition:"all 0.2s ease",
                background: activeTab===tab.id?"linear-gradient(135deg,#b565a7,#7c5cbf)":"rgba(255,255,255,0.55)",
                color: activeTab===tab.id?"#fff":"#7c4a7a",
                boxShadow: activeTab===tab.id?"0 6px 20px rgba(181,101,167,0.35)":"0 2px 8px rgba(0,0,0,0.06)",
                backdropFilter:"blur(12px)",
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "causes" && (
            <GlassCard style={{ padding:"28px" }} className="fade-up">
              <div style={{ fontSize:"11px", fontWeight:"900", color:"rgba(0,0,0,0.32)", fontFamily:"'Nunito',sans-serif", letterSpacing:"2px", marginBottom:"18px" }}>POSSIBLE CAUSES</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:"12px" }}>
                {(result.possibleCauses || []).map((c, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:"14px", background:"rgba(255,255,255,0.6)", borderRadius:"14px", padding:"14px 16px", border:"1px solid rgba(181,101,167,0.15)", transition:"all 0.2s ease" }}
                    onMouseEnter={e => e.currentTarget.style.transform="translateX(6px)"}
                    onMouseLeave={e => e.currentTarget.style.transform="translateX(0)"}
                  >
                    <div style={{ width:"36px", height:"36px", borderRadius:"10px", background:"linear-gradient(135deg,rgba(181,101,167,0.2),rgba(124,92,191,0.2))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", flexShrink:0 }}>
                      {["🔬","💊","🍽️","😰","🌙","🧬","💧","⚗️"][i % 8]}
                    </div>
                    <span style={{ fontSize:"13px", fontWeight:"700", color:"rgba(0,0,0,0.65)", fontFamily:"'DM Sans',sans-serif" }}>{c}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {activeTab === "tips" && (
            <GlassCard style={{ padding:"28px" }} className="fade-up">
              <div style={{ fontSize:"11px", fontWeight:"900", color:"rgba(0,0,0,0.32)", fontFamily:"'Nunito',sans-serif", letterSpacing:"2px", marginBottom:"18px" }}>PERSONALISED CARE TIPS</div>
              <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                {(result.careTips || []).map((t, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:"14px", background:"rgba(228,253,225,0.55)", borderRadius:"14px", padding:"16px 18px", border:"1px solid rgba(138,203,136,0.28)", transition:"all 0.2s ease" }}
                    onMouseEnter={e => { e.currentTarget.style.transform="translateX(6px)"; e.currentTarget.style.boxShadow="0 4px 18px rgba(91,158,138,0.18)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform="translateX(0)"; e.currentTarget.style.boxShadow="none"; }}
                  >
                    <div style={{ width:"28px", height:"28px", borderRadius:"8px", background:"linear-gradient(135deg,#5b9e8a,#4a8fa8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", flexShrink:0 }}>✓</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"11px", fontWeight:"800", color:"#2d7a65", fontFamily:"'Nunito',sans-serif", marginBottom:"2px" }}>TIP {i + 1}</div>
                      <div style={{ fontSize:"13px", fontWeight:"600", color:"rgba(0,0,0,0.62)", fontFamily:"'DM Sans',sans-serif", lineHeight:1.6 }}>{t}</div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>

        {/* AI DERMATOLOGIST NOTE */}
        <GlassCard style={{ padding:"32px", marginBottom:"20px" }} className="fade-up delay-3">
          <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"20px" }}>
            <div style={{ width:"46px", height:"46px", borderRadius:"14px", background:"linear-gradient(135deg,#b565a7,#7c5cbf)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", boxShadow:"0 6px 18px rgba(181,101,167,0.35)", flexShrink:0 }}>🩺</div>
            <div>
              <div style={{ fontSize:"16px", fontWeight:"900", color:"#2d1a2e", fontFamily:"'Nunito',sans-serif" }}>AI Dermatologist Note</div>
              <div style={{ fontSize:"11px", color:"rgba(0,0,0,0.38)", fontWeight:"600", fontFamily:"'Nunito',sans-serif" }}>Generated by AI Vision Analysis</div>
            </div>
            <div style={{ marginLeft:"auto", padding:"4px 12px", borderRadius:"20px", background:"linear-gradient(135deg,rgba(181,101,167,0.12),rgba(124,92,191,0.12))", border:"1px solid rgba(181,101,167,0.22)", fontSize:"10px", fontWeight:"900", color:"#7c5cbf", fontFamily:"'Nunito',sans-serif", letterSpacing:"1px" }}>AI POWERED</div>
          </div>
          <div style={{ background:"linear-gradient(135deg,rgba(181,101,167,0.06),rgba(91,158,138,0.06))", borderRadius:"16px", padding:"20px 22px", border:"1px solid rgba(181,101,167,0.12)", position:"relative" }}>
            <div style={{ position:"absolute", top:"16px", left:"16px", fontSize:"32px", opacity:0.12, fontFamily:"serif", lineHeight:1 }}>"</div>
            <p style={{ fontSize:"14px", color:"rgba(0,0,0,0.62)", lineHeight:1.9, margin:0, fontFamily:"'DM Sans',sans-serif", fontStyle:"italic", paddingLeft:"24px" }}>
              {result.aiNote || result.rawAnalysis || "Analysis complete. Please review the details above."}
            </p>
          </div>
        </GlassCard>

        {/* PATTERN INSIGHT */}
        {patternInsight?.detected && (
          <GlassCard style={{ padding:"28px", marginBottom:"20px", background:"linear-gradient(135deg,rgba(181,101,167,0.08),rgba(124,92,191,0.06))", border:"1px solid rgba(181,101,167,0.22)" }} className="fade-up delay-3">
            <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"14px" }}>
              <div style={{ width:"42px", height:"42px", borderRadius:"13px", background:"linear-gradient(135deg,#b565a7,#7c5cbf)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>📊</div>
              <div>
                <div style={{ fontSize:"14px", fontWeight:"900", color:"#2d1a2e", fontFamily:"'Nunito',sans-serif" }}>Skin-Cycle Pattern Detected</div>
                <div style={{ fontSize:"11px", color:"rgba(0,0,0,0.38)", fontWeight:"600", fontFamily:"'Nunito',sans-serif" }}>Based on your scan history</div>
              </div>
              <div style={{ marginLeft:"auto", padding:"3px 10px", borderRadius:"20px", background:"rgba(181,101,167,0.12)", border:"1px solid rgba(181,101,167,0.25)", fontSize:"9px", fontWeight:"900", color:"#7c5cbf", fontFamily:"'Nunito',sans-serif", letterSpacing:"1px" }}>NEW INSIGHT</div>
            </div>
            <div style={{ background:"rgba(255,255,255,0.55)", borderRadius:"14px", padding:"16px 18px", border:"1px solid rgba(181,101,167,0.15)", marginBottom:"12px" }}>
              <p style={{ fontSize:"13.5px", color:"rgba(0,0,0,0.62)", lineHeight:1.8, margin:0, fontFamily:"'DM Sans',sans-serif", fontWeight:"600" }}>{patternInsight.message}</p>
            </div>
            {patternInsight.tip && (
              <div style={{ display:"flex", alignItems:"flex-start", gap:"10px", background:"rgba(91,158,138,0.08)", borderRadius:"12px", padding:"12px 14px", border:"1px solid rgba(91,158,138,0.2)" }}>
                <span style={{ fontSize:"14px", flexShrink:0 }}>💡</span>
                <span style={{ fontSize:"12px", fontWeight:"600", color:"rgba(0,0,0,0.58)", fontFamily:"'DM Sans',sans-serif", lineHeight:1.6 }}>{patternInsight.tip}</span>
              </div>
            )}
          </GlassCard>
        )}

        {/* DISCLAIMER */}
        <div className="fade-up delay-3" style={{ display:"flex", gap:"10px", alignItems:"flex-start", background:"rgba(255,255,255,0.3)", borderRadius:"14px", padding:"14px 18px", border:"1px solid rgba(255,255,255,0.6)", marginBottom:"16px" }}>
          <span style={{ fontSize:"14px", flexShrink:0 }}>🔒</span>
          <p style={{ margin:0, fontSize:"11px", color:"rgba(0,0,0,0.4)", lineHeight:1.75, fontWeight:"500" }}>
            <strong style={{ color:"rgba(0,0,0,0.5)" }}>Disclaimer:</strong> This is an AI-powered screening tool, not a medical diagnosis. Results are based on image analysis only and should not replace professional dermatological advice. Always consult a qualified dermatologist for proper evaluation.
          </p>
        </div>

        {/* ANALYZE ANOTHER */}
        <button onClick={onReset} className="fade-up delay-3" style={{ width:"100%", padding:"15px", border:"1.5px solid rgba(181,101,167,0.3)", borderRadius:"18px", background:"rgba(255,255,255,0.55)", color:"#7c4a7a", fontWeight:"800", fontSize:"14px", cursor:"pointer", fontFamily:"'Nunito',sans-serif", backdropFilter:"blur(12px)", transition:"all 0.2s ease" }}
          onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.75)"; e.currentTarget.style.transform="translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.55)"; e.currentTarget.style.transform="translateY(0)"; }}
        >
          🔄 Analyze Another Image
        </button>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function SkinAnalyzer({ onBack }) {
  const [page,           setPage]           = useState("upload");
  const [result,         setResult]         = useState(null);
  const [preview,        setPreview]        = useState(null);
  const [patternInsight, setPatternInsight] = useState(null);

  const handleAnalyzeComplete = async (data, previewUrl) => {
    setResult(data);
    setPreview(previewUrl);
    setPage("results");
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const { data: historyData } = await axios.get(
        "http://localhost:5000/api/skin/history", { withCredentials: true }
      );
      if (historyData?.patternInsight?.detected) setPatternInsight(historyData.patternInsight);
    } catch (e) { /* non-blocking */ }
  };

  const handleReset = () => {
    setResult(null); setPreview(null); setPatternInsight(null);
    setPage("upload");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ minHeight:"100vh", fontFamily:"'DM Sans',sans-serif", position:"relative", overflowX:"hidden" }}>
      <div style={{ position:"fixed", inset:0, zIndex:0, backgroundImage:`url(${skinBg})`, backgroundSize:"cover", backgroundPosition:"center", filter:"blur(18px) brightness(0.86) saturate(1.25)", transform:"scale(1.08)", pointerEvents:"none" }}/>
      <div style={{ position:"fixed", inset:0, zIndex:1, background:"linear-gradient(160deg,rgba(255,232,240,0.62) 0%,rgba(242,215,228,0.55) 40%,rgba(222,248,222,0.48) 100%)", pointerEvents:"none" }}/>
      <ToastContainer toastStyle={{ borderRadius:"16px", fontFamily:"'Nunito',sans-serif" }}/>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&family=Nunito:wght@600;700;800;900&display=swap');
        @keyframes fadeUp  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
        @keyframes bounce  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .fade-up   { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .delay-1   { animation-delay: 0.1s; }
        .delay-2   { animation-delay: 0.2s; }
        .delay-3   { animation-delay: 0.32s; }
        .analyze-btn:hover:not(:disabled) { transform:translateY(-3px)!important; box-shadow:0 14px 40px rgba(181,101,167,0.55)!important; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(181,101,167,0.25); border-radius:4px; }
      `}</style>
      <div style={{ position:"relative", zIndex:3 }}>
        {page==="upload" ? (
          <UploadPage onAnalyze={handleAnalyzeComplete} onBack={onBack}/>
        ) : (
          <ResultsPage result={result} preview={preview} onReset={handleReset} patternInsight={patternInsight}/>
        )}
      </div>
    </div>
  );
}