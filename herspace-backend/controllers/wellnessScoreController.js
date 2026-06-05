// ══════════════════════════════════════════════════════════════════════════════
// wellnessScoreController.js
// Calculates a dynamic wellness score (0–100) for each user from:
//   • PCOD Zone        (ZonesTracker)  → 35% weight
//   • Cycle Health     (PeriodTracker) → 30% weight
//   • Habit Consistency(ZonesTracker mini check-in) → 25% weight
//   • Skin Health      (SkinEntry)     → 10% weight
// ══════════════════════════════════════════════════════════════════════════════

const WellnessScore = require("../models/WellnessScore");
const ZonesTracker  = require("../models/ZonesTracker");
const RapidFire     = require("../models/RapidFire");

// ── Try to load optional models (may not exist in every project) ──────────────
let PeriodTracker, SkinEntry;
try { PeriodTracker = require("../models/PeriodTracker"); } catch(e) { PeriodTracker = null; }
try { SkinEntry     = require("../models/SkinEntry");     } catch(e) { SkinEntry     = null; }

const DASHBOARD_AI_MODELS = [
  "google/gemma-3-4b-it:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "deepseek/deepseek-r1-distill-llama-8b:free",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function tryDashboardAIModel(model, prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OpenRouter API key is not configured");
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173",
      "X-Title": "HerSpace Wellness",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 700,
      temperature: 0.7,
    }),
  });

  let data = null;
  try { data = await res.json(); } catch { data = null; }

  if (!res.ok || data?.error) {
    const err = new Error(data?.error?.message || `AI request failed (HTTP ${res.status || "?"})`);
    err.is429 = data?.error?.code === 429 || res.status === 429;
    throw err;
  }

  return data?.choices?.[0]?.message?.content || "{}";
}

function parseDashboardPlan(text) {
  const clean = String(text || "").replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);
  if (
    typeof parsed?.greeting !== "string" ||
    !Array.isArray(parsed?.diet) ||
    !Array.isArray(parsed?.movement) ||
    !Array.isArray(parsed?.selfCare) ||
    typeof parsed?.skinTip !== "string" ||
    typeof parsed?.insight !== "string"
  ) {
    throw new Error("AI response had an unexpected format");
  }

  return {
    greeting: parsed.greeting,
    diet: parsed.diet.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 3),
    movement: parsed.movement.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 2),
    selfCare: parsed.selfCare.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 2),
    skinTip: parsed.skinTip,
    insight: parsed.insight,
  };
}

async function runDashboardAI(prompt) {
  let lastErr;

  for (const model of DASHBOARD_AI_MODELS) {
    try {
      const text = await tryDashboardAIModel(model, prompt);
      return parseDashboardPlan(text);
    } catch (err) {
      lastErr = err;
      if (err?.is429) break;
      await sleep(450);
    }
  }

  throw lastErr || new Error("AI unavailable");
}

// ══════════════════════════════════════════════════════════════════════════════
// SCORING HELPERS
// ══════════════════════════════════════════════════════════════════════════════

// ── 1. Zone Score (35%) ───────────────────────────────────────────────────────
// Based on PCOD zone + stability trend
function calcZoneScore(zone, stability) {
  let base = 0;
  switch (zone) {
    case "healthy":  base = 90; break;
    case "mild":     base = 65; break;
    case "moderate": base = 40; break;
    case "high":     base = 20; break;
    default:         base = 50;
  }

  // Stability modifier: ±15 points
  if (stability === "Improving") base = Math.min(100, base + 15);
  else if (stability === "Worsening") base = Math.max(0, base - 15);
  // "Stable" → no change

  return Math.round(base);
}

