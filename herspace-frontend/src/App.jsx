import React, { useState, useEffect } from "react";
import logo from "./assets/logo.png";
import bg from "./assets/bg.jpg";
import sticker from "./assets/girl-sticker.png";
import yogaGirl from "./assets/yoga-girl.png";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import LearnMore from "./pages/LearnMore";
// ── CHANGE 1 ── Import ZoneReport
import ZoneReport from "./pages/ZoneReport";
import DoctorConnect from "./pages/DoctorConnect";
import DoctorDashboard from "./pages/DoctorDashboard";
import ContactPage from "./pages/Contact";


const PETAL_DATA = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  size: 14 + (i * 3.7) % 18,
  left: (i * 8.3) % 100,
  delay: (i * 0.85) % 10,
  duration: 7 + (i * 1.1) % 8,
  emoji: ["🌸", "🌺", "🌷", "💮"][i % 4],
}));

function FloatingPetals() {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 1 }}>
      <style>{`
        @keyframes fall {
          0%   { transform: translateY(-60px) rotate(0deg); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.7; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes sway {
          0%   { margin-left: 0px; }
          25%  { margin-left: 40px; }
          75%  { margin-left: -40px; }
          100% { margin-left: 0px; }
        }
        @keyframes fadeInUp {
          0%   { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.06); }
        }
        .hero-animate { animation: fadeInUp 0.9s ease forwards; }
        .pulse-btn    { animation: pulse 2.5s ease-in-out infinite; }
      `}</style>
      {PETAL_DATA.map((p) => (
        <div key={p.id} style={{
          position: "absolute", left: `${p.left}%`, top: "-40px",
          fontSize: `${p.size}px`, opacity: 0,
          animation: `fall ${p.duration}s ${p.delay}s linear infinite, sway ${p.duration * 0.6}s ${p.delay}s ease-in-out infinite`,
          pointerEvents: "none",
        }}>
          {p.emoji}
        </div>
      ))}
    </div>
  );
}

