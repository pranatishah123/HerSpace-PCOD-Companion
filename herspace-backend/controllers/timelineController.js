const ZonesTracker  = require("../models/ZonesTracker");
const PeriodTracker = require("../models/PeriodTracker");
const SkinEntry     = require("../models/SkinEntry");

// ── Helpers ──────────────────────────────────────────────────────────────────

function zoneLabel(zone) {
  return {
    healthy:  "Stabilize & Recover",
    mild:     "Support Sensitivity",
    moderate: "Build Consistency",
    high:     "Maintain & Optimize",
  }[zone] || zone;
}

function zoneEmoji(zone) {
  return { healthy:"✨", mild:"💎", moderate:"🌸", high:"🌺" }[zone] || "🌿";
}

function severityColor(s) {
  return { Low:"#1D9E75", Moderate:"#BA7517", High:"#A32D2D" }[s] || "#888";
}

function cyclePhaseEmoji(phase) {
  return {
    Menstrual:   "🔴",
    Follicular:  "🌱",
    Ovulation:   "🌕",
    Luteal:      "🌙",
  }[phase] || "🌸";
}

// ── Build timeline events from all 3 sources ─────────────────────────────────

function buildZoneEvents(tracker) {
  const events = [];
  if (!tracker) return events;

  // Current zone snapshot
  if (tracker.current?.zone) {
    events.push({
      id:       `zone-current`,
      type:     "zone",
      date:     tracker.current.savedAt || tracker.updatedAt,
      title:    `Zone: ${zoneLabel(tracker.current.zone)}`,
      subtitle: `Risk score ${tracker.current.finalScore ?? 0}/${120} · Confidence ${tracker.current.confidencePct ?? 0}%`,
      emoji:    zoneEmoji(tracker.current.zone),
      zone:     tracker.current.zone,
      color:    zoneColor(tracker.current.zone),
      tags:     tracker.current.detectedSymptoms || [],
      detail:   {
        score:       tracker.current.finalScore ?? 0,
        confidence:  tracker.current.confidencePct ?? 0,
        symptoms:    tracker.current.detectedSymptoms || [],
      },
    });
  }

  // Zone history snapshots
  (tracker.history || []).forEach((snap, i) => {
    events.push({
      id:       `zone-history-${i}`,
      type:     "zone",
      date:     snap.savedAt,
      title:    `Zone: ${zoneLabel(snap.zone)}`,
      subtitle: `Risk score ${snap.finalScore ?? 0}/120 · Past assessment`,
      emoji:    zoneEmoji(snap.zone),
      zone:     snap.zone,
      color:    zoneColor(snap.zone),
      tags:     snap.detectedSymptoms || [],
      detail:   {
        score:      snap.finalScore ?? 0,
        confidence: snap.confidencePct ?? 0,
        symptoms:   snap.detectedSymptoms || [],
      },
    });
  });

  // Mini check-ins
  (tracker.miniCheckins || []).forEach((mc, i) => {
    const positive = mc.overall === "Better" || mc.energy === "Improved";
    events.push({
      id:       `mini-checkin-${i}`,
      type:     "miniCheckin",
      date:     mc.submittedAt,
      title:    `Weekly Check-in`,
      subtitle: `Energy: ${mc.energy} · Symptoms: ${mc.symptoms} · Overall: ${mc.overall}`,
      emoji:    positive ? "📈" : mc.overall === "Worse" ? "📉" : "📋",
      color:    positive ? "#1D9E75" : mc.overall === "Worse" ? "#A32D2D" : "#BA7517",
      tags:     [],
      detail:   {
        energy:   mc.energy,
        symptoms: mc.symptoms,
        skin:     mc.skin,
        stress:   mc.stress,
        overall:  mc.overall,
      },
    });
  });

  // Risk events
  (tracker.riskEvents || []).forEach((re, i) => {
    events.push({
      id:       `risk-event-${i}`,
      type:     "riskEvent",
      date:     re.recordedAt,
      title:    `Risk Alert — ${re.level === "high" ? "High Risk Detected" : "Normal Range"}`,
      subtitle: re.summary || "Logged by system",
      emoji:    re.level === "high" ? "⚠️" : "✅",
      color:    re.level === "high" ? "#A32D2D" : "#1D9E75",
      tags:     [],
      detail:   { level: re.level, source: re.source, summary: re.summary },
    });
  });

  // Action plan
  if (tracker.actionPlan?.submittedAt) {
    const insight = tracker.actionPlan.insight || "";
    events.push({
      id:       "action-plan",
      type:     "actionPlan",
      date:     tracker.actionPlan.submittedAt,
      title:    "AI Action Plan Generated",
      subtitle: `Stability: ${tracker.actionPlan.stabilityScore || "Stable"}${insight ? ` - ${insight}` : ""}`,
      emoji:    "💡",
      color:    "#667eea",
      tags:     [],
      detail:   {
        diet:      tracker.actionPlan.diet || [],
        movement:  tracker.actionPlan.movement || [],
        selfCare:  tracker.actionPlan.selfCare || [],
        insight:   tracker.actionPlan.insight || "",
        stability: tracker.actionPlan.stabilityScore || "Stable",
      },
    });
  }

  return events;
}