// ── 2. Cycle Score (30%) ─────────────────────────────────────────────────────
// Based on cycle regularity, flow consistency, typical cycle length
function calcCycleScore(periodData) {
  if (!periodData) return 50; // neutral if no data

  let score = 50;

  // Regularity (most impactful)
  const reg = (periodData.regularity || "").toLowerCase();
  if      (reg.includes("very regular"))  score += 30;
  else if (reg.includes("mostly"))        score += 18;
  else if (reg.includes("somewhat"))      score += 5;
  else if (reg.includes("irregular"))     score -= 10;
  else if (reg.includes("very irregular"))score -= 20;

  // Cycle length — 25–35 days is healthy range
  const len = periodData.averageCycleLength || 28;
  if (len >= 25 && len <= 35) score += 12;
  else if (len >= 21 && len < 25) score += 5;
  else if (len > 35 && len <= 40) score += 2;
  else score -= 8; // very short or very long

  // Flow consistency
  const flow = (periodData.flow || "").toLowerCase();
  if (flow.includes("normal") || flow.includes("moderate")) score += 8;
  else if (flow.includes("heavy") || flow.includes("light")) score += 2;

  // Period duration — 3–7 days is normal
  const dur = periodData.averagePeriodLength || 5;
  if (dur >= 3 && dur <= 7) score += 10;
  else score -= 5;

  return Math.min(100, Math.max(0, Math.round(score)));
}

