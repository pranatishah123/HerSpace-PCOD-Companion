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
  calculateAndSaveWellnessScore, // exported so other controllers can call it
};