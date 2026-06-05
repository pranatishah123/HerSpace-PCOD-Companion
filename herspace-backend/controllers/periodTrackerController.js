const PeriodTracker = require("../models/PeriodTracker");
const fetch = (...args) =>
  typeof globalThis.fetch === "function"
    ? globalThis.fetch(...args)
    : import("node-fetch").then(({ default: nodeFetch }) => nodeFetch(...args));

// ── Helper: cycle length string → number ─────────────────────────────────────
function parseCycleDays(cycleLength) {
  if (cycleLength === "Less than 21 days") return 20;
  if (cycleLength === "21–28 days")        return 28;
  if (cycleLength === "29–35 days")        return 32;
  if (cycleLength === "35+ days / Unsure") return 38;
  return 28;
}

// ── Helper: parse last-period input as a safe date-only value ────────────────
function parseDateOnly(value) {
  if (!value) return null;

  // Prefer YYYY-MM-DD parsing to avoid timezone drift
  if (typeof value === "string") {
    const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const year  = Number(m[1]);
      const month = Number(m[2]) - 1;
      const day   = Number(m[3]);
      const d = new Date(year, month, day);

      const isSameDate =
        d.getFullYear() === year &&
        d.getMonth() === month &&
        d.getDate() === day;

      if (!isSameDate) return null;
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }

  // Fallback for ISO datetime payloads
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── Helper: compute current cycle phase ──────────────────────────────────────
function computePhase(lastPeriod, cycleLengthDays) {
  const start = parseDateOnly(lastPeriod) || (() => {
    const d = new Date(lastPeriod);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  if (!start) {
    return {
      phase: "Follicular",
      cycleDay: 1,
      cycleLengthDays: cycleLengthDays || 28,
      daysUntilNextPeriod: cycleLengthDays || 28,
      nextPeriodDate: new Date(),
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = today - start;
  const dayOfCycle = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
  const cycleDay = ((dayOfCycle - 1) % cycleLengthDays) + 1;

  let phase;
  if (cycleDay <= 5) phase = "Menstrual";
  else if (cycleDay <= 13) phase = "Follicular";
  else if (cycleDay <= 16) phase = "Ovulation";
  else phase = "Luteal";

  const daysUntilNextPeriod = Math.max(0, cycleLengthDays - cycleDay + 1);
  const nextPeriodDate = new Date(today);
  nextPeriodDate.setDate(nextPeriodDate.getDate() + daysUntilNextPeriod);

  return { phase, cycleDay, cycleLengthDays, daysUntilNextPeriod, nextPeriodDate };
}

// ── Helper: PCOD-aware insights ───────────────────────────────────────────────
function generateInsights(current) {
  const insights = [];
  let shouldSeeDoctor = false;
  const cycleDays = current.cycleLengthDays;

  if (cycleDays >= 35) {
    insights.push({
      type: "warning", icon: "⚠️",
      title: "Long Cycle Detected",
      text: `Your cycle length (35+ days) may indicate delayed or absent ovulation — one of the most common PCOD signs.`,
    });
  }
  if (cycleDays < 21) {
    insights.push({
      type: "warning", icon: "⚠️",
      title: "Short Cycle Detected",
      text: "Cycles shorter than 21 days may signal a short luteal phase or hormonal imbalance.",
    });
  }
  if (current.regularity === "Sometimes irregular" || current.regularity === "Very unpredictable") {
    insights.push({
      type: "warning", icon: "🌀",
      title: "Irregular Cycle Pattern",
      text: "Irregular cycles are the #1 indicator of PCOD. Combined with other symptoms this is worth professional evaluation.",
    });
  }
  if (current.spotting === "Sometimes" || current.spotting === "Often / Always") {
    insights.push({
      type: "alert", icon: "🩸",
      title: "Mid-Cycle Spotting",
      text: "Spotting between periods can indicate anovulation — a hallmark of PCOD.",
    });
  }
  if (current.ovulation === "I may not ovulate") {
    insights.push({
      type: "alert", icon: "🥚",
      title: "Possible Anovulation",
      text: "Suspected absent ovulation is a strong PCOD signal. We recommend using an OPK kit to confirm.",
    });
    shouldSeeDoctor = true;
  }
  if (current.skin && current.skin.toLowerCase().includes("severe")) {
    insights.push({
      type: "info", icon: "✨",
      title: "Skin & Hormones",
      text: "Persistent acne (especially jaw/chin) and dark patches are androgen-driven — a direct hormonal imbalance signal.",
    });
  }
  if (current.hair && (current.hair.toLowerCase().includes("thinning") || current.hair.toLowerCase().includes("facial"))) {
    insights.push({
      type: "info", icon: "💆‍♀️",
      title: "Hair Pattern",
      text: "Scalp thinning combined with facial hair growth is a classic androgen excess pattern common in PCOD.",
    });
  }
  if (current.weight && current.weight.toLowerCase().includes("belly")) {
    insights.push({
      type: "info", icon: "⚖️",
      title: "Weight & Insulin",
      text: "Belly fat gain despite diet/exercise often signals insulin resistance — the metabolic root of PCOD.",
    });
  }

  if (
    (current.regularity === "Very unpredictable" && cycleDays >= 35) ||
    (current.spotting === "Often / Always" && current.regularity !== "Very regular")
  ) {
    shouldSeeDoctor = true;
  }

  return { insights, shouldSeeDoctor };
}

// ── Helper: phase-based tips ──────────────────────────────────────────────────
function getPhaseTips(phase, flow, pain) {
  const tips = {
    Menstrual: {
      emoji: "🩸", label: "Menstrual Phase",
      feeling: ["Cramping or heaviness", "Low energy & fatigue", "Emotional sensitivity", "Lower back ache"],
      nutrition: ["Iron-rich foods — spinach, lentils, beetroot 🥬", "Warm soups & herbal teas 🍵", "Dark chocolate for magnesium 🍫", "Avoid caffeine & cold foods ❌"],
      movement: ["Gentle yoga or stretching 🧘‍♀️", "Light walks only 🚶‍♀️", "Rest is productive — honour it 💤"],
      selfCare: ["Hot water bottle for cramps 🌡️", "Journal your symptoms 📓", "Extra sleep if needed 😴"],
      affirmation: "Your body is doing powerful work right now. Rest without guilt. 🌸",
    },
    Follicular: {
      emoji: "🌱", label: "Follicular Phase",
      feeling: ["Rising energy levels", "Clearer thinking & focus", "More social & outgoing", "Skin may look clearer"],
      nutrition: ["Fermented foods — yoghurt, idli 🥣", "Fresh fruits & veggies 🥗", "Lean protein 🥚", "Lots of water 💧"],
      movement: ["Great time for cardio & strength 💪", "Try new workouts — energy is high 🏋️‍♀️", "Dance, swim, run 🏃‍♀️"],
      selfCare: ["Plan your week — focus is sharp 📅", "Social activities feel great now 🌸", "Skincare routine ✨"],
      affirmation: "You're rebuilding and rising. This is your power phase. ✨",
    },
    Ovulation: {
      emoji: "🥚", label: "Ovulation Phase",
      feeling: ["Peak energy & confidence", "Heightened social drive", "Mild one-sided pelvic pain possible", "Increased natural libido"],
      nutrition: ["Antioxidant-rich foods 🫐", "Zinc — pumpkin seeds, chickpeas 🌱", "Fibre for estrogen balance 🥦", "Limit processed sugar ❌"],
      movement: ["Peak performance window 🏆", "HIIT, heavy lifting, intense cardio 💥", "Your body handles stress best now 💪"],
      selfCare: ["Track ovulation signs 📊", "Important conversations go well now 💬", "Creative projects — ideas flow 🎨"],
      affirmation: "You are at your most vibrant. Lead with that energy. 🌟",
    },
    Luteal: {
      emoji: "🌙", label: "Luteal Phase",
      feeling: ["Gradual energy decline", "Mood swings & irritability", "Bloating & breast tenderness", "Cravings — sugar & carbs"],
      nutrition: ["Magnesium — dark greens, almonds 🥬", "Complex carbs — oats, sweet potato 🍠", "Limit salt to reduce bloating 🧂", "Chamomile or spearmint tea 🍵"],
      movement: ["Lower intensity — yoga, pilates 🧘‍♀️", "Listen to your body 💛", "Swimming is gentle and effective 🏊‍♀️"],
      selfCare: ["Prioritise sleep — 8+ hours 💤", "Reduce screen time evenings 📵", "Say no to draining plans 🙅‍♀️", "Warm bath with epsom salts 🛁"],
      affirmation: "This phase asks you to slow down and be gentle with yourself. 🌙",
    },
  };

  const t = tips[phase] || tips.Luteal;
  if (flow === "Heavy / Very heavy" && phase === "Menstrual") {
    t.nutrition = ["Extra iron today — heavy flow depletes iron fast 🩸", ...t.nutrition];
  }
  if (pain === "Severe pain" && phase === "Menstrual") {
    t.selfCare = ["Anti-inflammatory foods — turmeric, ginger ⚡", ...t.selfCare];
    t.movement = ["Complete rest today 💤", "Gentle breathing only 🫁"];
  }
  return t;
}

// ── Helper: generate comparison insight ──────────────────────────────────────
function generateComparison(current, history) {
  if (!history || history.length === 0) return null;

  const prev = history[history.length - 1];
  const improvements = [];
  const regressions  = [];

  const regularityScore = {
    "Very regular": 4, "Mostly regular": 3,
    "Sometimes irregular": 2, "Very unpredictable": 1,
  };
  const prevReg = regularityScore[prev.regularity]  || 2;
  const currReg = regularityScore[current.regularity] || 2;

  if (currReg > prevReg) improvements.push("Your cycle is becoming more regular 🌸");
  if (currReg < prevReg) regressions.push("Your cycle regularity has decreased 🌀");

  const prevDays = prev.cycleLengthDays || 28;
  const currDays = current.cycleLengthDays || 28;
  const daysDiff = Math.abs(currDays - prevDays);

  if (daysDiff >= 4) {
    if (currDays < prevDays && currDays <= 35) {
      improvements.push(`Cycle shortened from ${prevDays} to ${currDays} days — moving toward normal range ✅`);
    } else if (currDays > prevDays) {
      regressions.push(`Cycle lengthened from ${prevDays} to ${currDays} days 📊`);
    }
  }

  const spottingScore = { "Never": 4, "Rarely": 3, "Sometimes": 2, "Often / Always": 1 };
  const prevSpot = spottingScore[prev.spotting]  || 2;
  const currSpot = spottingScore[current.spotting] || 2;
  if (currSpot > prevSpot) improvements.push("Less spotting between periods — great sign! 💛");
  if (currSpot < prevSpot) regressions.push("More spotting observed this cycle 🩸");

  const painScore = { "No pain": 4, "Mild discomfort": 3, "Moderate pain": 2, "Severe pain": 1 };
  const prevPain = painScore[prev.pain]  || 2;
  const currPain = painScore[current.pain] || 2;
  if (currPain > prevPain) improvements.push("Period pain has reduced 😊");
  if (currPain < prevPain) regressions.push("Period pain has increased this cycle 😣");

  let overallMessage = "";
  if (improvements.length > regressions.length) {
    overallMessage = "Overall your cycle health is improving! Keep going 🌸";
  } else if (regressions.length > improvements.length) {
    overallMessage = "Some changes noticed — pay extra attention to your body this month 💛";
  } else if (improvements.length === 0 && regressions.length === 0) {
    overallMessage = "Your cycle patterns are consistent with last month 📊";
  } else {
    overallMessage = "Mixed changes detected — your body is adjusting 🌀";
  }

  return {
    previousCycle: {
      regularity:  prev.regularity,
      cycleLength: prev.cycleLength,
      flow:        prev.flow,
      spotting:    prev.spotting,
      pain:        prev.pain,
      savedAt:     prev.savedAt,
    },
    currentCycle: {
      regularity:  current.regularity,
      cycleLength: current.cycleLength,
      flow:        current.flow,
      spotting:    current.spotting,
      pain:        current.pain,
    },
    improvements,
    regressions,
    overallMessage,
    hasImprovement: improvements.length > regressions.length,
  };
}

// ── Helper: consistency score from action rating ──────────────────────────────
function calcConsistencyScore(actionRating) {
  const scores = {
    "Done":    100,
    "Partial": 60,
    "Skipped": 20,
    "":        0,
  };
  return scores[actionRating] ?? 0;
}

// ── Helper: call OpenRouter AI with model fallback ────────────────────────────
const AI_MODELS = [
  "deepseek/deepseek-r1-distill-llama-70b:free",
  "deepseek/deepseek-chat-v3-0324:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "qwen/qwen-2.5-7b-instruct:free",
  "google/gemma-3-4b-it:free",
  "google/gemma-2-9b-it:free",
  "meta-llama/llama-3.2-3b-instruct:free",
];

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const aiDebug = (...args) => {
  if (process.env.DEBUG_AI === "true") console.log(...args);
};
const aiDebugWarn = (...args) => {
  if (process.env.DEBUG_AI === "true") console.warn(...args);
};

async function tryModel(model, prompt, apiKey) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173",
      "X-Title": "HerSpace Period Tracker",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 900,
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

async function generateActionPlanAI({ current, weeklyAnswers, actionRating, phase, ageGroup, apiKey }) {
  const prompt = `You are a compassionate PCOD health advisor for a women's wellness app.

A woman has completed her weekly check-in. Generate a personalised weekly action plan.

HER BASELINE DATA (from last full assessment):
- Age Group: ${ageGroup}
- Current Cycle Phase: ${phase}
- Cycle Regularity: ${current.regularity}
- Cycle Length: ${current.cycleLength}
- Flow: ${current.flow}
- Spotting: ${current.spotting}
- Skin: ${current.skin}
- Hair: ${current.hair}
- Weight: ${current.weight}
- Sleep: ${current.sleep}
- Ovulation: ${current.ovulation}
- Pain: ${current.pain}

THIS WEEK'S CHECK-IN:
- Cycle regularity this week: ${weeklyAnswers.regularity}
- Acne / skin changes: ${weeklyAnswers.acne}
- Energy levels: ${weeklyAnswers.energy}
- Unusual symptoms: ${weeklyAnswers.symptoms}
- Weight / bloating: ${weeklyAnswers.weight}
- Last week's plan followed: ${actionRating || "Not rated"}

Based on her progress and new symptoms, generate a full personalised weekly action plan.

Return ONLY a valid JSON object in this exact format (no markdown, no extra text):
{
  "comparisonInsight": "1-2 sentences comparing this week to baseline, starting with 'Based on your progress and new symptoms...'",
  "diet": ["tip1", "tip2", "tip3"],
  "movement": ["tip1", "tip2", "tip3"],
  "selfCare": ["tip1", "tip2", "tip3"]
}

Each tip should be 1 warm, actionable sentence. All tips must be PCOD-specific and phase-aware.`;

  let lastErr;
  const rateLimited = [];

  // Pass 1 — try all models
  for (const model of AI_MODELS) {
    try {
      aiDebug("Trying AI model:", model);
      const text  = await tryModel(model, prompt, apiKey);
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      if (parsed.diet && parsed.movement && parsed.selfCare) {
        aiDebug("AI model succeeded:", model);
        return parsed;
      }
    } catch (e) {
      aiDebugWarn("AI model failed:", model, e.message);
      lastErr = e;
      if (e.is429) rateLimited.push(model);
    }
  }

  // Pass 2 — retry rate-limited models after 4s
  if (rateLimited.length > 0) {
    aiDebug("Retrying rate-limited AI models in 4s");
    await sleep(4000);
    for (const model of rateLimited) {
      try {
        const text   = await tryModel(model, prompt, apiKey);
        const clean  = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        if (parsed.diet && parsed.movement && parsed.selfCare) return parsed;
      } catch (e) {
        lastErr = e;
      }
    }
  }

  throw lastErr || new Error("All AI models unavailable");
}

// ════════════════════════════════════════════════════════════════════════════
// POST /api/period
// ════════════════════════════════════════════════════════════════════════════
const savePeriodTracker = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      lastPeriod, regularity, cycleLength, flow, spotting,
      skin, hair, weight, sleep, ovulation, pain,
      conditions, ageGroup,
    } = req.body;

    if (!lastPeriod || !regularity || !cycleLength || !flow || !spotting) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const parsedLastPeriod = parseDateOnly(lastPeriod);
    if (!parsedLastPeriod) {
      return res.status(400).json({ message: "Invalid lastPeriod date." });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedLastPeriod > today) {
      return res.status(400).json({
        message: "Future dates are not allowed. Please select a date up to today.",
      });
    }

    const cycleLengthDays = parseCycleDays(cycleLength);

    const newSnapshot = {
      lastPeriod: parsedLastPeriod, regularity, cycleLength, flow, spotting,
      skin: skin || "", hair: hair || "", weight: weight || "",
      sleep: sleep || "", ovulation: ovulation || "", pain: pain || "",
      conditions: conditions || [], cycleLengthDays,
      savedAt: new Date(),
    };

    const existing = await PeriodTracker.findOne({ userId });

    if (existing) {
      existing.history.push({ ...existing.current.toObject(), savedAt: existing.updatedAt });
      existing.current  = newSnapshot;
      existing.ageGroup = ageGroup || existing.ageGroup;
      // Reset weekly check-in on monthly update so 7-day clock restarts
      existing.weeklyCheckin = null;
      await existing.save();
      return res.status(200).json({ message: "Period tracker updated", isUpdate: true });
    }

    await PeriodTracker.create({
      userId,
      ageGroup: ageGroup || "young",
      current:  newSnapshot,
      history:  [],
    });

    res.status(201).json({ message: "Period tracker saved", isUpdate: false });

  } catch (err) {
    console.error("savePeriodTracker error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// GET /api/period/me
// ════════════════════════════════════════════════════════════════════════════
const getPeriodTracker = async (req, res) => {
  try {
    const tracker = await PeriodTracker.findOne({ userId: req.user.id });
    if (!tracker) return res.status(200).json({ hasTracker: false });

    // ── Days since monthly update (full 12 questions) ─────────────────────
    const daysSinceUpdate = Math.floor(
      (new Date() - new Date(tracker.updatedAt)) / (1000 * 60 * 60 * 24)
    );

    // ── Days since last weekly check-in ───────────────────────────────────
    const daysSinceWeekly = tracker.weeklyCheckin?.submittedAt
      ? Math.floor(
          (new Date() - new Date(tracker.weeklyCheckin.submittedAt)) /
            (1000 * 60 * 60 * 24)
        )
      : 999; // never done → always eligible

    // ── Priority: monthly > weekly > dashboard ─────────────────────────────
    // 30+ days  → full 12 questions (monthly reset)
    // 7–29 days → weekly mini check-in
    // 0–6 days  → straight to dashboard
    const needsMonthlyCheckIn = daysSinceUpdate >= 30;
    const needsWeeklyCheckIn  = !needsMonthlyCheckIn && daysSinceWeekly >= 7;

    res.status(200).json({
      hasTracker: true,
      daysSinceUpdate,
      daysSinceWeekly,
      needsCheckIn:       needsMonthlyCheckIn, // existing key — kept for compatibility
      needsWeeklyCheckIn,
      needsMonthlyCheckIn,
      lastUpdated:        tracker.updatedAt,
      ageGroup:           tracker.ageGroup,
      current:            tracker.current,
      // Pass latest action plan so frontend can show "last week's plan" in check-in
      latestActionPlan:   tracker.actionPlan || null,
    });
  } catch (err) {
    console.error("getPeriodTracker error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// GET /api/period/dashboard
// ════════════════════════════════════════════════════════════════════════════
const getCycleDashboard = async (req, res) => {
  try {
    const tracker = await PeriodTracker.findOne({ userId: req.user.id });
    if (!tracker) {
      return res.status(404).json({ message: "No period tracker found. Please complete setup first." });
    }

    const current = tracker.current;
    const { phase, cycleDay, cycleLengthDays, daysUntilNextPeriod, nextPeriodDate } =
      computePhase(current.lastPeriod, current.cycleLengthDays);

    const phaseTips = getPhaseTips(phase, current.flow, current.pain);
    const { insights, shouldSeeDoctor } = generateInsights(current);
    const comparison = generateComparison(current, tracker.history);

    const daysSinceUpdate = Math.floor(
      (new Date() - new Date(tracker.updatedAt)) / (1000 * 60 * 60 * 24)
    );
    const daysUntilNextCheckIn = Math.max(0, 30 - daysSinceUpdate);

    // ── Weekly check-in context ───────────────────────────────────────────
    const daysSinceWeekly = tracker.weeklyCheckin?.submittedAt
      ? Math.floor(
          (new Date() - new Date(tracker.weeklyCheckin.submittedAt)) /
            (1000 * 60 * 60 * 24)
        )
      : 999;
    const daysUntilNextWeeklyCheckIn = Math.max(0, 7 - daysSinceWeekly);

    res.status(200).json({
      phase,
      cycleDay,
      cycleLengthDays,
      daysUntilNextPeriod,
      nextPeriodDate,
      phaseTips,
      insights,
      shouldSeeDoctor,
      comparison,
      daysSinceUpdate,
      daysUntilNextCheckIn,
      needsCheckIn: daysSinceUpdate >= 30,

      // ── Weekly plan data ─────────────────────────────────────────────
      actionPlan:                  tracker.actionPlan  || null,
      weeklyCheckin:               tracker.weeklyCheckin || null,
      daysUntilNextWeeklyCheckIn,
      needsWeeklyCheckIn:          daysSinceWeekly >= 7,

      trackerData: {
        regularity:  current.regularity,
        cycleLength: current.cycleLength,
        flow:        current.flow,
        spotting:    current.spotting,
        ovulation:   current.ovulation,
        pain:        current.pain,
        conditions:  current.conditions,
        lastPeriod:  current.lastPeriod,
        skin:        current.skin,
        hair:        current.hair,
        weight:      current.weight,
        sleep:       current.sleep,
      },
    });

  } catch (err) {
    console.error("getCycleDashboard error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// POST /api/period/weekly
// Body: { actionRating, answers: { regularity, acne, energy, symptoms, weight } }
// ════════════════════════════════════════════════════════════════════════════
const submitWeeklyCheckin = async (req, res) => {
  try {
    const userId = req.user.id;
    const { actionRating, answers } = req.body;

    // Validate answers exist
    if (!answers || typeof answers !== "object") {
      return res.status(400).json({ message: "Weekly check-in answers are required." });
    }

    const tracker = await PeriodTracker.findOne({ userId });
    if (!tracker) {
      return res.status(404).json({ message: "No period tracker found. Please complete setup first." });
    }

    // ── Save the weekly check-in immediately ─────────────────────────────
    tracker.weeklyCheckin = {
      actionRating: actionRating || "",
      answers: {
        regularity: answers.regularity || "",
        acne:       answers.acne       || "",
        energy:     answers.energy     || "",
        symptoms:   answers.symptoms   || "",
        weight:     answers.weight     || "",
      },
      submittedAt: new Date(),
    };

    // ── Compute current phase for AI context ─────────────────────────────
    const { phase } = computePhase(
      tracker.current.lastPeriod,
      tracker.current.cycleLengthDays
    );

    // ── Consistency score ─────────────────────────────────────────────────
    const consistencyScore = calcConsistencyScore(actionRating);

    // ── Generate AI action plan ───────────────────────────────────────────
    const apiKey = process.env.OPENROUTER_API_KEY;
    let aiPlan = null;

    if (apiKey) {
      try {
        aiPlan = await generateActionPlanAI({
          current:       tracker.current,
          weeklyAnswers: tracker.weeklyCheckin.answers,
          actionRating:  actionRating || "",
          phase,
          ageGroup:      tracker.ageGroup,
          apiKey,
        });
      } catch (aiErr) {
        aiDebugWarn("OpenRouter unavailable, using local action plan fallback:", aiErr.message);
        // Fall through — we'll save fallback plan below
      }
    }

    // ── Fallback plan if AI fails or no API key ───────────────────────────
    if (!aiPlan) {
      aiPlan = {
        comparisonInsight: "Based on your progress and new symptoms, keep tracking your cycle for personalised insights.",
        diet:     [
          "Include iron-rich foods like spinach and lentils 🥬",
          "Stay hydrated with 8+ glasses of water daily 💧",
          "Add anti-inflammatory spices like turmeric to your meals 🌿",
        ],
        movement: [
          "Aim for 20–30 minutes of gentle movement daily 🚶‍♀️",
          "Try yoga or stretching for hormonal balance 🧘‍♀️",
          "Listen to your body — rest when energy is low 💛",
        ],
        selfCare: [
          "Prioritise 7–9 hours of quality sleep 💤",
          "Practice 5 minutes of deep breathing each morning 🫁",
          "Reduce screen time 1 hour before bed 📵",
        ],
      };
    }

    // ── Save action plan with consistency score ───────────────────────────
    tracker.actionPlan = {
      diet:              aiPlan.diet,
      movement:          aiPlan.movement,
      selfCare:          aiPlan.selfCare,
      comparisonInsight: aiPlan.comparisonInsight,
      consistencyScore,
      generatedAt:       new Date(),
    };

    await tracker.save();

    // ── Generate weekly progress comparison ───────────────────────────────
    // Compare this week's mini answers to baseline for the response
    const weeklyProgress = generateWeeklyProgress(
      tracker.current,
      tracker.weeklyCheckin.answers
    );

    res.status(200).json({
      message:          "Weekly check-in saved successfully",
      actionPlan:       tracker.actionPlan,
      weeklyProgress,
      consistencyScore,
      phase,
    });

  } catch (err) {
    console.error("submitWeeklyCheckin error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// GET /api/period/action-plan
// ════════════════════════════════════════════════════════════════════════════
const getActionPlan = async (req, res) => {
  try {
    const tracker = await PeriodTracker.findOne({ userId: req.user.id });
    if (!tracker) {
      return res.status(404).json({ message: "No period tracker found." });
    }
    if (!tracker.actionPlan) {
      return res.status(200).json({ hasActionPlan: false });
    }

    const { phase } = computePhase(
      tracker.current.lastPeriod,
      tracker.current.cycleLengthDays
    );

    res.status(200).json({
      hasActionPlan:    true,
      actionPlan:       tracker.actionPlan,
      weeklyCheckin:    tracker.weeklyCheckin,
      phase,
      consistencyScore: tracker.actionPlan.consistencyScore,
      generatedAt:      tracker.actionPlan.generatedAt,
    });
  } catch (err) {
    console.error("getActionPlan error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ── Helper: generate weekly progress summary for response ─────────────────────
function generateWeeklyProgress(baseline, weeklyAnswers) {
  const progress = [];

  // Regularity
  if (weeklyAnswers.regularity) {
    const improved =
      weeklyAnswers.regularity.toLowerCase().includes("regular") ||
      weeklyAnswers.regularity.toLowerCase().includes("normal") ||
      weeklyAnswers.regularity.toLowerCase().includes("same");
    progress.push({
      label:    "Cycle Regularity",
      baseline: baseline.regularity,
      thisWeek: weeklyAnswers.regularity,
      status:   improved ? "improved" : "watch",
      icon:     improved ? "✅" : "🌀",
    });
  }

  // Energy
  if (weeklyAnswers.energy) {
    const improved =
      weeklyAnswers.energy.toLowerCase().includes("better") ||
      weeklyAnswers.energy.toLowerCase().includes("good") ||
      weeklyAnswers.energy.toLowerCase().includes("high") ||
      weeklyAnswers.energy.toLowerCase().includes("great");
    progress.push({
      label:    "Energy Levels",
      baseline: baseline.sleep, // sleep quality is closest baseline proxy
      thisWeek: weeklyAnswers.energy,
      status:   improved ? "improved" : "watch",
      icon:     improved ? "✅" : "😴",
    });
  }

  // Acne / Skin
  if (weeklyAnswers.acne) {
    const improved =
      weeklyAnswers.acne.toLowerCase().includes("clear") ||
      weeklyAnswers.acne.toLowerCase().includes("better") ||
      weeklyAnswers.acne.toLowerCase().includes("no") ||
      weeklyAnswers.acne.toLowerCase().includes("none");
    progress.push({
      label:    "Skin",
      baseline: baseline.skin,
      thisWeek: weeklyAnswers.acne,
      status:   improved ? "improved" : "watch",
      icon:     improved ? "✨" : "🌀",
    });
  }

  // Weight / Bloating
  if (weeklyAnswers.weight) {
    const improved =
      weeklyAnswers.weight.toLowerCase().includes("stable") ||
      weeklyAnswers.weight.toLowerCase().includes("better") ||
      weeklyAnswers.weight.toLowerCase().includes("less") ||
      weeklyAnswers.weight.toLowerCase().includes("reduced");
    progress.push({
      label:    "Weight / Bloating",
      baseline: baseline.weight,
      thisWeek: weeklyAnswers.weight,
      status:   improved ? "improved" : "watch",
      icon:     improved ? "✅" : "⚖️",
    });
  }

  return progress;
}

module.exports = {
  savePeriodTracker,
  getCycleDashboard,
  getPeriodTracker,
  submitWeeklyCheckin,
  getActionPlan,
};
