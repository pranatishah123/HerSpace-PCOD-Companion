import React, { useState } from "react";
import bg from "../assets/bg.jpg";

const PCOD_FACTS = [
  { emoji: "📊", title: "1 in 5 Women",       desc: "Nearly 20% of women of reproductive age are affected by PCOD/PCOS worldwide." },
  { emoji: "🧬", title: "Hormonal Imbalance",  desc: "PCOD is caused by elevated androgens (male hormones) disrupting normal ovulation cycles." },
  { emoji: "🌿", title: "Lifestyle is Key",    desc: "Up to 70% of PCOD symptoms can be improved with consistent lifestyle and dietary changes." },
  { emoji: "🩺", title: "Often Undiagnosed",   desc: "Many women live with PCOD for years without knowing — awareness and early detection matter." },
];


const FAQS = [
  { q: "Is HerSpace a medical app?",                              a: "No. HerSpace is a wellness guidance platform. It does not diagnose, treat, or replace medical advice. Always consult a qualified healthcare professional for medical concerns." },
  { q: "Is my data safe?",                                        a: "Absolutely. We do not sell, share, or misuse your personal data. All information you provide is used solely to personalize your wellness experience within the app." },
  { q: "Who is HerSpace for?",                                    a: "HerSpace is designed for women aged 13 and above who want to understand their hormonal health, build healthy habits, and manage lifestyle-related wellness concerns like PCOD." },
  { q: "Is the quiz scientifically validated?",                   a: "Our questions are crafted based on established wellness research and hormonal health literature. However, they are for guidance purposes only and not a clinical assessment." },
  { q: "Can I use HerSpace without a PCOD diagnosis?",            a: "Yes! HerSpace is for all women who want to improve their wellness, whether or not they have a diagnosis. Prevention and awareness are just as important." },
  { q: "Is HerSpace free to use?",                                a: "Yes, the core features of HerSpace are completely free. We believe every woman deserves access to wellness guidance." },
];

const SECTIONS = [
  { id: "about",   label: "About HerSpace", emoji: "🌸" },
  { id: "pcod",    label: "PCOD & PCOS",    emoji: "💜" },
  { id: "privacy", label: "Privacy Policy", emoji: "🔒" },
  { id: "terms",   label: "Terms of Use",   emoji: "📋" },
  { id: "faq",     label: "FAQs",           emoji: "❓" },
];

