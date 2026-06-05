const ZonesTracker = require("../models/ZonesTracker");
const RapidFire    = require("../models/RapidFire");

const ZONE_DISPLAY_NAMES = {
  healthy: "stabilize and recover",
  mild: "support sensitivity",
  moderate: "build consisteny",
  high: "maintain and optimize",
};

function getZoneDisplayName(zone) {
  return ZONE_DISPLAY_NAMES[zone] || zone;
}

function shouldShowDoctorPart(zone) {
  return zone === "moderate" || zone === "high";
}

const AI_MODELS = [
  "deepseek/deepseek-r1-distill-llama-70b:free",
  "deepseek/deepseek-chat-v3-0324:free",
  "deepseek/deepseek-r1-distill-qwen-32b:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "qwen/qwen-2.5-7b-instruct:free",
  "qwen/qwen3-8b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "google/gemma-3-12b-it:free",
  "google/gemma-2-9b-it:free",
  "nvidia/llama-3.1-nemotron-nano-8b-v1:free",
  "microsoft/phi-3-mini-128k-instruct:free",
];

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// ── Try a single AI model ──────────────────────────────────────────────────────
async function tryModel(model, prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OpenRouter API key is not configured");
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173",
      "X-Title": "HerSpace Zones Tracker",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 700,
    }),
  });
  const data = await res.json();
  if (data.error) {
    const err = new Error(data.error.message || "Model error");
    err.is429 = data.error.code === 429 || res.status === 429;
    throw err;
  }
  return data?.choices?.[0]?.message?.content || "";
}

// ── AI with fallback ───────────────────────────────────────────────────────────
async function runAI(prompt, validator) {
  let lastErr;
  const rateLimited = [];

  for (const model of AI_MODELS) {
    try {
      const text   = await tryModel(model, prompt);
      const clean  = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      if (validator(parsed)) return parsed;
    } catch (e) {
      lastErr = e;
      if (e.is429) rateLimited.push(model);
    }
  }

  if (rateLimited.length > 0) {
    await sleep(4000);
    for (const model of rateLimited) {
      try {
        const text   = await tryModel(model, prompt);
        const clean  = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        if (validator(parsed)) return parsed;
      } catch (e) { lastErr = e; }
    }
  }

  throw lastErr || new Error("All AI models unavailable");
}

// ── Generate Action Plan ───────────────────────────────────────────────────────
async function generateActionPlan(zone, detectedSymptoms, miniCheckin, stabilityScore) {
  const symptomList    = detectedSymptoms?.join(", ") || "none";
  const changesSummary = miniCheckin
    ? `Energy: ${miniCheckin.energy}, Symptoms: ${miniCheckin.symptoms}, Skin: ${miniCheckin.skin}, Stress: ${miniCheckin.stress}, Overall: ${miniCheckin.overall}`
    : "First assessment — no prior check-in data";

  const prompt = `You are a warm women's wellness advisor specialising in PCOD.
Zone: ${zone} | Stability: ${stabilityScore} | Symptoms: ${symptomList} | Changes: ${changesSummary}

Return ONLY valid JSON, no markdown:
{
  "diet": ["tip1","tip2","tip3"],
  "movement": ["tip1","tip2","tip3"],
  "selfCare": ["tip1","tip2","tip3"],
  "insight": "one warm sentence"
}`;

  try {
    return await runAI(prompt, (p) => p.diet && p.movement && p.selfCare);
  } catch {
    return {
      diet:     ["Include anti-inflammatory foods like turmeric, berries, and leafy greens", "Reduce refined sugar and processed carbs", "Stay hydrated with 8–10 glasses of water daily"],
      movement: ["30 minutes of brisk walking or light cardio daily", "Yoga 3x per week to reduce cortisol", "Gentle strength training twice a week for insulin sensitivity"],
      selfCare: ["7–8 hours of quality sleep consistently", "10 minutes of mindfulness each morning", "Journal your symptoms weekly to spot patterns"],
      insight:  "Consistency is your superpower — small daily habits create lasting hormonal balance.",
    };
  }
}

