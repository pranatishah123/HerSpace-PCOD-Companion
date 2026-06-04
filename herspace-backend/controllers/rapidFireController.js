const RapidFire = require("../models/RapidFire");

const WEIGHTS = {
  irregularPeriods: 4,
  facialHair:       4,
  acne:             3,
  weightGain:       3,
  hairThinning:     3,
  darkPatches:      4,
  moodSwings:       2,
  ovulationIssues:  4,
};

const MAX_SEVERITY = 4;

const MAX_BASE_SCORE =
  Object.values(WEIGHTS).reduce((sum, w) => sum + w, 0) * MAX_SEVERITY;

const MAX_FINAL_SCORE = 120;

const ZONE_DISPLAY_NAMES = {
  healthy:  "stabilize and recover",
  mild:     "support sensitivity",
  moderate: "build consistency",
  high:     "maintain and optimize",
};

function getZoneDisplayName(zone) {
  return ZONE_DISPLAY_NAMES[zone] || zone;
}

function shouldShowDoctorPart(zone) {
  return zone === "moderate" || zone === "high";
}

function getLifestyleScore(lifestyleAnswers) {
  const map = { never: 0, sometimes: 1, often: 2, always: 3 };
  let total = 0;
  lifestyleAnswers.forEach(({ answer }) => {
    total += map[answer?.toLowerCase()] ?? 0;
  });
  return total;
}

function getCombinationBonus(answers) {
  let bonus = 0;
  if (answers.irregularPeriods > 0 && answers.facialHair > 0)  bonus += 3;
  if (answers.irregularPeriods > 0 && answers.acne > 0)        bonus += 2;
  if (answers.weightGain > 0       && answers.darkPatches > 0) bonus += 3;
  if (answers.hairThinning > 0     && answers.acne > 0)        bonus += 1;
  return bonus;
}

function getAgeMultiplier(ageGroup) {
  if (ageGroup === "teen")     return 0.9;
  if (ageGroup === "hormonal") return 1.1;
  return 1.0;
}

function getZone(score) {
  if (score <= 30) return "healthy";
  if (score <= 55) return "mild";
  if (score <= 85) return "moderate";
  return "high";
}

function getRecommendations(zone, detectedSymptoms, lifestyleAnswers) {
  const base = {
    healthy: [
      "Maintain your current healthy lifestyle 🌿",
      "Track your menstrual cycle regularly 📅",
      "Stay consistent with sleep and exercise",
    ],
    mild: [
      "Reduce refined sugar and processed foods 🥗",
      "Exercise at least 30 minutes daily 🏃‍♀️",
      "Track your cycle and symptoms monthly",
    ],
    moderate: [
      "Consult a gynecologist for hormonal evaluation 🩺",
      "Follow an anti-inflammatory diet",
      "Manage stress with yoga or meditation 🧘‍♀️",
      "Get hormone panel blood test done",
      "Maintain consistent sleep schedule",
    ],
    high: [
      "Please consult a gynecologist soon 🩺",
      "Request a pelvic ultrasound and hormone tests",
      "Follow a structured PCOD management plan",
      "Avoid high-sugar and high-carb foods",
      "Daily 30-min moderate exercise is essential",
      "Track all symptoms for your doctor visit",
    ],
  };

  const recs = [...base[zone]];

  const sleepQ = lifestyleAnswers.find(l =>
    l.question?.toLowerCase().includes("sleep")
  );
  if (sleepQ?.answer?.toLowerCase() === "often" ||
      sleepQ?.answer?.toLowerCase() === "always") {
    recs.push("Prioritize 7–8 hrs sleep — poor sleep worsens hormones 😴");
  }

  const stressQ = lifestyleAnswers.find(l =>
    l.question?.toLowerCase().includes("stress")
  );
  if (stressQ?.answer?.toLowerCase() === "often" ||
      stressQ?.answer?.toLowerCase() === "always") {
    recs.push("High stress raises cortisol — try daily meditation 🌸");
  }

  return recs;
}

