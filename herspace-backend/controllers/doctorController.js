const ZonesTracker = require("../models/ZonesTracker");
const RapidFire = require("../models/RapidFire");

const ZONE_DISPLAY_NAMES = {
  healthy: "Stabilize & Recover",
  mild: "Support Sensitivity",
  moderate: "Build Consistency",
  high: "Maintain & Optimize",
};

function getZoneDisplayName(zone) {
  return ZONE_DISPLAY_NAMES[zone] || zone;
}

function shouldShowDoctorPart(zone) {
  return zone === "moderate" || zone === "high";
}

function buildRapidFirePatterns(latestRapidFire) {
  if (!latestRapidFire) return [];
  const rf =
    typeof latestRapidFire.toObject === "function"
      ? latestRapidFire.toObject()
      : latestRapidFire;
  const symptoms = Array.isArray(rf.detectedSymptoms) ? rf.detectedSymptoms : [];
  const lifestyleAnswers = Array.isArray(rf.lifestyleAnswers) ? rf.lifestyleAnswers : [];
  const has = (key) => symptoms.includes(key);
  const patterns = [];

  if (has("irregularPeriods")) patterns.push({ type: "alert", icon: "📅", title: "Cycle Pattern", text: "Irregular cycles can be a hallmark of PCOD and often point to ovulation imbalance." });
  if (has("hairThinning") && has("facialHair")) patterns.push({ type: "info", icon: "💆‍♀️", title: "Hair Pattern", text: "Scalp thinning combined with facial hair growth is a classic androgen excess pattern common in PCOD." });
  if (has("acne") || has("darkPatches")) patterns.push({ type: "info", icon: "✨", title: "Skin & Hormones", text: "Persistent acne and dark patches are often androgen/insulin-driven and can signal hormonal imbalance." });
  if (has("weightGain") && has("darkPatches")) patterns.push({ type: "info", icon: "⚖️", title: "Weight & Insulin", text: "Weight gain along with dark patches can suggest insulin resistance — a common metabolic driver in PCOD." });
  if (has("moodSwings")) patterns.push({ type: "info", icon: "🧠", title: "Mood Pattern", text: "Mood swings can track with hormonal fluctuations and higher cortisol." });
  if (has("ovulationIssues")) patterns.push({ type: "alert", icon: "🥚", title: "Ovulation Pattern", text: "Difficulty with ovulation can be a strong PCOD signal." });

  const answerIsOften = (a) => { const v = String(a || "").toLowerCase(); return v === "often" || v === "always"; };
  const sleepQ = lifestyleAnswers.find((l) => l.question?.toLowerCase().includes("sleep"));
  if (sleepQ && answerIsOften(sleepQ.answer)) patterns.push({ type: "tip", icon: "😴", title: "Sleep Pattern", text: "Poor sleep can worsen insulin sensitivity and cortisol." });
  const stressQ = lifestyleAnswers.find((l) => l.question?.toLowerCase().includes("stress"));
  if (stressQ && answerIsOften(stressQ.answer)) patterns.push({ type: "tip", icon: "🌸", title: "Stress Pattern", text: "High stress elevates cortisol which can worsen PCOD symptoms." });

  return patterns;
}