// ── Generate AI Insights (Part 2) ─────────────────────────────────────────────
async function generateAIInsights(zone, detectedSymptoms, score, confidencePct, lifestyleAnswers) {
  const symptomList      = detectedSymptoms?.join(", ") || "none";
  const lifestyleSummary = lifestyleAnswers?.length > 0
    ? lifestyleAnswers.map(la => `${la.question}: ${la.answer}`).join("; ")
    : "No lifestyle data";

  const prompt = `You are a compassionate women's health AI specialising in PCOD.
Zone: ${zone} | Score: ${score} | Confidence: ${confidencePct}% | Symptoms: ${symptomList} | Lifestyle: ${lifestyleSummary}

Write 3 personalised, warm, clinically-grounded insights specific to HER situation.
Return ONLY valid JSON, no markdown:
{
  "insights": [
    {"title":"...","body":"...","icon":"🌸"},
    {"title":"...","body":"...","icon":"💡"},
    {"title":"...","body":"...","icon":"🌿"}
  ],
  "summary": "one warm sentence summarising her overall picture"
}`;

  const fallbacks = {
    healthy: { insights:[{title:"Your Hormones Look Balanced",body:"Your responses suggest a well-functioning endocrine system with no significant PCOD indicators.",icon:"🌿"},{title:"Prevention is Your Superpower",body:"Staying in the healthy zone means your current habits are working — keep prioritising sleep and whole foods.",icon:"💡"},{title:"Track Seasonal Changes",body:"Even healthy zones can shift — a quarterly check-in helps you catch changes early.",icon:"🌸"}], summary:"Your hormonal health looks strong right now — keep nurturing what's working." },
    mild:    { insights:[{title:"Early Signals Detected",body:"You're showing a few mild PCOD indicators, but lifestyle changes can make a powerful difference at this stage.",icon:"🌿"},{title:"Your Diet Matters Most Now",body:"Reducing refined sugars and increasing anti-inflammatory foods can noticeably shift your hormonal balance.",icon:"💡"},{title:"Stress is a Hidden Trigger",body:"Even 10 minutes of daily breathwork makes a measurable difference in cortisol levels.",icon:"🌸"}], summary:"You're catching this early — small consistent changes now can prevent progression." },
    moderate:{ insights:[{title:"Your Body is Signalling for Support",body:"Multiple hormonal patterns suggest your endocrine system is under stress — this is manageable with the right approach.",icon:"🌿"},{title:"Insulin Sensitivity is Key",body:"Your symptom profile suggests insulin resistance may be playing a role — low-GI foods and movement help significantly.",icon:"💡"},{title:"Professional Evaluation Recommended",body:"At this level, a gynaecologist consultation alongside lifestyle changes gives you the clearest path forward.",icon:"🌸"}], summary:"You're not alone in this — with the right support, moderate risk is very manageable." },
    high:    { insights:[{title:"Strong Hormonal Imbalance Signals",body:"Your responses indicate several strong PCOD clinical indicators — early medical guidance leads to significantly better outcomes.",icon:"🌿"},{title:"Please Don't Wait to Seek Help",body:"A gynaecologist can run targeted tests and provide treatment options that lifestyle alone cannot fully address.",icon:"💡"},{title:"You Are Not Your Diagnosis",body:"PCOD is highly manageable — thousands of women live full healthy lives with the right support.",icon:"🌸"}], summary:"Prompt attention now leads to the best outcomes — you deserve proper support." },
  };

  try {
    return await runAI(prompt, (p) => p.insights?.length > 0);
  } catch {
    return fallbacks[zone] || fallbacks.mild;
  }
}

// ── Stability Score ────────────────────────────────────────────────────────────
function getStabilityScore(miniCheckin) {
  if (!miniCheckin) return "Stable";
  const scores = [
    miniCheckin.energy   === "Improved" ? 1 : miniCheckin.energy   === "Worse"     ? -1 : 0,
    miniCheckin.symptoms === "Reduced"  ? 1 : miniCheckin.symptoms === "Increased" ? -1 : 0,
    miniCheckin.skin     === "Better"   ? 1 : miniCheckin.skin     === "Worse"     ? -1 : 0,
    miniCheckin.stress   === "Lower"    ? 1 : miniCheckin.stress   === "Higher"    ? -1 : 0,
    miniCheckin.overall  === "Better"   ? 1 : miniCheckin.overall  === "Worse"     ? -1 : 0,
  ];
  const total = scores.reduce((a, b) => a + b, 0);
  if (total >= 2)  return "Improving";
  if (total <= -2) return "Worsening";
  return "Stable";
}

function getMiniCheckinScore(miniCheckin) {
  if (!miniCheckin) return 0;
  return [
    miniCheckin.energy   === "Improved" ? 1 : miniCheckin.energy   === "Worse"     ? -1 : 0,
    miniCheckin.symptoms === "Reduced"  ? 1 : miniCheckin.symptoms === "Increased" ? -1 : 0,
    miniCheckin.skin     === "Better"   ? 1 : miniCheckin.skin     === "Worse"     ? -1 : 0,
    miniCheckin.stress   === "Lower"    ? 1 : miniCheckin.stress   === "Higher"    ? -1 : 0,
    miniCheckin.overall  === "Better"   ? 1 : miniCheckin.overall  === "Worse"     ? -1 : 0,
  ].reduce((a, b) => a + b, 0);
}

function buildMonthlyRiskEvent(snapshot) {
  if (snapshot?.zone !== "high") return null;
  return {
    source: "monthly",
    level: "high",
    summary: `Monthly re-check stayed in high-risk zone with score ${snapshot.finalScore ?? 0}.`,
    recordedAt: snapshot.savedAt || new Date(),
  };
}