// ── POST /api/rapidfire ───────────────────────────────────────────────────────
const saveRapidFire = async (req, res) => {
  try {
    const { ageGroup, symptomAnswers, lifestyleAnswers } = req.body;

    if (!ageGroup || !symptomAnswers || !lifestyleAnswers) {
      return res.status(400).json({ message: "Incomplete data submitted." });
    }

    const severityMap = {};
    symptomAnswers.forEach(({ symptom, present, severity }) => {
      severityMap[symptom] = present ? (severity || 0) : 0;
    });

    let baseScore = 0;
    const detectedSymptoms = [];
    for (const [symptom, weight] of Object.entries(WEIGHTS)) {
      const sev = severityMap[symptom] || 0;
      baseScore += sev * weight;
      if (sev > 0) detectedSymptoms.push(symptom);
    }

    const combinationBonus = getCombinationBonus(severityMap);
    const lifestyleScore   = getLifestyleScore(lifestyleAnswers);
    const ageMultiplier    = getAgeMultiplier(ageGroup);
    const rawScore         = (baseScore + combinationBonus + lifestyleScore) * ageMultiplier;
    const finalScore       = Math.round(rawScore);
    const confidencePct    = Math.min(100, Math.round((finalScore / MAX_FINAL_SCORE) * 100));
    const zone             = getZone(finalScore);
    const recommendations  = getRecommendations(zone, detectedSymptoms, lifestyleAnswers);

    const result = await RapidFire.create({
      userId: req.user.id,
      ageGroup,
      symptomAnswers,
      lifestyleAnswers,
      baseScore,
      combinationBonus,
      ageMultiplier,
      finalScore,
      confidencePct,
      detectedSymptoms,
      zone,
      recommendations,
    });

    const last3 = await RapidFire
      .find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("zone");

    const persistentRisk =
      last3.length === 3 && last3.every(r => r.zone === zone);

    res.status(200).json({
      message: "Assessment saved!",
      score: finalScore,
      maxScore: MAX_FINAL_SCORE,
      confidencePct,
      zone,
      zoneDisplayName: getZoneDisplayName(zone),
      showDoctorPart: shouldShowDoctorPart(zone),
      detectedSymptoms,
      recommendations,
      persistentRisk,
      result,
    });

  } catch (error) {
    console.error("RapidFire error:", error.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// ── GET latest result ─────────────────────────────────────────────────────────
const getRapidFire = async (req, res) => {
  try {
    const latest = await RapidFire
      .findOne({ userId: req.user.id })
      .sort({ createdAt: -1 });

    if (!latest) return res.status(404).json({ hasResult: false });

    const last3 = await RapidFire
      .find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("zone");

    const persistentRisk =
      last3.length === 3 && last3.every(r => r.zone === latest.zone);

    const resultWithZoneMeta = latest.toObject();
    resultWithZoneMeta.zoneDisplayName = getZoneDisplayName(resultWithZoneMeta.zone);
    resultWithZoneMeta.showDoctorPart = shouldShowDoctorPart(resultWithZoneMeta.zone);

    res.status(200).json({ hasResult: true, result: resultWithZoneMeta, persistentRisk });

  } catch (error) {
    console.error("GetRapidFire error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

// ── GET history ───────────────────────────────────────────────────────────────
const getRapidFireHistory = async (req, res) => {
  try {
    const history = await RapidFire
      .find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select("zone finalScore confidencePct detectedSymptoms createdAt");

    const historyWithZoneMeta = history.map((entry) => ({
      ...entry.toObject(),
      zoneDisplayName: getZoneDisplayName(entry.zone),
      showDoctorPart: shouldShowDoctorPart(entry.zone),
    }));

    res.status(200).json({ history: historyWithZoneMeta });

  } catch (error) {
    console.error("GetHistory error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = { saveRapidFire, getRapidFire, getRapidFireHistory };