// GET /api/doctor/requests — returns ALL users with zone data (no trigger required)
const listDoctorRequests = async (req, res) => {
  try {
    const trackers = await ZonesTracker.find({})
      .sort({ updatedAt: -1 })
      .lean();

    const enriched = await Promise.all(
      trackers.map(async (tracker) => {
        const latestRF = await RapidFire.findOne({ userId: tracker.userId })
          .sort({ createdAt: -1 })
          .select("zone finalScore maxScore confidencePct detectedSymptoms lifestyleAnswers createdAt")
          .lean();

        const zone = tracker?.current?.zone || latestRF?.zone || "mild";

        return {
          userId: String(tracker.userId),
          trackerId: tracker._id,
          doctorRequest: tracker.doctorRequest || { triggered: false },
          current: tracker.current
            ? { ...tracker.current, zoneDisplayName: getZoneDisplayName(tracker.current.zone), showDoctorPart: shouldShowDoctorPart(tracker.current.zone) }
            : null,
          actionPlan: tracker.actionPlan || null,
          latestRapidFire: latestRF
            ? { ...latestRF, zoneDisplayName: getZoneDisplayName(latestRF.zone), showDoctorPart: shouldShowDoctorPart(latestRF.zone) }
            : null,
          patterns: buildRapidFirePatterns(latestRF),
          zoneDisplayName: getZoneDisplayName(zone),
          showDoctorPart: shouldShowDoctorPart(zone),
          history: tracker.history || [],
          miniCheckin: tracker.miniCheckin || null,
          riskEvents: tracker.riskEvents || [],
        };
      })
    );

    return res.status(200).json({ requests: enriched, total: enriched.length });
  } catch (err) {
    console.error("listDoctorRequests error:", err.message);
    return res.status(500).json({ message: "Server error." });
  }
};

// POST /api/doctor/requests/:userId/respond
const respondToDoctorRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const { doctorResponse } = req.body || {};
    if (!doctorResponse || String(doctorResponse).trim().length < 3) {
      return res.status(400).json({ message: "doctorResponse is required." });
    }
    const updated = await ZonesTracker.findOneAndUpdate(
      { userId },
      { $set: { "doctorRequest.status": "responded", "doctorRequest.doctorResponse": String(doctorResponse).trim() } },
      { returnDocument: "after" }
    ).lean();
    if (!updated) return res.status(404).json({ message: "Request not found." });
    return res.status(200).json({ message: "Response saved.", tracker: updated });
  } catch (err) {
    console.error("respondToDoctorRequest error:", err.message);
    return res.status(500).json({ message: "Server error." });
  }
};