// ── SECTION CONTENTS ──────────────────────────────────────────────────────────
function AboutContent() {
  return (
    <div className="tab-anim">
      <SectionHead emoji="🌸" title="About HerSpace" />
      <div style={S.glassCard}>
        <p style={S.para}>
          <strong>HerSpace</strong> is a women's wellness platform built to bridge the gap between hormonal health awareness and everyday lifestyle choices. We believe every woman deserves to understand her body — without jargon, without judgment, and without barriers.
        </p>
        <p style={S.para}>
          Our platform combines evidence-inspired wellness frameworks with a gamified, personalized experience. From teens navigating puberty to women managing hormonal transitions at 35+, HerSpace meets you exactly where you are.
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginTop:"20px" }}>
          {[
            { emoji:"🎯", title:"Personalized", desc:"Questions adapt to your age, lifestyle and goals" },
            { emoji:"🔒", title:"Private & Safe", desc:"Your data stays yours — always" },
            { emoji:"🌿", title:"Holistic",      desc:"Body, mind and hormones together" },
            { emoji:"💫", title:"Empowering",    desc:"Knowledge that drives real change" },
          ].map((v, i) => (
            <div key={i} style={S.valueBox}>
              <span style={{ fontSize:"22px" }}>{v.emoji}</span>
              <div style={{ fontWeight:"800", fontSize:"13px", color:"#2d1a4a" }}>{v.title}</div>
              <div style={{ fontSize:"12px", color:"#7a5a9a", lineHeight:1.5 }}>{v.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PcodContent() {
  return (
    <div className="tab-anim">
      <SectionHead emoji="💜" title="Understanding PCOD & PCOS" />
      <div style={S.glassCard}>
        <div style={{ background:"rgba(205,44,88,0.06)", borderRadius:"16px", padding:"16px 20px", marginBottom:"20px", border:"1px solid rgba(205,44,88,0.15)" }}>
          <p style={{ ...S.para, margin:0, fontStyle:"italic", color:"#5a3a7a" }}>
            💡 <strong>PCOD</strong> (Polycystic Ovarian Disease) and <strong>PCOS</strong> (Polycystic Ovary Syndrome) are related but distinct conditions affecting the ovaries and hormonal balance in women.
          </p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px", marginBottom:"20px" }}>
          <div style={{ ...S.glassCard, padding:"16px", margin:0, border:"1.5px solid rgba(205,44,88,0.2)" }}>
            <div style={{ fontWeight:"900", fontSize:"14px", color:"#CD2C58", marginBottom:"10px" }}>🌸 PCOD</div>
            {["Ovaries produce immature eggs","Caused by hormonal imbalance","Often managed with lifestyle changes","Very common — affects ~10% of women","Less severe than PCOS"].map((t,i)=>(
              <div key={i} style={{ fontSize:"12px", color:"#3d2060", padding:"5px 0", borderBottom:"1px solid rgba(205,44,88,0.08)", fontWeight:"600" }}>• {t}</div>
            ))}
          </div>
          <div style={{ ...S.glassCard, padding:"16px", margin:0, border:"1.5px solid rgba(205,44,88,0.2)" }}>
            <div style={{ fontWeight:"900", fontSize:"14px", color:"#CD2C58", marginBottom:"10px" }}>💎 PCOS</div>
            {["Metabolic & endocrine disorder","Higher androgen levels","May require medical treatment","Can affect fertility if untreated","Linked to insulin resistance"].map((t,i)=>(
              <div key={i} style={{ fontSize:"12px", color:"#3d2060", padding:"5px 0", borderBottom:"1px solid rgba(205,44,88,0.08)", fontWeight:"600" }}>• {t}</div>
            ))}
          </div>
        </div>

        <h3 style={S.subHead}>Common Symptoms</h3>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginBottom:"20px" }}>
          {["Irregular periods","Acne & oily skin","Unexplained weight gain","Hair thinning","Mood swings","Fatigue","Bloating","Sleep issues","Low libido","Facial hair"].map((s,i)=>(
            <div key={i} style={{ background:"rgba(205,44,88,0.08)", border:"1px solid rgba(205,44,88,0.2)", borderRadius:"20px", padding:"5px 14px", fontSize:"12px", fontWeight:"700", color:"#CD2C58" }}>{s}</div>
          ))}
        </div>

        <h3 style={S.subHead}>Key Facts</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
          {PCOD_FACTS.map((f,i)=>(
            <div key={i} className="fact-card" style={{ background:"rgba(255,255,255,0.6)", borderRadius:"16px", padding:"16px", border:"1px solid rgba(205,44,88,0.12)", transition:"all 0.2s ease" }}>
              <div style={{ fontSize:"24px", marginBottom:"6px" }}>{f.emoji}</div>
              <div style={{ fontWeight:"900", fontSize:"13px", color:"#2d1a4a", marginBottom:"4px" }}>{f.title}</div>
              <div style={{ fontSize:"12px", color:"#7a5a9a", lineHeight:1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PrivacyContent() {
  const items = [
    { title:"Information We Collect",  body:"We collect only the information you voluntarily provide — such as your name, age group, lifestyle preferences, and quiz responses. We do not collect sensitive medical records or financial information." },
    { title:"How We Use Your Data",    body:"Your data is used exclusively to personalize your wellness experience within HerSpace. We use it to generate your wellness zone, tailor quiz questions, and provide relevant health guidance." },
    { title:"Data Sharing",            body:"We do not sell, rent, or share your personal data with third parties for marketing purposes. Your information is never disclosed without your explicit consent, except as required by law." },
    { title:"Data Security",           body:"We implement industry-standard security measures to protect your data. All data is encrypted in transit and at rest. However, no system is 100% secure and we encourage responsible use." },
    { title:"Your Rights",             body:"You have the right to access, update, or delete your personal data at any time. To exercise these rights, contact us at privacy@herspace.in." },
    { title:"Cookies",                 body:"HerSpace may use minimal cookies to improve your browsing experience. These are not used to track you across other websites. You can disable cookies in your browser settings." },
  ];
  return (
    <div className="tab-anim">
      <SectionHead emoji="🔒" title="Privacy Policy" />
      <div style={S.glassCard}>
        <p style={{ ...S.para, fontSize:"12px", color:"#999" }}>Last updated: March 2026</p>
        {items.map((item,i)=>(
          <div key={i} style={{ marginBottom:"18px" }}>
            <h3 style={S.subHead}>{item.title}</h3>
            <p style={{ ...S.para, margin:0 }}>{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TermsContent() {
  const items = [
    { title:"Acceptance of Terms",    body:"By using HerSpace, you agree to these Terms of Use. If you do not agree, please discontinue use of the platform immediately." },
    { title:"Not Medical Advice",     body:"HerSpace is a wellness guidance platform — not a medical service. Content provided is for informational purposes only and does not constitute medical advice, diagnosis, or treatment. Always consult a licensed healthcare provider." },
    { title:"Eligibility",            body:"HerSpace is intended for users aged 13 and above. Users under 18 should use the platform with parental awareness." },
    { title:"User Conduct",           body:"You agree to use HerSpace only for lawful purposes. You must not misuse the platform, attempt to access unauthorized data, or use the service to harm others." },
    { title:"Intellectual Property",  body:"All content, design, and branding on HerSpace is the intellectual property of HerSpace. You may not copy, reproduce, or distribute our content without written permission." },
    { title:"Changes to Terms",       body:"We reserve the right to update these Terms at any time. Continued use of HerSpace after changes constitutes your acceptance of the new Terms." },
  ];
  return (
    <div className="tab-anim">
      <SectionHead emoji="📋" title="Terms of Use" />
      <div style={S.glassCard}>
        <p style={{ ...S.para, fontSize:"12px", color:"#999" }}>Last updated: March 2026</p>
        {items.map((item,i)=>(
          <div key={i} style={{ marginBottom:"18px" }}>
            <h3 style={S.subHead}>{item.title}</h3>
            <p style={{ ...S.para, margin:0 }}>{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FaqContent() {
  const [openFaq, setOpenFaq] = useState(null);
  return (
    <div className="tab-anim">
      <SectionHead emoji="❓" title="Frequently Asked Questions" />
      <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
        {FAQS.map((faq,i)=>(
          <div key={i} className="faq-item" style={{ background:"rgba(255,255,255,0.62)", backdropFilter:"blur(16px)", borderRadius:"18px", border:"1.5px solid rgba(205,44,88,0.15)", overflow:"hidden", transition:"all 0.2s ease" }}>
            <button onClick={() => setOpenFaq(openFaq===i?null:i)}
              style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px", background:"none", border:"none", cursor:"pointer", textAlign:"left", gap:"12px" }}>
              <span style={{ fontWeight:"800", fontSize:"13.5px", color:"#2d1a4a", lineHeight:1.4 }}>{faq.q}</span>
              <span style={{ fontSize:"18px", color:"#CD2C58", flexShrink:0, transition:"transform 0.3s", transform: openFaq===i?"rotate(180deg)":"rotate(0deg)" }}>⌄</span>
            </button>
            {openFaq===i && (
              <div style={{ padding:"0 20px 16px", fontSize:"13px", color:"#5a4070", lineHeight:1.75, fontWeight:"500" }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const CONTENT_MAP = {
  about:   <AboutContent />,
  pcod:    <PcodContent />,
  privacy: <PrivacyContent />,
  terms:   <TermsContent />,
  faq:     <FaqContent />,
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function LearnMore({ onBack }) {
  const [active, setActive] = useState("about");

  return (
    <div style={S.root}>
      <div style={S.bgOverlay} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&family=Nunito:wght@600;700;800;900&display=swap');
        @keyframes tabFade { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .tab-anim   { animation: tabFade 0.35s ease both; }
        .nav-pill:hover { background: rgba(205,44,88,0.1) !important; }
        .fact-card:hover { transform: translateY(-4px) !important; box-shadow: 0 12px 32px rgba(205,44,88,0.15) !important; }
        .step-card:hover { transform: translateY(-3px) !important; }
        .faq-item:hover  { border-color: rgba(205,44,88,0.35) !important; }
        .back-btn:hover  { opacity: 0.7; }
      `}</style>

      <div style={S.layout}>

        {/* ── SIDEBAR ── */}
        <div style={S.sidebar}>
          <button onClick={onBack} className="back-btn" style={S.backBtn}>← Back</button>

          <div style={{ textAlign:"center", marginBottom:"24px" }}>
            <div style={{ fontSize:"32px", marginBottom:"6px" }}>🌸</div>
            <div style={{ fontFamily:"'Nunito',sans-serif", fontWeight:"900", fontSize:"16px", color:"#1a1a2e" }}>HerSpace</div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
            {SECTIONS.map(s => (
              <button key={s.id} className="nav-pill"
                onClick={() => setActive(s.id)}
                style={{
                  ...S.navPill,
                  background: active===s.id ? "rgba(205,44,88,0.12)" : "transparent",
                  border:     active===s.id ? "1.5px solid rgba(205,44,88,0.3)" : "1.5px solid transparent",
                  color:      active===s.id ? "#CD2C58" : "#444",
                  fontWeight: active===s.id ? "800" : "700",
                }}>
                <span style={{ fontSize:"16px" }}>{s.emoji}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── CONTENT AREA ── */}
        <div style={S.content}>
          {CONTENT_MAP[active]}
        </div>

      </div>
    </div>
  );
}

// ── SECTION HEADER ────────────────────────────────────────────────────────────
function SectionHead({ emoji, title }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"20px" }}>
      <div style={{ width:"42px", height:"42px", borderRadius:"14px", background:"linear-gradient(135deg,#E06C9F,#CD2C58)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0, boxShadow:"0 4px 14px rgba(205,44,88,0.3)" }}>{emoji}</div>
      <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(20px,2.5vw,28px)", fontWeight:"900", color:"#1a1a2e", margin:0 }}>{title}</h2>
    </div>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const S = {
  root:      { minHeight:"100vh", fontFamily:"'DM Sans',sans-serif", position:"relative", backgroundImage:`url(${bg})`, backgroundSize:"cover", backgroundPosition:"center", backgroundAttachment:"fixed" },
  bgOverlay: { position:"fixed", inset:0, zIndex:0, background:"rgba(255,220,220,0.55)", backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)", pointerEvents:"none" },

  layout:    { position:"relative", zIndex:1, display:"flex", minHeight:"100vh" },

  sidebar:   { width:"230px", flexShrink:0, position:"sticky", top:0, height:"100vh", padding:"32px 16px", boxSizing:"border-box", background:"rgba(255,255,255,0.4)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderRight:"1px solid rgba(205,44,88,0.12)" },
  backBtn:   { background:"none", border:"none", color:"#CD2C58", fontWeight:"700", fontSize:"13px", cursor:"pointer", marginBottom:"20px", padding:0, transition:"opacity 0.2s", display:"block" },
  navPill:   { display:"flex", alignItems:"center", gap:"10px", width:"100%", padding:"11px 14px", borderRadius:"12px", cursor:"pointer", fontFamily:"'Nunito',sans-serif", fontSize:"13px", fontWeight:"700", textAlign:"left", transition:"all 0.18s ease", border:"1.5px solid transparent" },

  content:   { flex:1, padding:"48px 48px 60px", overflowY:"auto", maxHeight:"100vh", boxSizing:"border-box" },

  glassCard: { background:"rgba(255,255,255,0.55)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", borderRadius:"24px", padding:"28px 32px", border:"1px solid rgba(255,255,255,0.75)", boxShadow:"0 6px 32px rgba(205,44,88,0.08)" },
  subHead:   { fontSize:"14px", fontWeight:"900", color:"#CD2C58", margin:"16px 0 8px", fontFamily:"'Nunito',sans-serif" },
  para:      { fontSize:"13.5px", color:"#3d2060", lineHeight:1.8, margin:"0 0 14px", fontWeight:"500" },
  valueBox:  { background:"rgba(255,255,255,0.65)", borderRadius:"16px", padding:"16px", border:"1px solid rgba(205,44,88,0.1)", display:"flex", flexDirection:"column", gap:"5px" },
};