function FlipCard({ icon, title, text, backText, topBadge }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div style={S.flipWrapper} onMouseEnter={() => setFlipped(true)} onMouseLeave={() => setFlipped(false)}>
      <div style={{ ...S.flipInner, transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
        <div style={S.flipFront}>
          {topBadge && <div style={S.stepNumBadge}>{topBadge}</div>}
          <div style={S.cardIcon}>{icon}</div>
          <div style={S.cardTitle}>{title}</div>
          <div style={S.cardText}>{text}</div>
        </div>
        <div style={S.flipBack}>
          {topBadge && <div style={{ ...S.stepNumBadge, color: "rgba(255,255,255,0.5)" }}>{topBadge}</div>}
          <div style={S.cardIcon}>{icon}</div>
          <div style={{ ...S.cardTitle, color: "white" }}>{title}</div>
          <div style={{ ...S.cardText, color: "rgba(255,255,255,0.9)", marginTop: "10px" }}>{backText}</div>
        </div>
      </div>
    </div>
  );
}

// ── PAGES ─────────────────────────────────────────────────────────────────────
function HomePage({ onLearnMore }) {
  return (
    <section style={S.hero}>
      <div style={S.heroRow}>
        <div style={S.heroLeft}>
          <div className="hero-animate" style={S.mascotCard}>
            <div style={S.stickerCircle}>
              <img src={sticker} alt="HerSpace guide" style={S.stickerImg} />
            </div>
            <div style={S.mascotText}>
              <div style={S.mascotTitle}>Welcome to HerSpace 💕</div>
              <div style={S.mascotSub}>Your PCOD companion is here for you</div>
            </div>
          </div>
          <h1 className="hero-animate" style={{ ...S.h1, animationDelay: "0.35s", opacity: 0 }}>
            Your Safe Space for <span style={S.pink}>PCOD Lifestyle Balance</span>
          </h1>
          <p className="hero-animate" style={{ ...S.subtext, animationDelay: "0.5s", opacity: 0 }}>
            Track your lifestyle habits, understand hormonal balance,
            and receive personalized guidance to manage PCOD naturally.
          </p>
          <div className="hero-animate" style={{ animationDelay: "0.65s" }}>
            <div style={S.heroBtns}>
              <button className="pulse-btn" style={{ ...S.primaryBtn, cursor: "default", opacity: 0.85 }}>
                Let's Begin ✨
              </button>
              <button style={S.secondaryBtn} onClick={onLearnMore}>Learn More</button>
            </div>
          </div>
        </div>
        <div style={S.heroRight}>
          <div className="hero-animate" style={{ ...S.heroIllustrationCard, opacity: 0, animationDelay: "0.4s" }}>
            <div style={S.heroIllustrationCircle}>
              <img src={yogaGirl} alt="Wellness illustration" style={S.heroIllustrationImg} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesPage() {
  const features = [
    { icon: "😊", title: "Mood Tracking",    text: "Log your daily emotions and spot patterns over time.",      backText: "Our smart mood tracker helps you identify emotional triggers and patterns with beautiful daily & weekly charts." },
    { icon: "🤖", title: "AI Guidance",       text: "Get personalized lifestyle advice powered by AI.",          backText: "Our AI analyzes your unique PCOD profile and gives tailored advice on diet, sleep, and stress management." },
    { icon: "📊", title: "Progress Insights", text: "Beautiful visual charts to track your wellness journey.",   backText: "Radar charts, trend graphs, and weekly summaries help you see your progress at a glance." },
    { icon: "🔒", title: "Safe & Private",    text: "Your data is encrypted and never shared.",                 backText: "End-to-end encryption ensures your health data stays 100% private — only you can see it." },
    { icon: "🌙", title: "Sleep Analysis",    text: "Understand how sleep affects your mental health.",         backText: "Track sleep quality and duration, and discover how it directly impacts your mood and PCOD symptoms." },
    { icon: "🧘", title: "Mindfulness",       text: "Guided breathing and meditation exercises.",               backText: "Daily 5-minute mindfulness sessions proven to reduce cortisol and improve hormonal balance." },
  ];
  return (
    <section style={S.page}>
      <h2 style={S.pageTitle}>What <span style={S.pink}>HerSpace</span> Offers</h2>
      <p style={S.pageSubtext}>Everything you need for your wellness journey.</p>
      <div style={S.grid}>
        {features.map((f) => <FlipCard key={f.title} {...f} />)}
      </div>
    </section>
  );
}

function HowItWorksPage() {
  const steps = [
    { num: "01", icon: "📝", title: "Take Assessment",   text: "Answer simple questions about your lifestyle.",  backText: "Takes only 5 minutes! Covers sleep, stress, diet, emotions and daily habits to build your profile." },
    { num: "02", icon: "🧠", title: "Get Your Analysis", text: "See your wellness radar chart and score.",        backText: "Your personalized radar chart shows scores across 6 wellness dimensions with detailed breakdown." },
    { num: "03", icon: "💡", title: "Receive Guidance",  text: "Get AI-powered suggestions for your profile.",   backText: "Customized daily tips on nutrition, sleep, mindfulness and exercise based on your unique PCOD profile." },
    { num: "04", icon: "📈", title: "Track Progress",    text: "Log daily moods and watch yourself improve.",    backText: "Weekly progress reports show how your lifestyle changes are improving your hormonal health over time." },
  ];
  return (
    <section style={S.page}>
      <h2 style={S.pageTitle}>How It <span style={S.pink}>Works</span></h2>
      <p style={S.pageSubtext}>Hover each step to learn more ✨</p>
      <div style={S.stepsGrid}>
        {steps.map((s, i) => (
          <React.Fragment key={s.num}>
            <FlipCard icon={s.icon} title={s.title} text={s.text} backText={s.backText} topBadge={s.num} />
            {i < steps.length - 1 && <div style={S.stepArrow}>→</div>}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}

function AboutPage() {
  return (
    <section style={{ ...S.page, maxWidth: "680px", margin: "0 auto" }}>
      <h2 style={S.pageTitle}>About <span style={S.pink}>HerSpace</span></h2>
      <p style={{ ...S.pageSubtext, marginBottom: "24px" }}>
        A safe, judgment-free wellness platform built for women with PCOD.
      </p>
      <div style={S.glassCard}>
        <p style={S.aboutText}>
          We believe every woman deserves access to tools that help her understand her emotions,
          manage stress, and build healthier habits — without stigma or complexity.
        </p>
        <p style={{ ...S.aboutText, marginTop: "16px" }}>
          Our AI-driven assessments and mood tracking tools give you real, actionable insights
          about your mental and emotional health, so you can take control of your wellbeing.
        </p>
        <div style={S.stats}>
          {[
            { num: "10K+", label: "Women Helped" },
            { num: "95%",  label: "Feel Better"  },
            { num: "24/7", label: "AI Support"   },
          ].map((s) => (
            <div key={s.label} style={S.statGlass}>
              <div style={S.statGlassNum}>{s.num}</div>
              <div style={S.statGlassLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AuthPage({ screen, onSwitch, onLoginSuccess, onLoginFail }) {
  return screen === "login"
    ? <Login
        onLoginSuccess={onLoginSuccess}
        onLoginFail={onLoginFail}
        onGoSignup={() => onSwitch("signup")}
      />
    : <Signup
        onSignupSuccess={() => onSwitch("login")}
        onGoLogin={() => onSwitch("login")}
      />;
}

// ── LOADING SCREEN ────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #fff0f5, #fce4ec)", gap: "16px",
    }}>
      <div style={{ fontSize: "52px", animation: "spin 1.5s ease-in-out infinite" }}>🌸</div>
      <p style={{ color: "#CD2C58", fontWeight: "600", fontSize: "15px", fontFamily: "'Segoe UI', sans-serif" }}>
        Loading HerSpace...
      </p>
      <style>{`
        @keyframes spin {
          0%, 100% { transform: rotate(-15deg) scale(1); }
          50%       { transform: rotate(15deg) scale(1.1); }
        }
      `}</style>
    </div>
  );
}


// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [active, setActive]           = useState("home");
  const [authScreen, setAuthScreen]   = useState("signup");
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  // ── CHANGE 2 ── Add zoneReportData state
  const [zoneReportData, setZoneReportData] = useState(null);
  const [doctorPatientData, setDoctorPatientData] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          credentials: "include",
        });
        if (res.ok) {
          const user = await res.json();
          setCurrentUser(user);
          setActive("dashboard");
        } else {
          setActive("home");
        }
      } catch (err) {
        console.error("Session check error:", err);
        setActive("home");
      } finally {
        setAuthChecked(true);
      }
    };
    checkSession();
  }, []);

  const handleLoginSuccess = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/me", {
        credentials: "include",
      });
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        setActive("dashboard");
      }
    } catch (err) {
      console.error("Login redirect error:", err);
      setActive("home");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    }
    setCurrentUser(null);
    setActive("home");
  };

  if (!authChecked) return <LoadingScreen />;

  // ── FULL PAGE ROUTES ───────────────────────────────────────────────────────
  if (active === "learnmore")
    return <LearnMore onBack={() => setActive("home")} />;

  // ── CHANGE 3 ── ZoneReport full-page route (before dashboard check)
  if (active === "zoneReport") {
    return (
      <ZoneReport
        result={zoneReportData}
        onGoToDashboard={() => {
          setZoneReportData(null);
          setActive("dashboard");
        }}
        onGoToDoctorConnect={(trackerPayload) => {
          setDoctorPatientData({
            name: currentUser?.name || "Current User",
            email: currentUser?.email || "",
            current: trackerPayload?.current || trackerPayload || null,
            tracker: trackerPayload || null,
          });
          setActive("doctor_connect");
        }}
      />
    );
  }

  if (active === "doctor_connect") {
    return (
      <DoctorConnect
        onBack={() => setActive("dashboard")}
        onOpenDoctorDashboard={() => setActive("doctor_dashboard")}
      />
    );
  }

  if (active === "doctor_dashboard") {
    return (
      <DoctorDashboard
        fallbackPatient={doctorPatientData}
        onBack={() => setActive("doctor_connect")}
      />
    );
  }

  // Dashboard handles AboutYou + RapidFire internally
  // Pass onGoToZoneReport so RapidFire can bubble the result up
  if (active === "dashboard") {
    return (
      <Dashboard
        onLogout={handleLogout}
        currentUser={currentUser}
        onGoToZoneReport={(result) => {
          setZoneReportData(result);
          setActive("zoneReport");
        }}
      />
    );
  }

  // ── NAV PAGES (home, features, etc.) ─────────────────────────────────────
  const NAV_TABS = [
    { id: "home",       label: "Home",         component: <HomePage onLearnMore={() => setActive("learnmore")} /> },
    { id: "features",   label: "Features",     component: <FeaturesPage />   },
    { id: "howitworks", label: "How It Works", component: <HowItWorksPage /> },
    { id: "about",      label: "About",        component: <AboutPage />      },
    { id: "contact",    label: "Contact",      component: <ContactPage />    },
    {
      id: "auth", label: "Auth",
      component: <AuthPage
        screen={authScreen}
        onSwitch={(s) => setAuthScreen(s)}
        onLoginSuccess={handleLoginSuccess}
        onLoginFail={() => setActive("home")}
      />
    },
  ];

  const current = NAV_TABS.find((t) => t.id === active) || NAV_TABS[0];

  return (
    <>
      <style>{`.nav-tab:hover { color: #ff4f8b !important; }`}</style>
      <div style={S.root}>
        <div style={S.overlay} />
        {active === "home" && <FloatingPetals />}

        <header style={S.header}>
          <div style={S.headerInner}>
            <div style={S.logoBox}>
              <img src={logo} alt="HerSpace" style={S.logoImg} />
            </div>
            <nav style={S.tabBar}>
              {NAV_TABS.filter(t => t.id !== "auth").map((tab) => (
                <button key={tab.id} className="nav-tab"
                  onClick={() => setActive(tab.id)}
                  style={{ ...S.tab, ...(active === tab.id ? S.tabActive : {}) }}>
                  {tab.label}
                  {active === tab.id && <div style={S.tabUnderline} />}
                </button>
              ))}
            </nav>
            <div style={S.authBtns}>
              <button style={S.loginBtn} onClick={() => { setAuthScreen("login"); setActive("auth"); }}>
                Login
              </button>
              <button style={S.signupBtn} onClick={() => { setAuthScreen("signup"); setActive("auth"); }}>
                Sign Up
              </button>
            </div>
          </div>
        </header>

        <main style={S.main}>{current.component}</main>

        <footer style={S.footer}>
          © 2026 HerSpace · "Your mental health is a priority." 🌸
        </footer>
      </div>
    </>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const S = {
  root: {
    fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh",
    backgroundImage: `url(${bg})`, backgroundSize: "cover",
    backgroundPosition: "center", backgroundAttachment: "fixed",
    display: "flex", flexDirection: "column", position: "relative",
  },
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(255,220,220,0.55)",
    backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", zIndex: 0,
  },
  header: {
    background: "rgba(255,255,255,0.75)",
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(205,44,88,0.15)",
    position: "sticky", top: 0, zIndex: 100,
  },
  headerInner: { display: "flex", alignItems: "center", padding: "0 32px", gap: "8px", height: "64px" },
  logoBox: { marginRight: "16px", display: "flex", alignItems: "center" },
  logoImg: { height: "48px", objectFit: "contain" },
  tabBar: { display: "flex", alignItems: "center", flex: 1, gap: "2px", height: "100%" },
  tab: {
    position: "relative", background: "none", border: "none",
    padding: "0 16px", height: "64px", fontSize: "14px",
    fontWeight: "500", color: "#666", cursor: "pointer",
    transition: "color 0.2s", whiteSpace: "nowrap",
  },
  tabActive: { color: "#CD2C58", fontWeight: "700" },
  tabUnderline: {
    position: "absolute", bottom: 0, left: "50%",
    transform: "translateX(-50%)", width: "70%", height: "3px",
    borderRadius: "3px 3px 0 0",
    background: "linear-gradient(90deg, #CD2C58, #E06C9F)",
  },
  authBtns: { display: "flex", gap: "10px", marginLeft: "auto" },
  loginBtn: {
    padding: "8px 20px", border: "2px solid #CD2C58", borderRadius: "25px",
    background: "transparent", color: "#CD2C58", fontWeight: "600", cursor: "pointer", fontSize: "13px",
  },
  signupBtn: {
    padding: "8px 20px", border: "none", borderRadius: "25px",
    background: "linear-gradient(135deg, #E06C9F, #CD2C58)",
    color: "white", fontWeight: "600", cursor: "pointer", fontSize: "13px",
    boxShadow: "0 4px 14px rgba(205,44,88,0.35)",
  },
  main: { flex: 1, padding: "40px 20px", position: "relative", zIndex: 2 },
  footer: {
    textAlign: "center", padding: "16px", fontSize: "12px", color: "#CD2C58",
    borderTop: "1px solid rgba(205,44,88,0.15)",
    background: "rgba(255,255,255,0.4)", backdropFilter: "blur(10px)",
    position: "relative", zIndex: 2,
  },
  hero: { display: "flex", justifyContent: "center", paddingTop: "40px", paddingInline: "20px" },
  heroRow: {
    display: "flex", flexWrap: "wrap", alignItems: "center",
    justifyContent: "space-between", gap: "32px", maxWidth: "1100px", width: "100%",
  },
  heroLeft: { flex: "1 1 340px", display: "flex", flexDirection: "column", gap: "18px" },
  heroRight: { flex: "1 1 260px", display: "flex", justifyContent: "center" },
  mascotCard: {
    display: "flex", alignItems: "center", gap: "12px",
    background: "rgba(255,255,255,0.5)", backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.8)", borderRadius: "20px", padding: "14px 24px",
    boxShadow: "0 8px 32px rgba(205,44,88,0.15)",
  },
  stickerCircle: {
    width: "52px", height: "52px", borderRadius: "50%",
    background: "linear-gradient(135deg, #fce4ec, #f8bbd0)",
    overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  stickerImg: { width: "100%", height: "100%", objectFit: "cover" },
  mascotText: { textAlign: "left" },
  mascotTitle: { fontWeight: "800", fontSize: "15px", color: "#CD2C58" },
  mascotSub: { fontSize: "12px", color: "#888", marginTop: "2px" },
  h1: { fontSize: "clamp(30px, 5vw, 56px)", fontWeight: "900", color: "#1a1a2e", lineHeight: 1.15, maxWidth: "720px", margin: 0 },
  pink: { color: "#CD2C58" },
  subtext: { fontSize: "16px", color: "#444", maxWidth: "520px", lineHeight: 1.7, margin: 0 },
  heroBtns: { display: "flex", gap: "14px" },
  primaryBtn: {
    padding: "13px 32px", border: "none", borderRadius: "30px",
    background: "linear-gradient(135deg, #E06C9F, #CD2C58)", color: "white",
    fontWeight: "700", fontSize: "15px", cursor: "pointer",
    boxShadow: "0 6px 20px rgba(205,44,88,0.4)",
  },
  secondaryBtn: {
    padding: "13px 32px", border: "2px solid #CD2C58", borderRadius: "30px",
    background: "rgba(255,255,255,0.6)", backdropFilter: "blur(8px)",
    color: "#CD2C58", fontWeight: "700", fontSize: "15px", cursor: "pointer",
  },
  heroIllustrationCard: {
    background: "rgba(255,255,255,0.6)", backdropFilter: "blur(18px)",
    borderRadius: "30px", padding: "24px", boxShadow: "0 12px 40px rgba(205,44,88,0.2)",
  },
  heroIllustrationCircle: {
    width: "260px", height: "260px", borderRadius: "32px",
    background: "radial-gradient(circle at top, #ffe6f0, #f8bbd0)",
    display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  heroIllustrationImg: { width: "220px", height: "220px", objectFit: "cover" },
  page: { textAlign: "center" },
  pageTitle: { fontSize: "clamp(24px, 3.5vw, 40px)", fontWeight: "900", color: "#1a1a2e", marginBottom: "10px" },
  pageSubtext: { fontSize: "15px", color: "#555", marginBottom: "36px" },
  grid: { display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center", maxWidth: "860px", margin: "0 auto" },
  flipWrapper: { width: "220px", height: "200px", perspective: "1000px", cursor: "pointer" },
  flipInner: {
    position: "relative", width: "100%", height: "100%",
    transformStyle: "preserve-3d", transition: "transform 0.6s cubic-bezier(0.4,0.2,0.2,1)",
  },
  flipFront: {
    position: "absolute", inset: 0, background: "rgba(255,220,220,0.55)",
    backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.75)",
    borderRadius: "18px", padding: "20px 16px", textAlign: "center",
    backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
    boxShadow: "0 8px 32px rgba(205,44,88,0.12)",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  },
  flipBack: {
    position: "absolute", inset: 0,
    background: "linear-gradient(135deg, #E06C9F, #CD2C58)",
    border: "1px solid rgba(255,255,255,0.3)", borderRadius: "18px",
    padding: "20px 16px", textAlign: "center",
    backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
    transform: "rotateY(180deg)", boxShadow: "0 8px 32px rgba(205,44,88,0.3)",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  },
  stepNumBadge: { fontSize: "28px", fontWeight: "900", color: "rgba(205,44,88,0.2)", lineHeight: 1, marginBottom: "6px" },
  cardIcon: { fontSize: "28px", marginBottom: "8px" },
  cardTitle: { fontWeight: "700", fontSize: "14px", color: "#1a1a2e", marginBottom: "5px" },
  cardText: { fontSize: "12px", color: "#555", lineHeight: 1.5 },
  stepsGrid: { display: "flex", flexWrap: "nowrap", gap: "6px", justifyContent: "center", maxWidth: "1100px", margin: "0 auto", alignItems: "center" },
  stepArrow: { fontSize: "22px", color: "#CD2C58", fontWeight: "bold", flexShrink: 0 },
  glassCard: {
    background: "rgba(255,255,255,0.35)", backdropFilter: "blur(16px)",
    border: "1px solid rgba(255,255,255,0.7)", borderRadius: "24px", padding: "36px", textAlign: "left",
    boxShadow: "0 8px 32px rgba(205,44,88,0.1)",
  },
  aboutText: { fontSize: "15px", color: "#333", lineHeight: 1.7 },
  stats: { display: "flex", gap: "16px", marginTop: "28px", justifyContent: "center", flexWrap: "wrap" },
  statGlass: {
    background: "rgba(255,255,255,0.4)", backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.6)", borderRadius: "16px", padding: "16px 28px", textAlign: "center",
    boxShadow: "0 4px 20px rgba(205,44,88,0.1)",
  },
  statGlassNum: { fontSize: "24px", fontWeight: "900", color: "#CD2C58" },
  statGlassLabel: { fontSize: "12px", color: "#666", marginTop: "4px" },
  label: { display: "block", fontSize: "13px", fontWeight: "600", color: "#333", marginBottom: "6px" },
  input: {
    width: "100%", padding: "11px 14px", border: "1.5px solid rgba(205,44,88,0.2)",
    borderRadius: "10px", fontSize: "14px", outline: "none",
    background: "rgba(255,255,255,0.6)", backdropFilter: "blur(8px)", boxSizing: "border-box",
  },
};