// ── 3. Consistency Score (25%) ────────────────────────────────────────────────
// Based on mini check-in answers + recency of check-ins
function calcConsistencyScore(miniCheckin, daysSinceMini, daysSinceFull, assessmentCount) {
  let score = 40; // default: user exists but hasn't checked in

  // Bonus for doing multiple assessments at all
  if (assessmentCount >= 3) score += 15;
  else if (assessmentCount >= 2) score += 8;
  else if (assessmentCount >= 1) score += 4;

  // Mini check-in recency
  if (daysSinceMini !== null) {
    if (daysSinceMini <= 3) score += 20;       // checked in recently
    else if (daysSinceMini <= 6) score += 12;  // on schedule
    else if (daysSinceMini <= 10) score += 4;  // slightly late
    else score -= 8;                           // overdue
  } else if (daysSinceFull !== null && daysSinceFull <= 7) {
    score += 10; // new user, just did full check
  }

  // Full assessment recency
  if (daysSinceFull !== null) {
    if (daysSinceFull <= 7) score += 10;
    else if (daysSinceFull <= 14) score += 5;
    else score -= 5; // overdue for full re-check
  }

  // Mini check-in answer quality
  if (miniCheckin) {
    const positiveAnswers = [
      miniCheckin.energy   === "Improved",
      miniCheckin.symptoms === "Reduced",
      miniCheckin.skin     === "Better",
      miniCheckin.stress   === "Lower",
      miniCheckin.overall  === "Better",
    ].filter(Boolean).length;

    const negativeAnswers = [
      miniCheckin.energy   === "Worse",
      miniCheckin.symptoms === "Increased",
      miniCheckin.skin     === "Worse",
      miniCheckin.stress   === "Higher",
      miniCheckin.overall  === "Worse",
    ].filter(Boolean).length;

    score += positiveAnswers * 4;   // up to +20
    score -= negativeAnswers * 4;   // up to -20
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

// ── 4. Skin Score (10%) ───────────────────────────────────────────────────────
// Based on latest skin condition + number of scans (engagement)
function calcSkinScore(latestCondition, totalScans) {
  let score = 50; // neutral if no data

  if (!latestCondition && totalScans === 0) return 50;

  // Condition score
  const cond = (latestCondition || "").toLowerCase();
  if      (cond.includes("clear") || cond.includes("healthy") || cond.includes("glowing")) score += 35;
  else if (cond.includes("mild"))                                                            score += 20;
  else if (cond.includes("moderate"))                                                        score += 5;
  else if (cond.includes("severe") || cond.includes("inflamed"))                            score -= 15;

  // Engagement bonus — more scans = better tracking
  if (totalScans >= 5)      score += 15;
  else if (totalScans >= 3) score += 10;
  else if (totalScans >= 1) score += 5;

  return Math.min(100, Math.max(0, Math.round(score)));
}

// ── Composite score (weighted) ────────────────────────────────────────────────
function calcCompositeScore(zoneScore, cycleScore, consistencyScore, skinScore) {
  return Math.min(100, Math.max(0, Math.round(
    (zoneScore        * 0.35) +
    (cycleScore       * 0.30) +
    (consistencyScore * 0.25) +
    (skinScore        * 0.10)
  )));
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN CALCULATION FUNCTION
// Called by controller routes AND can be called internally after RapidFire/mini
// ══════════════════════════════════════════════════════════════════════════════
async function calculateAndSaveWellnessScore(userId) {
  // ── Fetch all data sources in parallel ─────────────────────────────────────
  const [zonesTracker, rapidFireLatest, periodData, skinData] = await Promise.allSettled([
    ZonesTracker.findOne({ userId }),
    RapidFire.findOne({ userId }).sort({ createdAt: -1 }),
    PeriodTracker ? PeriodTracker.findOne({ userId }) : Promise.resolve(null),
    SkinEntry     ? SkinEntry.find({ userId }).sort({ createdAt: -1 }).limit(10) : Promise.resolve([]),
  ]);

  const tracker    = zonesTracker.status  === "fulfilled" ? zonesTracker.value  : null;
  const latestRF   = rapidFireLatest.status === "fulfilled" ? rapidFireLatest.value : null;
  const period     = periodData.status    === "fulfilled" ? periodData.value    : null;
  const skinScans  = skinData.status      === "fulfilled" ? skinData.value      : [];

  // ── Extract inputs ──────────────────────────────────────────────────────────
  const zone       = tracker?.current?.zone || latestRF?.zone || "mild";
  const stability  = tracker?.actionPlan?.stabilityScore || "Stable";
  const miniCheckin = tracker?.miniCheckin || null;

  // Day calculations (same logic as zonesController)
  const now = Date.now();
  const lastAssessmentDate = new Date(
    tracker?.current?.savedAt || tracker?.createdAt || now
  ).getTime();
  const daysSinceFull = Math.floor((now - lastAssessmentDate) / (1000 * 60 * 60 * 24));

  const lastMiniDate  = tracker?.miniCheckin?.submittedAt
    ? new Date(tracker.miniCheckin.submittedAt).getTime() : null;
  const daysSinceMini = lastMiniDate
    ? Math.floor((now - lastMiniDate) / (1000 * 60 * 60 * 24)) : null;

  const assessmentCount = (tracker?.history?.length || 0) + (tracker?.current ? 1 : 0);

  // Period data extraction (flexible — works with different schema shapes)
  const periodInputs = period ? {
    regularity:          period.regularity          || period.cycleRegularity || "",
    averageCycleLength:  period.averageCycleLength  || period.cycleLength     || 28,
    averagePeriodLength: period.averagePeriodLength || period.periodLength    || 5,
    flow:                period.flow                || period.typicalFlow     || "",
  } : null;

  // Skin data
  const latestSkin    = skinScans[0] || null;
  const skinCondition = latestSkin?.condition || latestSkin?.skinCondition || "";
  const totalScans    = skinScans.length;

  // ── Calculate component scores ──────────────────────────────────────────────
  const zoneScore        = calcZoneScore(zone, stability);
  const cycleScore       = calcCycleScore(periodInputs);
  const consistencyScore = calcConsistencyScore(miniCheckin, daysSinceMini, daysSinceFull, assessmentCount);
  const skinScore        = calcSkinScore(skinCondition, totalScans);
  const compositeScore   = calcCompositeScore(zoneScore, cycleScore, consistencyScore, skinScore);

  // ── Save / update in DB ─────────────────────────────────────────────────────
  const existing = await WellnessScore.findOne({ userId });

  const newEntry = {
    score: compositeScore,
    components: { zoneScore, cycleScore, consistencyScore, skinScore },
    inputs: {
      zone,
      stabilityTrend:   stability,
      cycleRegularity:  periodInputs?.regularity || "unknown",
      cycleLength:      periodInputs?.averageCycleLength || null,
      miniCheckinScore: miniCheckin ? consistencyScore : null,
      daysSinceMini,
      skinCondition:    skinCondition || "not analyzed",
      totalScans,
    },
    lastCalculatedAt: new Date(),
  };

  // Push old score to history if it's different (avoid duplicate history entries)
  if (existing && existing.score !== compositeScore) {
    await WellnessScore.findOneAndUpdate(
      { userId },
      {
        $push: {
          history: {
            $each: [{
              score:      existing.score,
              components: existing.components,
              recordedAt: existing.lastCalculatedAt || existing.updatedAt,
            }],
            $position: 0,
            $slice: 30, // keep last 30 history entries
          },
        },
      }
    );
  }

  const saved = await WellnessScore.findOneAndUpdate(
    { userId },
    { $set: newEntry },
    { upsert: true, returnDocument: "after" }
  );

  return {
    score:      compositeScore,
    components: { zoneScore, cycleScore, consistencyScore, skinScore },
    inputs:     newEntry.inputs,
    history:    saved.history?.slice(0, 10) || [],
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// ROUTE HANDLERS
// ══════════════════════════════════════════════════════════════════════════════

// POST /api/wellness/ai-dashboard-insight
const generateDashboardAIInsight = async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ message: "Dashboard AI service is not configured." });
    }

    const {
      zone = "mild",
      phase = "Luteal",
      skinCondition = "not analyzed",
      stability = "Stable",
      trackerData = {},
      wellnessData = null,
      period = null,
      zones = null,
      skin = null,
    } = req.body || {};

    const score = wellnessData?.score ?? "unknown";
    const components = wellnessData?.components || {};
    const scoreInputs = wellnessData?.inputs || {};
    const zoneSummary = zones?.tracker?.current || {};
    const latestSkin = skin?.entries?.[0] || null;
    const periodTracker = period?.trackerData || trackerData || {};

    const prompt = `You are a warm women's wellness AI for a PCOD wellness app.
User profile:
- PCOD Zone: ${zone}
- Cycle Phase: ${phase}
- Skin Condition: ${skinCondition || latestSkin?.condition || "not analyzed"}
- Stability: ${stability || "Stable"}
- Regularity: ${periodTracker?.regularity || "unknown"}
- Flow: ${periodTracker?.flow || "unknown"}
- Wellness Score: ${score}/100
- Component Scores: zone=${components.zoneScore ?? "unknown"}, cycle=${components.cycleScore ?? "unknown"}, habit=${components.consistencyScore ?? "unknown"}, skin=${components.skinScore ?? "unknown"}
- Score Inputs: cycleRegularity=${scoreInputs.cycleRegularity || "unknown"}, skinCondition=${scoreInputs.skinCondition || "unknown"}
- Zone Risk Score: ${zoneSummary.finalScore ?? "unknown"}
- Detected Symptoms: ${(zoneSummary.detectedSymptoms || []).join(", ") || "none"}

Generate a unified today's wellness plan. Return ONLY valid JSON (no markdown):
{
  "greeting": "1 warm personalized sentence about their current state",
  "diet": ["tip1","tip2","tip3"],
  "movement": ["tip1","tip2"],
  "selfCare": ["tip1","tip2"],
  "skinTip": "1 skin tip based on their condition + cycle phase",
  "insight": "1 short motivational insight about their health journey"
}`;

    const plan = await runDashboardAI(prompt);
    return res.status(200).json(plan);
  } catch (err) {
    console.error("generateDashboardAIInsight error:", err.message);
    return res.status(502).json({ message: "AI dashboard insight is temporarily unavailable." });
  }
};