function buildMiniRiskEvent(tracker, miniCheckin, stabilityScore) {
  const miniScore = getMiniCheckinScore(miniCheckin);
  const currentZone = tracker?.current?.zone || "mild";
  const isDoctorVisibleZone = shouldShowDoctorPart(currentZone);
  const highRiskMini =
    isDoctorVisibleZone && (
      (currentZone === "high" && stabilityScore !== "Improving") ||
      (currentZone === "moderate" && stabilityScore === "Worsening") ||
      miniScore <= -3
    );

  if (!highRiskMini) return null;

  return {
    source: "mini",
    level: "high",
    summary: `Mini check-in flagged high risk while current zone is ${currentZone} and stability is ${stabilityScore}.`,
    recordedAt: miniCheckin.submittedAt || new Date(),
  };
}

function countHighRiskEvents(tracker) {
  return (tracker?.riskEvents || []).filter((event) => event.level === "high").length;
}

function normalizeSymptoms(symptoms = []) {
  return [...new Set(
    (Array.isArray(symptoms) ? symptoms : [])
      .map((item) => String(item || "").trim().toLowerCase())
      .filter(Boolean)
  )].sort();
}

function snapshotsEquivalent(current, latest) {
  const currentSymptoms = normalizeSymptoms(current?.detectedSymptoms);
  const latestSymptoms = normalizeSymptoms(latest?.detectedSymptoms);
  return (
    current?.zone === latest?.zone &&
    Number(current?.finalScore ?? 0) === Number(latest?.finalScore ?? 0) &&
    Number(current?.confidencePct ?? 0) === Number(latest?.confidencePct ?? 0) &&
    currentSymptoms.length === latestSymptoms.length &&
    currentSymptoms.every((symptom, idx) => symptom === latestSymptoms[idx])
  );
}

function withZoneMeta(snapshot) {
  if (!snapshot) return snapshot;
  const plain = typeof snapshot.toObject === "function" ? snapshot.toObject() : { ...snapshot };
  return {
    ...plain,
    zoneDisplayName: getZoneDisplayName(plain.zone),
    showDoctorPart: shouldShowDoctorPart(plain.zone),
  };
}

function withTrackerZoneMeta(tracker) {
  if (!tracker) return tracker;
  const plain = typeof tracker.toObject === "function" ? tracker.toObject() : { ...tracker };
  return {
    ...plain,
    current: withZoneMeta(plain.current),
    history: Array.isArray(plain.history) ? plain.history.map(withZoneMeta) : [],
  };
}

function getZoneSeverity(zone) {
  const severity = { healthy: 1, mild: 2, moderate: 3, high: 4 };
  return severity[zone] || 0;
}

function buildRapidFirePatterns(latestRapidFire) {
  if (!latestRapidFire) return [];

  const rf = typeof latestRapidFire.toObject === "function"
    ? latestRapidFire.toObject()
    : latestRapidFire;

  const symptoms = Array.isArray(rf.detectedSymptoms) ? rf.detectedSymptoms : [];
  const lifestyleAnswers = Array.isArray(rf.lifestyleAnswers) ? rf.lifestyleAnswers : [];

  const has = (key) => symptoms.includes(key);

  const patterns = [];

  // Symptom-combination patterns (mirrors the style used in period tracker insights)
  if (has("irregularPeriods")) {
    patterns.push({
      type: "alert",
      icon: "📅",
      title: "Cycle Pattern",
      text: "Irregular cycles can be a hallmark of PCOD and often point to ovulation imbalance.",
    });
  }

  if (has("hairThinning") && has("facialHair")) {
    patterns.push({
      type: "info",
      icon: "💆‍♀️",
      title: "Hair Pattern",
      text: "Scalp thinning combined with facial hair growth is a classic androgen excess pattern common in PCOD.",
    });
  }

  if (has("acne") || has("darkPatches")) {
    patterns.push({
      type: "info",
      icon: "✨",
      title: "Skin & Hormones",
      text: "Persistent acne (especially jaw/chin) and dark patches are often androgen/insulin-driven and can signal hormonal imbalance.",
    });
  }

  if (has("weightGain") && has("darkPatches")) {
    patterns.push({
      type: "info",
      icon: "⚖️",
      title: "Weight & Insulin",
      text: "Weight gain along with dark patches can suggest insulin resistance — a common metabolic driver in PCOD.",
    });
  }

  if (has("moodSwings")) {
    patterns.push({
      type: "info",
      icon: "🧠",
      title: "Mood Pattern",
      text: "Mood swings can track with hormonal fluctuations and higher cortisol — stress and sleep support can help a lot.",
    });
  }

  if (has("ovulationIssues")) {
    patterns.push({
      type: "alert",
      icon: "🥚",
      title: "Ovulation Pattern",
      text: "Difficulty with ovulation can be a strong PCOD signal. Tracking ovulation signs and consulting a clinician can clarify next steps.",
    });
  }

  // Lifestyle patterns (lightweight, based on self-reported answers)
  const answerIsOften = (a) => {
    const v = String(a || "").toLowerCase();
    return v === "often" || v === "always";
  };

  const sleepQ = lifestyleAnswers.find((l) => l.question?.toLowerCase().includes("sleep"));
  if (sleepQ && answerIsOften(sleepQ.answer)) {
    patterns.push({
      type: "tip",
      icon: "😴",
      title: "Sleep Pattern",
      text: "Poor sleep can worsen insulin sensitivity and cortisol — 7–8 hours consistently makes a measurable difference.",
    });
  }

  const stressQ = lifestyleAnswers.find((l) => l.question?.toLowerCase().includes("stress"));
  if (stressQ && answerIsOften(stressQ.answer)) {
    patterns.push({
      type: "tip",
      icon: "🌸",
      title: "Stress Pattern",
      text: "High stress elevates cortisol which can worsen PCOD symptoms — even 10 minutes daily of breathwork helps.",
    });
  }

  return patterns;
}