// GET /api/doctor/me
const getMyDoctorRequest = async (req, res) => {
  try {
    const tracker = await ZonesTracker.findOne({ userId: req.user.id }).lean();
    if (!tracker?.doctorRequest?.triggered) {
      return res.status(200).json({ hasDoctorRequest: false });
    }
    const latestRF = await RapidFire.findOne({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select("zone finalScore maxScore confidencePct detectedSymptoms lifestyleAnswers createdAt")
      .lean();
    const zone = tracker?.current?.zone || latestRF?.zone;
    return res.status(200).json({
      hasDoctorRequest: true,
      doctorRequest: tracker.doctorRequest,
      current: tracker.current ? { ...tracker.current, zoneDisplayName: getZoneDisplayName(tracker.current.zone), showDoctorPart: shouldShowDoctorPart(tracker.current.zone) } : null,
      actionPlan: tracker.actionPlan || null,
      latestRapidFire: latestRF ? { ...latestRF, zoneDisplayName: getZoneDisplayName(latestRF.zone), showDoctorPart: shouldShowDoctorPart(latestRF.zone) } : null,
      patterns: buildRapidFirePatterns(latestRF),
      zoneDisplayName: getZoneDisplayName(zone),
      showDoctorPart: shouldShowDoctorPart(zone),
    });
  } catch (err) {
    console.error("getMyDoctorRequest error:", err.message);
    return res.status(500).json({ message: "Server error." });
  }
};

function softenCareWording(text = "") {
  return String(text || "")
    .replace(/High-Risk Events/g, "Attention Points")
    .replace(/Risk Events/g, "Attention Points")
    .replace(/high-risk events/g, "attention points")
    .replace(/risk events/g, "attention points")
    .replace(/Risk Score/g, "Wellness Score")
    .replace(/Risk score/g, "Wellness score")
    .replace(/risk score/g, "wellness score")
    .replace(/CLINICAL PATTERNS/g, "OBSERVED PATTERNS")
    .replace(/Clinical Patterns/g, "Observed Patterns")
    .replace(/clinical patterns/g, "observed patterns")
    .replace(/classic androgen excess pattern common in PCOD/gi, "pattern commonly discussed in PCOD care")
    .replace(/classic androgen excess pattern/gi, "pattern commonly discussed in PCOD care")
    .replace(/Hormonal link detected/g, "Possible pattern observed")
    .replace(/hormonal link detected/gi, "possible pattern observed");
}

const generateDoctorAISummary = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId is required in body." });
    }
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "OpenRouter API key is not configured." });
    }

    const tracker = await ZonesTracker.findOne({ userId }).lean();
    if (!tracker) {
      return res.status(404).json({ message: "Patient zones tracker data not found." });
    }

    const latestRF = await RapidFire.findOne({ userId })
      .sort({ createdAt: -1 })
      .select("zone finalScore maxScore confidencePct detectedSymptoms lifestyleAnswers createdAt")
      .lean();

    const zone = tracker?.current?.zone || latestRF?.zone || "mild";
    const score = tracker?.current?.finalScore ?? 0;
    const maxScore = tracker?.current?.maxScore ?? 120;
    const symptoms = (tracker?.current?.detectedSymptoms || []).join(", ") || "none";
    const stability = tracker?.actionPlan?.stabilityScore || "Stable";

    const patternsData = buildRapidFirePatterns(latestRF);
    const patterns = (patternsData || []).map((p) => softenCareWording(p.title)).join(", ") || "none";

    const miniCheckin = tracker?.miniCheckin;
    const miniSummary = miniCheckin
      ? `Energy: ${miniCheckin.energy || "?"}, Symptoms: ${miniCheckin.symptoms || "?"}, Skin: ${miniCheckin.skin || "?"}, Stress: ${miniCheckin.stress || "?"}, Overall: ${miniCheckin.overall || "?"}`
      : "No mini check-in data";
    const historyCount = (tracker?.history || []).length;
    const highRiskEvents = (tracker?.riskEvents || []).filter((e) => e.level === "high").length;

    const prompt = `You are a clinical wellness AI assistant helping a gynecologist prepare for a PCOD patient consultation.

Patient Data:
- Zone: ${zone} (${ZONE_DISPLAY_NAMES[zone] || zone})
- Wellness Score: ${score}/${maxScore}
- Trend Stability: ${stability}
- Detected Symptoms: ${symptoms}
- Observed Patterns: ${patterns}
- Mini Check-in: ${miniSummary}
- Total Assessments: ${historyCount + 1}
- Attention Points: ${highRiskEvents}

Write a concise clinical consultation prep note (3-4 sentences) that:
1. Summarizes the patient's current PCOD wellness picture
2. Highlights the most relevant observed patterns
3. Suggests what the doctor should focus on in the consultation

Be clinical but warm. No diagnosis. Return ONLY a plain paragraph, no JSON, no bullet points.`;

    const DOCTOR_AI_MODELS = [
      "google/gemma-3-12b-it:free",
      "mistralai/mistral-7b-instruct:free",
      "meta-llama/llama-3.1-8b-instruct:free",
      "google/gemma-3-4b-it:free",
      "google/gemma-2-9b-it:free",
      "meta-llama/llama-3.2-3b-instruct:free",
    ];

    let summaryText = null;
    let lastErr = null;

    for (const model of DOCTOR_AI_MODELS) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173",
            "X-Title": "HerSpace Doctor Dashboard",
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 300,
            temperature: 0.6,
          }),
        });

        const data = await response.json();
        if (data?.error) {
          throw new Error(data.error.message || `API error for model ${model}`);
        }

        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text && text.length > 20) {
          summaryText = softenCareWording(text);
          break;
        }
      } catch (err) {
        console.error(`AI model ${model} failed:`, err.message);
        lastErr = err;
      }
    }

    if (summaryText) {
      return res.status(200).json({ success: true, summary: summaryText });
    } else {
      console.error("All AI models failed to generate summary:", lastErr?.message);
      return res.status(502).json({ message: "AI consultation prep is temporarily unavailable." });
    }
  } catch (err) {
    console.error("generateDoctorAISummary error:", err.message);
    return res.status(500).json({ message: "Server error generating AI summary." });
  }
};

module.exports = {
  listDoctorRequests,
  respondToDoctorRequest,
  getMyDoctorRequest,
  generateDoctorAISummary,
};