function buildPeriodEvents(period) {
  const events = [];
  if (!period) return events;

  // Current cycle snapshot
  if (period.current?.lastPeriod) {
    events.push({
      id:       "period-current",
      type:     "period",
      date:     period.current.savedAt || period.updatedAt,
      title:    "Cycle Log Updated",
      subtitle: `Last period: ${new Date(period.current.lastPeriod).toLocaleDateString()} · ${period.current.regularity} · ${period.current.flow} flow`,
      emoji:    "🔴",
      color:    "#c45e8a",
      tags:     period.current.conditions || [],
      detail:   {
        lastPeriod:      period.current.lastPeriod,
        regularity:      period.current.regularity,
        cycleLength:     period.current.cycleLength,
        cycleLengthDays: period.current.cycleLengthDays,
        flow:            period.current.flow,
        spotting:        period.current.spotting,
        pain:            period.current.pain,
        skin:            period.current.skin,
        hair:            period.current.hair,
        weight:          period.current.weight,
        sleep:           period.current.sleep,
        ovulation:       period.current.ovulation,
        conditions:      period.current.conditions || [],
      },
    });
  }

  // Period history snapshots
  (period.history || []).forEach((snap, i) => {
    if (!snap.lastPeriod) return;
    events.push({
      id:       `period-history-${i}`,
      type:     "period",
      date:     snap.savedAt,
      title:    "Past Cycle Logged",
      subtitle: `Last period: ${new Date(snap.lastPeriod).toLocaleDateString()} · ${snap.regularity}`,
      emoji:    "🔴",
      color:    "#c45e8a",
      tags:     snap.conditions || [],
      detail:   {
        lastPeriod:  snap.lastPeriod,
        regularity:  snap.regularity,
        cycleLength: snap.cycleLength,
        flow:        snap.flow,
        conditions:  snap.conditions || [],
      },
    });
  });

  // Weekly check-in
  if (period.weeklyCheckin?.submittedAt) {
    const wc = period.weeklyCheckin;
    events.push({
      id:       "period-weekly",
      type:     "periodCheckin",
      date:     wc.submittedAt,
      title:    "Period Tracker Check-in",
      subtitle: `Action: ${wc.actionRating || "—"} · Energy: ${wc.answers?.energy || "—"} · Acne: ${wc.answers?.acne || "—"}`,
      emoji:    "📝",
      color:    "#b565a7",
      tags:     [],
      detail:   {
        actionRating: wc.actionRating,
        regularity:   wc.answers?.regularity,
        acne:         wc.answers?.acne,
        energy:       wc.answers?.energy,
        symptoms:     wc.answers?.symptoms,
        weight:       wc.answers?.weight,
      },
    });
  }

  // Action plan
  if (period.actionPlan?.generatedAt) {
    const ap = period.actionPlan;
    const comparisonInsight = ap.comparisonInsight || "";
    events.push({
      id:       "period-action-plan",
      type:     "actionPlan",
      date:     ap.generatedAt,
      title:    "Cycle Action Plan Generated",
      subtitle: `Consistency score: ${ap.consistencyScore ?? 0}%${comparisonInsight ? ` - ${comparisonInsight}` : ""}`,
      emoji:    "💡",
      color:    "#667eea",
      tags:     [],
      detail:   {
        diet:             ap.diet || [],
        movement:         ap.movement || [],
        selfCare:         ap.selfCare || [],
        comparisonInsight: ap.comparisonInsight || "",
        consistencyScore: ap.consistencyScore ?? 0,
      },
    });
  }

  return events;
}