function buildZonePattern(assessments = []) {
  const snapshots = (assessments || []).filter(Boolean);
  if (snapshots.length === 0) {
    return {
      detected: false,
      code: "no_data",
      message: "No assessments available yet.",
      patterns: [],
    };
  }

  if (snapshots.length === 1) {
    return {
      detected: true,
      code: "single_assessment",
      message: "Pattern insights from your latest assessment",
      patterns: [],
    };
  }

  const last = snapshots[0];
  const prev = snapshots[1];
  const last3 = snapshots.slice(0, 3);

  if (last3.length === 3 && last3.every((item) => item.zone === last.zone)) {
    return {
      detected: true,
      code: "persistent_zone",
      message: `Consistent pattern: staying in ${getZoneDisplayName(last.zone)} zone.`,
      zone: last.zone,
      zoneDisplayName: getZoneDisplayName(last.zone),
      patterns: [],
    };
  }

  if (last.zone === prev.zone) {
    return {
      detected: true,
      code: "short_repeat",
      message: `Pattern detected: recent assessments remain in ${getZoneDisplayName(last.zone)} zone.`,
      zone: last.zone,
      zoneDisplayName: getZoneDisplayName(last.zone),
      patterns: [],
    };
  }

  const delta = getZoneSeverity(last.zone) - getZoneSeverity(prev.zone);
  if (delta < 0) {
    return {
      detected: true,
      code: "improving",
      message: "Pattern detected: your recent trend is improving.",
      fromZone: prev.zone,
      toZone: last.zone,
      fromZoneDisplayName: getZoneDisplayName(prev.zone),
      toZoneDisplayName: getZoneDisplayName(last.zone),
      patterns: [],
    };
  }

  if (delta > 0) {
    return {
      detected: true,
      code: "worsening",
      message: "Pattern detected: your recent trend needs extra support.",
      fromZone: prev.zone,
      toZone: last.zone,
      fromZoneDisplayName: getZoneDisplayName(prev.zone),
      toZoneDisplayName: getZoneDisplayName(last.zone),
      patterns: [],
    };
  }

  return {
    detected: false,
    code: "inconclusive",
    message: "Pattern is still forming. Keep tracking consistently.",
    patterns: [],
  };
}