// GET /api/wellness/score
// Returns current score (recalculates live every time — always fresh)
const getWellnessScore = async (req, res) => {
  try {
    const result = await calculateAndSaveWellnessScore(req.user.id);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("getWellnessScore error:", err.message);
    res.status(500).json({ message: "Server error calculating wellness score." });
  }
};

// POST /api/wellness/score/refresh
// Force recalculate (call this after rapidfire, mini check-in, or skin scan)
const refreshWellnessScore = async (req, res) => {
  try {
    const result = await calculateAndSaveWellnessScore(req.user.id);
    res.status(200).json({
      success: true,
      message: "Wellness score refreshed.",
      ...result,
    });
  } catch (err) {
    console.error("refreshWellnessScore error:", err.message);
    res.status(500).json({ message: "Server error refreshing wellness score." });
  }
};

// GET /api/wellness/score/history
// Returns score history for charts/trends
const getScoreHistory = async (req, res) => {
  try {
    const doc = await WellnessScore.findOne({ userId: req.user.id }).select("score components history lastCalculatedAt");
    if (!doc) {
      return res.status(200).json({ hasHistory: false, history: [] });
    }
    res.status(200).json({
      hasHistory: true,
      current:    { score: doc.score, components: doc.components, lastCalculatedAt: doc.lastCalculatedAt },
      history:    doc.history || [],
    });
  } catch (err) {
    console.error("getScoreHistory error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = {
  getWellnessScore,
  refreshWellnessScore,
  getScoreHistory,
  generateDashboardAIInsight,
  calculateAndSaveWellnessScore, // exported so other controllers can call it
};