function buildSkinEvents(skinEntries) {
  return (skinEntries || []).map((entry, i) => ({
    id:       `skin-${entry._id || i}`,
    type:     "skin",
    date:     entry.createdAt,
    title:    `Skin Analysis — ${entry.condition || "Checked"}`,
    subtitle: `Severity: ${entry.severity || "—"} · ${entry.hormonalLink ? "Possible pattern observed" : "No hormonal pattern noted"}`,
    emoji:    "✨",
    color:    severityColor(entry.severity),
    tags:     entry.possibleCauses?.slice(0, 2) || [],
    detail:   {
      condition:      entry.condition,
      severity:       entry.severity,
      severityScore:  entry.severityScore,
      possibleCauses: entry.possibleCauses || [],
      careTips:       entry.careTips || [],
      hormonalLink:   entry.hormonalLink,
      hormonalNote:   entry.hormonalNote,
      aiNote:         entry.aiNote,
      cycleDay:       entry.cycleDay,
      cyclePhase:     entry.cyclePhase,
      imageUrl:       entry.imageUrl,
      doctorConsult:  entry.doctorConsult,
    },
  }));
}

function zoneColor(zone) {
  return {
    healthy:  "#5b9e8a",
    mild:     "#4a7fc1",
    moderate: "#b565a7",
    high:     "#c45e8a",
  }[zone] || "#888";
}

// ── Main controller ───────────────────────────────────────────────────────────

const getMyTimeline = async (req, res) => {
  try {
    const userId = req.user.id;

    const [tracker, period, skinEntries] = await Promise.all([
      ZonesTracker.findOne({ userId }).lean(),
      PeriodTracker.findOne({ userId }).lean(),
      SkinEntry.find({ userId }).sort({ createdAt: -1 }).limit(20).lean(),
    ]);

    const allEvents = [
      ...buildZoneEvents(tracker),
      ...buildPeriodEvents(period),
      ...buildSkinEvents(skinEntries),
    ];

    // Sort newest first
    allEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Summary stats
    const currentZone   = tracker?.current?.zone || null;
    const totalSkin     = skinEntries.length;
    const hormonalSkin  = skinEntries.filter((s) => s.hormonalLink).length;
    const highRiskCount = (tracker?.riskEvents || []).filter((e) => e.level === "high").length;
    const lastPeriod    = period?.current?.lastPeriod || null;

    return res.status(200).json({
      events:  allEvents,
      total:   allEvents.length,
      summary: {
        currentZone,
        currentZoneLabel: zoneLabel(currentZone),
        currentZoneColor: zoneColor(currentZone),
        totalAssessments: (tracker?.history?.length || 0) + (tracker?.current ? 1 : 0),
        totalSkinChecks:  totalSkin,
        hormonalSkinLinks: hormonalSkin,
        highRiskEvents:   highRiskCount,
        lastPeriodDate:   lastPeriod,
        hasPeriodData:    !!period,
        hasZoneData:      !!tracker,
        hasSkinData:      totalSkin > 0,
      },
    });
  } catch (err) {
    console.error("getMyTimeline error:", err.message);
    return res.status(500).json({ message: "Server error." });
  }
};

module.exports = { getMyTimeline };