// ── Build days payload ─────────────────────────────────────────────────────────
function buildDaysPayload(tracker) {
  const now = Date.now();
  const lastAssessmentDate = new Date(tracker.current?.savedAt || tracker.createdAt).getTime();
  const daysSinceFull = Math.floor((now - lastAssessmentDate) / (1000 * 60 * 60 * 24));

  const lastMiniDate  = tracker.miniCheckin?.submittedAt
    ? new Date(tracker.miniCheckin.submittedAt).getTime()
    : null;
  const daysSinceMini = lastMiniDate !== null
    ? Math.floor((now - lastMiniDate) / (1000 * 60 * 60 * 24))
    : null;

  const daysUntilFull = Math.max(0, 14 - daysSinceFull);
  const daysUntilMini = daysSinceMini !== null
    ? Math.max(0, 7 - daysSinceMini)
    : Math.max(0, 7 - daysSinceFull);

  const needsFullCheckin = daysSinceFull >= 14;
  const needsMiniCheckin = !needsFullCheckin && (
    daysSinceMini !== null ? daysSinceMini >= 7 : daysSinceFull >= 7
  );

  return { daysSinceFull, daysSinceMini, daysUntilFull, daysUntilMini, needsFullCheckin, needsMiniCheckin };
}

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/zones/me
// ── NEVER pushes history, NEVER creates duplicates
// ── Only reads tracker + generates action plan if missing
// ══════════════════════════════════════════════════════════════════════════════
const getZonesStatus = async (req, res) => {
  try {
    let tracker = await ZonesTracker.findOne({ userId: req.user.id });

    // ── No tracker at all ──────────────────────────────────────────────────
    if (!tracker) {
      const latest = await RapidFire.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
      if (!latest) return res.status(200).json({ hasZones: false });

      // Create tracker from latest RapidFire — history stays empty here
      // syncRapidFire (POST /sync) is responsible for building history
      const aiPlan = await generateActionPlan(latest.zone, latest.detectedSymptoms, null, "Stable");
      tracker = await ZonesTracker.create({
        userId: req.user.id,
        current: {
          zone:             latest.zone,
          finalScore:       latest.finalScore,
          confidencePct:    latest.confidencePct,
          detectedSymptoms: latest.detectedSymptoms,
          savedAt:          latest.createdAt,
        },
        history:    [],
        miniCheckin: null,
        miniCheckins: [],
        riskEvents: buildMonthlyRiskEvent({
          zone: latest.zone,
          finalScore: latest.finalScore,
          savedAt: latest.createdAt,
        }) ? [buildMonthlyRiskEvent({
          zone: latest.zone,
          finalScore: latest.finalScore,
          savedAt: latest.createdAt,
        })] : [],
        actionPlan: {
          diet:           aiPlan.diet,
          movement:       aiPlan.movement,
          selfCare:       aiPlan.selfCare,
          insight:        aiPlan.insight,
          stabilityScore: "Stable",
          submittedAt:    new Date(),
        },
      });
    }

    // ── Generate action plan if somehow missing (edge case only) ───────────
    if (!tracker.actionPlan) {
      const aiPlan = await generateActionPlan(
        tracker.current?.zone,
        tracker.current?.detectedSymptoms,
        tracker.miniCheckin || null,
        tracker.miniCheckin ? getStabilityScore(tracker.miniCheckin) : "Stable"
      );
      tracker = await ZonesTracker.findOneAndUpdate(
        { userId: req.user.id },
        {
          $set: {
            actionPlan: {
              diet:           aiPlan.diet,
              movement:       aiPlan.movement,
              selfCare:       aiPlan.selfCare,
              insight:        aiPlan.insight,
              stabilityScore: tracker.miniCheckin ? getStabilityScore(tracker.miniCheckin) : "Stable",
              submittedAt:    new Date(),
            },
          },
        },
        { returnDocument: "after" }
      );
    }

    const highRiskLoopCount = countHighRiskEvents(tracker);
    const doctorAllowedZone = shouldShowDoctorPart(tracker?.current?.zone);
    const doctorTrigger = doctorAllowedZone && highRiskLoopCount >= 3 && !tracker.doctorRequest?.triggered;
    if (doctorTrigger) {
      await ZonesTracker.findOneAndUpdate(
        { userId: req.user.id },
        {
          "doctorRequest.triggered":   true,
          "doctorRequest.triggeredAt": new Date(),
          "doctorRequest.summary":     `High-risk loop detected ${highRiskLoopCount} times across mini/monthly check-ins.`,
        }
      );
      tracker = await ZonesTracker.findOne({ userId: req.user.id });
    }

    const days = buildDaysPayload(tracker);
    const latestRapidFire = await RapidFire
      .findOne({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select("zone finalScore confidencePct detectedSymptoms lifestyleAnswers createdAt");

    const latestAssessments = await RapidFire
      .find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("zone finalScore confidencePct detectedSymptoms createdAt");

    const pattern = buildZonePattern(latestAssessments);
    pattern.patterns = buildRapidFirePatterns(latestRapidFire);

    const trackerWithMeta = withTrackerZoneMeta(tracker);
    return res.status(200).json({
      hasZones: true,
      tracker: trackerWithMeta,
      ...days,
      highRiskLoopCount: countHighRiskEvents(tracker),
      doctorTriggered: tracker.doctorRequest?.triggered || false,
      showDoctorPart: shouldShowDoctorPart(tracker?.current?.zone),
      pattern,
    });

  } catch (err) {
    console.error("GetZonesStatus error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/zones/doctor-cta-test
// ── Test-only helper: instantly triggers doctor CTA (moderate/high only)
// ══════════════════════════════════════════════════════════════════════════════
const enableDoctorCtaTest = async (req, res) => {
  try {
    const tracker = await ZonesTracker.findOne({ userId: req.user.id });
    if (!tracker) return res.status(404).json({ message: "No zones tracker found." });

    const zone = tracker.current?.zone;
    if (!shouldShowDoctorPart(zone)) {
      return res.status(400).json({
        message: "Doctor CTA is only available in moderate/high zones.",
        zone,
        zoneDisplayName: getZoneDisplayName(zone),
      });
    }

    const now = new Date();
    tracker.doctorRequest = {
      ...tracker.doctorRequest,
      triggered: true,
      triggeredAt: tracker.doctorRequest?.triggeredAt || now,
      summary: "Doctor CTA test mode enabled (manual trigger).",
      status: tracker.doctorRequest?.status || "pending",
      doctorResponse: tracker.doctorRequest?.doctorResponse,
    };

    await tracker.save();

    return res.status(200).json({
      message: "Doctor CTA test mode enabled.",
      doctorTriggered: true,
      showDoctorPart: true,
      tracker: withTrackerZoneMeta(tracker),
    });
  } catch (err) {
    console.error("enableDoctorCtaTest error:", err.message);
    return res.status(500).json({ message: "Server error." });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/zones/sync
// ── Called ONCE after each new RapidFire quiz completes
// ── Pushes OLD current to history, sets NEW current
// ── Skips only when core snapshot fields are unchanged
// ══════════════════════════════════════════════════════════════════════════════
const syncRapidFire = async (req, res) => {
  try {
    const latest = await RapidFire.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
    if (!latest) return res.status(404).json({ message: "No RapidFire result found." });

    const newSnapshot = {
      zone:             latest.zone,
      finalScore:       latest.finalScore,
      confidencePct:    latest.confidencePct,
      detectedSymptoms: latest.detectedSymptoms,
      savedAt:          latest.createdAt,
    };

    let tracker = await ZonesTracker.findOne({ userId: req.user.id });

    // ── No tracker yet — create fresh ─────────────────────────────────────
    if (!tracker) {
      const aiPlan = await generateActionPlan(latest.zone, latest.detectedSymptoms, null, "Stable");
      const monthlyRiskEvent = buildMonthlyRiskEvent(newSnapshot);
      tracker = await ZonesTracker.create({
        userId:     req.user.id,
        current:    newSnapshot,
        history:    [],
        miniCheckin: null,
        miniCheckins: [],
        riskEvents: monthlyRiskEvent ? [monthlyRiskEvent] : [],
        actionPlan: {
          diet:           aiPlan.diet,
          movement:       aiPlan.movement,
          selfCare:       aiPlan.selfCare,
          insight:        aiPlan.insight,
          stabilityScore: "Stable",
          submittedAt:    new Date(),
        },
      });
      const trackerWithMeta = withTrackerZoneMeta(tracker);
      return res.status(200).json({
        message: "Zones tracker created.",
        tracker: trackerWithMeta,
        showDoctorPart: shouldShowDoctorPart(trackerWithMeta?.current?.zone),
      });
    }

    // ── Already synced? Skip only if snapshot fields are truly unchanged ───
    if (snapshotsEquivalent(tracker.current, newSnapshot)) {
      console.log("✅ syncRapidFire: unchanged snapshot, skipping");
      const trackerWithMeta = withTrackerZoneMeta(tracker);
      return res.status(200).json({
        message: "Already synced.",
        tracker: trackerWithMeta,
        showDoctorPart: shouldShowDoctorPart(trackerWithMeta?.current?.zone),
      });
    }

    // ── New result — push old current to history, set new current ─────────
    // Generate new action plan for new zone
    const aiPlan = await generateActionPlan(latest.zone, latest.detectedSymptoms, null, "Stable");

    const monthlyRiskEvent = buildMonthlyRiskEvent(newSnapshot);
    const updateDoc = {
      $push: { history: { $each: [tracker.current], $position: 0 } },
      $set:  {
        current:     newSnapshot,
        miniCheckin: null,
        actionPlan: {
          diet:           aiPlan.diet,
          movement:       aiPlan.movement,
          selfCare:       aiPlan.selfCare,
          insight:        aiPlan.insight,
          stabilityScore: "Stable",
          submittedAt:    new Date(),
        },
      },
    };

    if (monthlyRiskEvent) {
      updateDoc.$push.riskEvents = { $each: [monthlyRiskEvent], $position: 0 };
    }

    tracker = await ZonesTracker.findOneAndUpdate(
      { userId: req.user.id },
      updateDoc,
      { returnDocument: "after" }
    );

    console.log(`✅ syncRapidFire: synced new zone=${latest.zone}`);
    const trackerWithMeta = withTrackerZoneMeta(tracker);
    return res.status(200).json({
      message: "Zones synced.",
      tracker: trackerWithMeta,
      showDoctorPart: shouldShowDoctorPart(trackerWithMeta?.current?.zone),
    });

  } catch (err) {
    console.error("SyncRapidFire error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/zones/mini — submit mini check-in
// ══════════════════════════════════════════════════════════════════════════════
const submitMiniCheckin = async (req, res) => {
  try {
    const { energy, symptoms, skin, stress, overall } = req.body;

    if (!energy || !symptoms || !skin || !stress || !overall) {
      return res.status(400).json({ message: "All 5 answers required." });
    }

    const miniCheckin    = { energy, symptoms, skin, stress, overall, submittedAt: new Date() };
    const stabilityScore = getStabilityScore(miniCheckin);

    const tracker = await ZonesTracker.findOne({ userId: req.user.id });
    if (!tracker) return res.status(404).json({ message: "No zones tracker found." });

    const aiPlan = await generateActionPlan(
      tracker.current?.zone,
      tracker.current?.detectedSymptoms,
      miniCheckin,
      stabilityScore
    );

    const actionPlan = {
      diet:           aiPlan.diet     || [],
      movement:       aiPlan.movement || [],
      selfCare:       aiPlan.selfCare || [],
      insight:        aiPlan.insight  || "",
      stabilityScore,
      submittedAt:    new Date(),
    };

    const miniRiskEvent = buildMiniRiskEvent(tracker, miniCheckin, stabilityScore);
    const updateDoc = {
      $set: { miniCheckin, actionPlan },
      $push: { miniCheckins: { $each: [miniCheckin], $position: 0 } },
    };

    if (miniRiskEvent) {
      updateDoc.$push.riskEvents = { $each: [miniRiskEvent], $position: 0 };
    }

    const updated = await ZonesTracker.findOneAndUpdate(
      { userId: req.user.id },
      updateDoc,
      { returnDocument: "after" }
    );

    const highRiskLoopCount = countHighRiskEvents(updated);
    if (shouldShowDoctorPart(updated?.current?.zone) && highRiskLoopCount >= 3 && !updated.doctorRequest?.triggered) {
      updated.doctorRequest = {
        ...updated.doctorRequest,
        triggered: true,
        triggeredAt: new Date(),
        summary: `High-risk loop detected ${highRiskLoopCount} times across mini/monthly check-ins.`,
        status: updated.doctorRequest?.status || "pending",
        doctorResponse: updated.doctorRequest?.doctorResponse,
      };
      await updated.save();
    }

    const days = buildDaysPayload(updated);

    const updatedWithMeta = withTrackerZoneMeta(updated);
    res.status(200).json({
      message: "Mini check-in saved!",
      stabilityScore,
      actionPlan,
      tracker: updatedWithMeta,
      ...days,
      highRiskLoopCount: countHighRiskEvents(updated),
      showDoctorPart: shouldShowDoctorPart(updated?.current?.zone),
    });

  } catch (err) {
    console.error("MiniCheckin error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/zones/action-plan
// ══════════════════════════════════════════════════════════════════════════════
const getActionPlan = async (req, res) => {
  try {
    const tracker = await ZonesTracker.findOne({ userId: req.user.id });
    if (!tracker?.actionPlan) return res.status(404).json({ hasActionPlan: false });
    res.status(200).json({
      hasActionPlan: true,
      actionPlan: tracker.actionPlan,
      showDoctorPart: shouldShowDoctorPart(tracker?.current?.zone),
      zoneDisplayName: getZoneDisplayName(tracker?.current?.zone),
    });
  } catch (err) {
    console.error("GetActionPlan error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/zones/history
// ── Returns RapidFire collection directly — the single source of truth
// ── Does NOT use tracker.history array
// ══════════════════════════════════════════════════════════════════════════════
const getZonesHistory = async (req, res) => {
  try {
    // Read directly from RapidFire — this is always correct and never duplicates
    const allAssessments = await RapidFire
      .find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select("zone finalScore confidencePct detectedSymptoms createdAt");

    const tracker = await ZonesTracker.findOne({ userId: req.user.id })
      .select("current history actionPlan doctorRequest miniCheckin");

    if (!tracker) return res.status(404).json({ hasHistory: false });

    const realHistory = allAssessments.map(rf => ({
      zone:             rf.zone,
      zoneDisplayName:  getZoneDisplayName(rf.zone),
      showDoctorPart:   shouldShowDoctorPart(rf.zone),
      finalScore:       rf.finalScore,
      confidencePct:    rf.confidencePct,
      detectedSymptoms: rf.detectedSymptoms,
      savedAt:          rf.createdAt,
    }));

    const latestRapidFire = await RapidFire
      .findOne({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select("zone finalScore confidencePct detectedSymptoms lifestyleAnswers createdAt");

    const pattern = buildZonePattern(allAssessments);
    pattern.patterns = buildRapidFirePatterns(latestRapidFire);

    res.status(200).json({
      hasHistory: true,
      tracker: withTrackerZoneMeta(tracker),
      realHistory,
      showDoctorPart: shouldShowDoctorPart(tracker?.current?.zone),
      pattern,
    });

  } catch (err) {
    console.error("GetHistory error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/zones/ai-insight
// ══════════════════════════════════════════════════════════════════════════════
const generateZoneAIInsight = async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ message: "Zone AI service is not configured." });
    }

    const {
      kind,
      current = {},
      stability = "Stable",
      miniCheckin = null,
      zoneKey = current?.zone || "mild",
      score = current?.finalScore ?? 0,
      confidencePct = current?.confidencePct ?? 0,
      detected = current?.detectedSymptoms || [],
      lifestyleAnswers = [],
    } = req.body || {};

    if (kind === "action-plan") {
      const zone = current?.zone || zoneKey || "mild";
      const detectedSymptoms = Array.isArray(current?.detectedSymptoms)
        ? current.detectedSymptoms
        : [];
      const prompt = `You are a warm women's wellness guide for a PCOD app.
Current zone: ${zone}
Current score: ${current?.finalScore ?? score ?? 0}
Detected symptoms: ${detectedSymptoms.join(", ") || "none"}
Stability: ${stability}
Latest mini check-in:
- Energy: ${miniCheckin?.energy || "unknown"}
- Symptoms: ${miniCheckin?.symptoms || "unknown"}
- Skin: ${miniCheckin?.skin || "unknown"}
- Stress: ${miniCheckin?.stress || "unknown"}
- Overall: ${miniCheckin?.overall || "unknown"}

Return ONLY valid JSON:
{
  "diet": ["tip1","tip2","tip3"],
  "movement": ["tip1","tip2","tip3"],
  "selfCare": ["tip1","tip2","tip3"],
  "insight": "one warm human sentence"
}`;

      const plan = await runAI(
        prompt,
        (parsed) => Array.isArray(parsed?.diet) && Array.isArray(parsed?.movement) && Array.isArray(parsed?.selfCare)
      );
      return res.status(200).json(plan);
    }

    if (kind === "insights") {
      const detectedSymptoms = Array.isArray(detected) ? detected : [];
      const lifestyleSummary = Array.isArray(lifestyleAnswers) && lifestyleAnswers.length > 0
        ? lifestyleAnswers.map((item) => `${item.question}: ${item.answer}`).join("; ")
        : "none";
      const prompt = `You are a compassionate women's health AI for a PCOD wellness app.
Zone: ${zoneKey || "mild"}
Score: ${score ?? 0}
Confidence: ${confidencePct ?? 0}%
Symptoms: ${detectedSymptoms.join(", ") || "none"}
Lifestyle: ${lifestyleSummary}

Return ONLY valid JSON:
{
  "summary": "one warm summary sentence",
  "insights": [
    {"title":"...","body":"...","icon":"🌸"},
    {"title":"...","body":"...","icon":"💡"},
    {"title":"...","body":"...","icon":"🌿"}
  ]
}`;

      const insights = await runAI(
        prompt,
        (parsed) => typeof parsed?.summary === "string" && Array.isArray(parsed?.insights) && parsed.insights.length > 0
      );
      return res.status(200).json(insights);
    }

    return res.status(400).json({ message: "Invalid zone AI insight kind." });
  } catch (err) {
    console.error("generateZoneAIInsight error:", err.message);
    return res.status(502).json({ message: "AI insight is temporarily unavailable." });
  }
};

// GET /api/zones/ai-insights
const getAIInsights = async (req, res) => {
  try {
    const tracker = await ZonesTracker.findOne({ userId: req.user.id });
    if (!tracker) return res.status(404).json({ message: "No tracker found." });

    const latest = await RapidFire.findOne({ userId: req.user.id }).sort({ createdAt: -1 });

    const insights = await generateAIInsights(
      tracker.current?.zone,
      tracker.current?.detectedSymptoms,
      tracker.current?.finalScore,
      tracker.current?.confidencePct,
      latest?.lifestyleAnswers || []
    );

    res.status(200).json({
      insights,
      showDoctorPart: shouldShowDoctorPart(tracker?.current?.zone),
      zoneDisplayName: getZoneDisplayName(tracker?.current?.zone),
    });
  } catch (err) {
    console.error("GetAIInsights error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/zones/fix-history
// ── One-time cleanup: rebuilds tracker.history from RapidFire collection
// ── Call this once via Postman/curl to fix existing dirty data
// ══════════════════════════════════════════════════════════════════════════════
const fixHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const allRF = await RapidFire.find({ userId }).sort({ createdAt: 1 });
    if (allRF.length === 0) return res.status(404).json({ message: "No RapidFire results found." });

    const latest  = allRF[allRF.length - 1];
    const theRest = allRF.slice(0, -1).reverse(); // newest first

    const currentSnap = {
      zone:             latest.zone,
      finalScore:       latest.finalScore,
      confidencePct:    latest.confidencePct,
      detectedSymptoms: latest.detectedSymptoms,
      savedAt:          latest.createdAt,
    };

    const historySnaps = theRest.map(rf => ({
      zone:             rf.zone,
      finalScore:       rf.finalScore,
      confidencePct:    rf.confidencePct,
      detectedSymptoms: rf.detectedSymptoms,
      savedAt:          rf.createdAt,
    }));

    const updated = await ZonesTracker.findOneAndUpdate(
      { userId },
      { $set: { current: currentSnap, history: historySnaps } },
      { returnDocument: "after" }
    );

    res.status(200).json({
      message: `History rebuilt. Current: ${currentSnap.zone}, History entries: ${historySnaps.length}`,
      tracker: updated,
    });
  } catch (err) {
    console.error("FixHistory error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = {
  getZonesStatus,
  syncRapidFire,
  submitMiniCheckin,
  getActionPlan,
  getZonesHistory,
  getAIInsights,
  generateZoneAIInsight,
  fixHistory,
  enableDoctorCtaTest,
};
