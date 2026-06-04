import React, { useState, useEffect, useRef, useMemo } from "react";
import periodBg   from "../assets/period-bg.png";
import periodGirl from "../assets/period-girl.png";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API = "http://localhost:5000/api";

// ── Age-aware PCOD options ────────────────────────────────────────────────────
const REGULARITY_OPTS = [
  { label:"Very regular",        emoji:"⏰", sub:"Same date every month" },
  { label:"Mostly regular",      emoji:"📅", sub:"Within a week usually" },
  { label:"Sometimes irregular", emoji:"🌀", sub:"Varies by 1–2 weeks" },
  { label:"Very unpredictable",  emoji:"🎲", sub:"Hard to predict at all" },
];
const CYCLE_LEN_OPTS = [
  { label:"Less than 21 days", emoji:"⚡", sub:"Very short — worth noting" },
  { label:"21–28 days",        emoji:"🌙", sub:"Typical range" },
  { label:"29–35 days",        emoji:"🌸", sub:"Slightly longer" },
  { label:"35+ days / Unsure", emoji:"🔮", sub:"Possible PCOD signal" },
];
const FLOW_OPTS = [
  { label:"Very light / Spotting", emoji:"💧",  sub:"Barely there" },
  { label:"Light",                 emoji:"🌤️", sub:"Manageable" },
  { label:"Moderate",              emoji:"🌊",  sub:"Normal amount" },
  { label:"Heavy / Very heavy",    emoji:"🔴",  sub:"Soaks pad quickly" },
];
const SPOTTING_OPTS = [
  { label:"Never",          emoji:"✅", sub:"No bleeding in between" },
  { label:"Rarely",         emoji:"🤔", sub:"Once or twice ever" },
  { label:"Sometimes",      emoji:"⚠️", sub:"A few times a year" },
  { label:"Often / Always", emoji:"🔴", sub:"Most cycles — flag this" },
];
const OVULATION_OPTS = [
  { label:"Yes, I track it",    emoji:"🥚", sub:"Actively monitoring" },
  { label:"I feel signs of it", emoji:"🌙", sub:"Mild pain or discharge" },
  { label:"No / Not sure",      emoji:"❓", sub:"Don't track it" },
  { label:"I may not ovulate",  emoji:"⚕️", sub:"Suspected anovulation" },
];
const PAIN_OPTS = [
  { label:"No pain",         emoji:"😊", sub:"Comfortable periods" },
  { label:"Mild discomfort", emoji:"😕", sub:"Manageable without meds" },
  { label:"Moderate pain",   emoji:"😣", sub:"Need painkillers sometimes" },
  { label:"Severe pain",     emoji:"😰", sub:"Affects daily life" },
];
const CONDITION_OPTS = [
  { label:"PCOS / PCOD",     emoji:"🔬" },
  { label:"Endometriosis",   emoji:"🩺" },
  { label:"Thyroid issues",  emoji:"⚕️" },
  { label:"None / Not sure", emoji:"✨" },
];

const FOLLOWED_OPTS = [
  { label:"Yes, followed most tips",  emoji:"✅", sub:"Stayed consistent" },
  { label:"Partially followed",       emoji:"🤔", sub:"Did some, skipped some" },
  { label:"Rarely followed",          emoji:"😕", sub:"Struggled to keep up" },
  { label:"Did not follow",           emoji:"❌", sub:"Couldn't this time" },
];

// ── Weekly check-in action rating options ─────────────────────────────────────
const ACTION_RATING_OPTS = [
  { label:"Done",    emoji:"✅", sub:"Followed the plan well",    rating:"Done"    },
  { label:"Partial", emoji:"😐", sub:"Did some, skipped some",    rating:"Partial" },
  { label:"Skipped", emoji:"❌", sub:"Couldn't follow it",        rating:"Skipped" },
];

// ── Weekly mini check-in (same answer ids for API — copy tuned per age band) ─
const WEEKLY_BASE = {
  regularity: (q, h, o) => ({ id: "regularity", q, hint: h, opts: o }),
  acne:       (q, h, o) => ({ id: "acne",       q, hint: h, opts: o }),
  energy:     (q, h, o) => ({ id: "energy",     q, hint: h, opts: o }),
  symptoms:   (q, h, o) => ({ id: "symptoms",   q, hint: h, opts: o }),
  weight:     (q, h, o) => ({ id: "weight",     q, hint: h, opts: o }),
};

const WEEKLY_QUESTIONS_BY_AGE = {
  teen: [
    WEEKLY_BASE.regularity(
      "Was your period on time this week (or what you expected)? 📅",
      "🌙 It’s normal for teen cycles to shift a little while hormones settle",
      [
        { label:"Right on time",      emoji:"⏰", sub:"Predictable" },
        { label:"A few days early/late", emoji:"🌀", sub:"Small shift" },
        { label:"Pretty irregular",   emoji:"🎲", sub:"Hard to guess" },
        { label:"Skipped / unsure",   emoji:"⚠️", sub:"Let an adult know if worried" },
      ]
    ),
    WEEKLY_BASE.acne(
      "Any new pimples — especially on chin or forehead? ✨",
      "✨ Hormones can make skin change week to week",
      [
        { label:"Clear skin",       emoji:"😊", sub:"No new spots" },
        { label:"A few spots",      emoji:"🤔", sub:"Nothing major" },
        { label:"More breakouts",   emoji:"😟", sub:"Jaw or forehead" },
        { label:"Really bad flare", emoji:"😰", sub:"Painful or cystic" },
      ]
    ),
    WEEKLY_BASE.energy(
      "How was your energy for school, sports, and friends? ⚡",
      "💛 Sleep and stress affect how energetic you feel",
      [
        { label:"Lots of energy", emoji:"⚡", sub:"Felt great" },
        { label:"Pretty okay",    emoji:"🌟", sub:"Mostly fine" },
        { label:"Tired a lot",    emoji:"😴", sub:"Dragging most days" },
        { label:"Exhausted",      emoji:"😵", sub:"Hard to get through the day" },
      ]
    ),
    WEEKLY_BASE.symptoms(
      "Anything uncomfortable — bad cramps, dizziness, or heavy bleeding? 🩺",
      "🔍 Heavy pain or very heavy bleeding is worth telling a trusted adult",
      [
        { label:"No big issues",      emoji:"✅", sub:"Felt normal" },
        { label:"Mild cramps",        emoji:"🤔", sub:"Manageable" },
        { label:"Bad cramps / pain",  emoji:"😣", sub:"Needed rest or meds" },
        { label:"Worried symptoms",   emoji:"⚠️", sub:"New or severe" },
      ]
    ),
    WEEKLY_BASE.weight(
      "Any bloating or clothes feeling tighter this week? 👖",
      "⚖️ Bloating can show up before a period — it’s common",
      [
        { label:"No change",         emoji:"✅", sub:"Felt the same" },
        { label:"A little bloated",  emoji:"🤔", sub:"Mild" },
        { label:"Quite bloated",     emoji:"😟", sub:"Noticeable" },
        { label:"Sudden big change", emoji:"⚠️", sub:"Unusual for you" },
      ]
    ),
  ],
  young: [
    WEEKLY_BASE.regularity(
      "How regular was your cycle this week?",
      "🌙 Any shifts in your cycle pattern?",
      [
        { label:"Very regular",       emoji:"⏰", sub:"On track as expected" },
        { label:"Slightly irregular", emoji:"🌀", sub:"A small shift noticed" },
        { label:"More irregular",     emoji:"🎲", sub:"Noticeable change" },
        { label:"Very irregular",     emoji:"⚠️", sub:"Hard to predict this week" },
      ]
    ),
    WEEKLY_BASE.acne(
      "Any new acne or skin changes this week?",
      "✨ Jaw/chin breakouts are hormonal signals",
      [
        { label:"Clear skin",        emoji:"😊", sub:"No changes" },
        { label:"Minor breakouts",   emoji:"🤔", sub:"A pimple or two" },
        { label:"Hormonal acne",     emoji:"😟", sub:"Jaw or chin area" },
        { label:"Worse than usual",  emoji:"😰", sub:"More than normal" },
      ]
    ),
    WEEKLY_BASE.energy(
      "How were your energy levels this week?",
      "💛 Energy tracks closely with your cycle phase",
      [
        { label:"High energy",   emoji:"⚡", sub:"Feeling great" },
        { label:"Good",          emoji:"🌟", sub:"Normal levels" },
        { label:"Low energy",    emoji:"😴", sub:"Tired more than usual" },
        { label:"Very fatigued", emoji:"😵", sub:"Exhausted all week" },
      ]
    ),
    WEEKLY_BASE.symptoms(
      "Any unusual symptoms this week?",
      "🔍 Spotting, pelvic pain, or new discomforts",
      [
        { label:"No symptoms",       emoji:"✅", sub:"All normal" },
        { label:"Mild spotting",     emoji:"🩸", sub:"Light mid-cycle bleeding" },
        { label:"Pelvic discomfort", emoji:"😣", sub:"Pain or cramping" },
        { label:"Multiple symptoms", emoji:"⚠️", sub:"More than one issue" },
      ]
    ),
    WEEKLY_BASE.weight(
      "Any weight or bloating changes?",
      "⚖️ Bloating often peaks in luteal phase",
      [
        { label:"Stable",           emoji:"✅", sub:"No changes" },
        { label:"Slight bloating",  emoji:"🤔", sub:"Mild puffiness" },
        { label:"More bloating",    emoji:"😟", sub:"Noticeable this week" },
        { label:"Weight increased", emoji:"⚠️", sub:"Unexplained gain" },
      ]
    ),
  ],
  adult: [
    WEEKLY_BASE.regularity(
      "How predictable was your cycle pattern this week?",
      "🌙 PCOD can make timing drift — note any change",
      [
        { label:"Very regular",       emoji:"⏰", sub:"As expected" },
        { label:"Slightly off",       emoji:"🌀", sub:"A few days variance" },
        { label:"Clearly irregular",  emoji:"🎲", sub:"Hard to plan around" },
        { label:"Very unpredictable",   emoji:"⚠️", sub:"Major shift" },
      ]
    ),
    WEEKLY_BASE.acne(
      "Skin or jawline acne — any flare-ups this week?",
      "✨ Androgen-driven acne often hits jaw/chin mid-cycle",
      [
        { label:"Stable / clear",    emoji:"😊", sub:"No flare" },
        { label:"Minor flare",       emoji:"🤔", sub:"A few spots" },
        { label:"Hormonal breakout", emoji:"😟", sub:"Jawline pattern" },
        { label:"Severe flare",      emoji:"😰", sub:"Painful or widespread" },
      ]
    ),
    WEEKLY_BASE.energy(
      "Energy and focus at work/home — how did you feel?",
      "💛 Crashy afternoons can track with progesterone shifts",
      [
        { label:"Strong & steady", emoji:"⚡", sub:"Good stamina" },
        { label:"Mostly fine",     emoji:"🌟", sub:"Normal ups/downs" },
        { label:"Often drained",   emoji:"😴", sub:"Hard to focus" },
        { label:"Burnt out",       emoji:"😵", sub:"Depleted most days" },
      ]
    ),
    WEEKLY_BASE.symptoms(
      "Spotting, cramps, migraines, or pelvic pain this week?",
      "🔍 New or worsening symptoms deserve attention",
      [
        { label:"None",              emoji:"✅", sub:"Quiet week" },
        { label:"Mild / manageable", emoji:"🤔", sub:"Usual level" },
        { label:"Moderate impact",   emoji:"😣", sub:"Affected routine" },
        { label:"Severe / new",      emoji:"⚠️", sub:"Consider clinical review" },
      ]
    ),
    WEEKLY_BASE.weight(
      "Belly bloating or weight shift — especially before your period?",
      "⚖️ Insulin + hormones can drive midsection water retention",
      [
        { label:"Stable",           emoji:"✅", sub:"No shift" },
        { label:"Mild bloating",    emoji:"🤔", sub:"Clothes a bit tight" },
        { label:"Clear bloating",   emoji:"😟", sub:"Visible change" },
        { label:"Unexplained gain", emoji:"⚠️", sub:"Despite habits" },
      ]
    ),
  ],
  hormonal: [
    WEEKLY_BASE.regularity(
      "Bleeding pattern this week — period, spotting, or unpredictable?",
      "🌸 Perimenopause cycles often shorten, lengthen, or skip",
      [
        { label:"Fairly regular",      emoji:"⏰", sub:"Recognisable pattern" },
        { label:"Heavier/lighter than usual", emoji:"🌀", sub:"Flow changed" },
        { label:"Spotting / irregular", emoji:"🎲", sub:"Hard to call" },
        { label:"Skipped or very long gap", emoji:"⚠️", sub:"Discuss with clinician" },
      ]
    ),
    WEEKLY_BASE.acne(
      "Skin dryness, sensitivity, or hormonal breakouts this week?",
      "✨ Estrogen shifts can flip skin from oily to dry",
      [
        { label:"Mostly stable",     emoji:"😊", sub:"No big change" },
        { label:"Drier or dull",     emoji:"🤔", sub:"Texture shift" },
        { label:"Breakouts + dryness", emoji:"😟", sub:"Mixed pattern" },
        { label:"Notable flare",     emoji:"😰", sub:"Painful or inflamed" },
      ]
    ),
    WEEKLY_BASE.energy(
      "Energy, sleep quality, or night sweats — how was the week?",
      "🌛 Night waking and sweats are common in hormonal transition",
      [
        { label:"Rested overall",     emoji:"⚡", sub:"Sleep helped" },
        { label:"Some rough nights",    emoji:"🌟", sub:"On/off" },
        { label:"Poor sleep / sweats", emoji:"😴", sub:"Often disrupted" },
        { label:"Exhausted daily",    emoji:"😵", sub:"Little recovery" },
      ]
    ),
    WEEKLY_BASE.symptoms(
      "Hot flashes, mood shifts, joint aches, or new pelvic symptoms?",
      "🔍 Track anything new — it helps your care team",
      [
        { label:"Minimal",           emoji:"✅", sub:"Quiet week" },
        { label:"Mild flashes/mood", emoji:"🤔", sub:"Noticeable but ok" },
        { label:"Frequent symptoms", emoji:"😣", sub:"Affecting day" },
        { label:"Severe / worrying", emoji:"⚠️", sub:"Seek guidance" },
      ]
    ),
    WEEKLY_BASE.weight(
      "Weight or waistline changes — especially around the middle?",
      "⚖️ Redistribution is common as estrogen patterns change",
      [
        { label:"Stable",            emoji:"✅", sub:"No change" },
        { label:"Mild shift",        emoji:"🤔", sub:"Slight" },
        { label:"Belly/waist up",    emoji:"😟", sub:"Despite routine" },
        { label:"Rapid change",      emoji:"⚠️", sub:"Worth checking in" },
      ]
    ),
  ],
};

const AGE_QS = {
  teen: {
    skin:   { q:"Do you get breakouts — especially on your chin or jaw? 🌸", hint:"🔍 Jaw-line acne is a common androgen signal", opts:[
      { label:"No breakouts",           emoji:"😊", sub:"Skin stays clear" },
      { label:"Occasional pimples",     emoji:"🤔", sub:"Not a big pattern" },
      { label:"Regular jaw/chin acne",  emoji:"😟", sub:"Most months" },
      { label:"Persistent severe acne", emoji:"😰", sub:"Cystic or constant" },
    ]},
    hair:   { q:"Noticed more hair fall or facial/body hair growing? 💆‍♀️", hint:"🌿 Subtle changes matter — even light fuzz counts", opts:[
      { label:"No changes",                emoji:"✅", sub:"All normal" },
      { label:"Slightly more hair fall",   emoji:"🤔", sub:"Mild increase" },
      { label:"Noticeable hair fall",      emoji:"😟", sub:"On pillow/brush" },
      { label:"Hair fall + facial growth", emoji:"⚠️", sub:"Both present" },
    ]},
    weight: { q:"Gained weight without big changes in diet or activity? ⚖️", hint:"🧠 Insulin resistance can cause unexplained weight gain", opts:[
      { label:"No change",                 emoji:"✅", sub:"Stable weight" },
      { label:"Slight gain",               emoji:"🤔", sub:"A few kgs" },
      { label:"Noticeable belly/hip gain", emoji:"😟", sub:"Concentrated" },
      { label:"Rapid unexplained gain",    emoji:"⚠️", sub:"Hard to control" },
    ]},
    sleep:  { q:"How's your energy — do you feel rested after sleeping? 🌙", hint:"😴 Poor sleep quality is a PCOD-linked pattern", opts:[
      { label:"Rested and energetic",    emoji:"✅", sub:"Feel great" },
      { label:"Tired some mornings",     emoji:"🤔", sub:"Occasional fatigue" },
      { label:"Often wake up exhausted", emoji:"😴", sub:"Most days" },
      { label:"Fatigue all day",         emoji:"😵", sub:"Constant low energy" },
    ]},
  },
  young: {
    skin:   { q:"Do you get hormonal acne — especially jawline breakouts? ✨", hint:"🔍 Jaw/chin acne linked to androgen spikes — key PCOD signal", opts:[
      { label:"Clear skin mostly",         emoji:"😊", sub:"Rarely breaks out" },
      { label:"Occasional breakouts",      emoji:"🤔", sub:"Not hormonal pattern" },
      { label:"Monthly hormonal acne",     emoji:"😟", sub:"Jaw/chin/back" },
      { label:"Persistent cystic acne",    emoji:"😰", sub:"Hard to control" },
    ]},
    hair:   { q:"Hair thinning, excess fall, or unwanted facial/body hair? 💆‍♀️", hint:"⚠️ Both hair fall AND growth can happen in PCOD", opts:[
      { label:"No changes",               emoji:"✅", sub:"Hair feels normal" },
      { label:"Some extra hair fall",      emoji:"🤔", sub:"Mild increase" },
      { label:"Visible thinning",          emoji:"😟", sub:"At temples or part" },
      { label:"Thinning + facial growth",  emoji:"⚠️", sub:"Both happening" },
    ]},
    weight: { q:"Has belly fat or weight been harder to manage despite efforts? ⚖️", hint:"🧠 Insulin resistance makes weight loss harder in PCOD", opts:[
      { label:"No issues",                 emoji:"✅", sub:"Weight feels stable" },
      { label:"Slightly harder to lose",   emoji:"🤔", sub:"Small resistance" },
      { label:"Noticeable belly fat gain", emoji:"😟", sub:"Despite efforts" },
      { label:"Rapid unexplained gain",    emoji:"⚠️", sub:"Hard to control" },
    ]},
    sleep:  { q:"Do you feel genuinely rested after sleeping, or still tired? 😴", hint:"🌙 PCOD disrupts cortisol — causing non-restorative sleep", opts:[
      { label:"Sleep well, feel rested",  emoji:"✅", sub:"Good quality" },
      { label:"Sometimes tired mornings", emoji:"🤔", sub:"Not every day" },
      { label:"Wake up tired often",      emoji:"😴", sub:"Most mornings" },
      { label:"Always exhausted",         emoji:"😵", sub:"Sleep doesn't help" },
    ]},
  },
  adult: {
    skin:   { q:"Hormonal acne, oily skin, or dark patches (neck/underarms)? 💎", hint:"🔍 Dark patches = insulin resistance signal", opts:[
      { label:"No skin concerns",           emoji:"😊", sub:"Skin is fine" },
      { label:"Occasional acne",            emoji:"🤔", sub:"Not a clear pattern" },
      { label:"Hormonal acne + oily skin",  emoji:"😟", sub:"Recurring pattern" },
      { label:"Acne + dark patches",        emoji:"⚠️", sub:"Strong hormonal signal" },
    ]},
    hair:   { q:"Hair thinning, increased fall, or facial/body hair changes? 💆‍♀️", hint:"⚕️ Scalp thinning + chin hair = strong PCOD indicator", opts:[
      { label:"No change",                  emoji:"✅", sub:"Hair normal" },
      { label:"More hair fall than before", emoji:"🤔", sub:"Mild increase" },
      { label:"Visible scalp thinning",     emoji:"😟", sub:"Noticeable loss" },
      { label:"Thinning + new facial hair", emoji:"⚠️", sub:"Both happening" },
    ]},
    weight: { q:"Belly or hip weight gain despite diet and exercise? ⚖️", hint:"🧠 Midsection gain = insulin + cortisol imbalance", opts:[
      { label:"No weight issues",          emoji:"✅", sub:"Stable" },
      { label:"Mild gain, manageable",     emoji:"🤔", sub:"A few kgs" },
      { label:"Belly fat — hard to shift", emoji:"😟", sub:"Despite efforts" },
      { label:"Significant rapid gain",    emoji:"⚠️", sub:"Very hard to control" },
    ]},
    sleep:  { q:"Do you feel genuinely rested, or wake up still fatigued? 🛌", hint:"🌙 Non-restorative sleep = cortisol/progesterone imbalance", opts:[
      { label:"Sleep well, feel rested",   emoji:"✅", sub:"Good quality" },
      { label:"Sometimes wake tired",      emoji:"🤔", sub:"Not consistently" },
      { label:"Usually wake exhausted",    emoji:"😴", sub:"Most mornings" },
      { label:"Chronic fatigue all day",   emoji:"😵", sub:"Sleep doesn't restore" },
    ]},
  },
  hormonal: {
    skin:   { q:"Skin dryness, dullness, hormonal acne, or dark patches? 🌸", hint:"🔍 Perimenopausal PCOD can shift from oily to dry skin", opts:[
      { label:"Skin feels normal",           emoji:"😊", sub:"No major change" },
      { label:"Drier or duller than before", emoji:"🤔", sub:"Texture changing" },
      { label:"Hormonal acne + dryness",     emoji:"😟", sub:"Mixed skin issues" },
      { label:"Dark patches + acne",         emoji:"⚠️", sub:"Strong hormonal signal" },
    ]},
    hair:   { q:"Hair thinning, scalp loss, or changes in facial/body hair? 💆‍♀️", hint:"⚕️ Estrogen decline + androgen dominance accelerates loss", opts:[
      { label:"No changes",                  emoji:"✅", sub:"Hair feels same" },
      { label:"Slightly more fall",          emoji:"🤔", sub:"Mild increase" },
      { label:"Visible thinning or patches", emoji:"😟", sub:"Noticeable loss" },
      { label:"Significant loss + growth",   emoji:"⚠️", sub:"Both happening" },
    ]},
    weight: { q:"Belly fat shifting even without diet changes? ⚖️", hint:"🧠 Estrogen decline causes fat redistribution post-35", opts:[
      { label:"No change",              emoji:"✅", sub:"Stable" },
      { label:"Gradual mild gain",      emoji:"🤔", sub:"Slow increase" },
      { label:"Belly fat despite efforts", emoji:"😟", sub:"Hard to shift" },
      { label:"Rapid unexplained gain", emoji:"⚠️", sub:"Significant change" },
    ]},
    sleep:  { q:"Do you wake during night, feel unrested, or have night sweats? 🌛", hint:"🌙 Night waking + fatigue = progesterone drop signal", opts:[
      { label:"Sleep through fine",      emoji:"✅", sub:"Restful sleep" },
      { label:"Occasional waking",       emoji:"🤔", sub:"Not every night" },
      { label:"Wake often or sweating",  emoji:"😴", sub:"Disrupted sleep" },
      { label:"Severe disruption daily", emoji:"😵", sub:"Exhausted always" },
    ]},
  },
};

function buildStepMeta(ageKey) {
  const aq = AGE_QS[ageKey] || AGE_QS.young;
  return [
    { num:"01", q:"When did your last period start?",                        hint:"🗓️ Tap the date — we'll calculate your next cycle!" },
    { num:"02", q:"How regular is your menstrual cycle?",                    hint:"💛 Irregular cycles are the #1 PCOD warning sign" },
    { num:"03", q:"What is your average cycle length?",                      hint:"🌻 Count day 1 of one period to day 1 of the next" },
    { num:"04", q:"How would you describe your menstrual flow?",             hint:"💧 Think about your heaviest day" },
    { num:"05", q:"Do you experience spotting or bleeding between periods?", hint:"⚠️ Mid-cycle spotting can signal anovulation" },
    { num:"06", q: aq.skin.q,   hint: aq.skin.hint   },
    { num:"07", q: aq.hair.q,   hint: aq.hair.hint   },
    { num:"08", q: aq.weight.q, hint: aq.weight.hint },
    { num:"09", q: aq.sleep.q,  hint: aq.sleep.hint  },
    { num:"10", q:"Do you track ovulation or notice ovulation signs?",       hint:"🌙 PCOD commonly causes missed or irregular ovulation" },
    { num:"11", q:"How painful are your periods on your heaviest day?",      hint:"😌 Pain level helps identify hormonal vs structural causes" },
    { num:"✨",  q:"Do you have any of the following diagnosed conditions?", hint:"🩺 Optional — makes your predictions much smarter" },
  ];
}

const PHASE_CONFIG = {
  Menstrual:  { emoji:"🩸", color:"#c45e8a", light:"rgba(196,94,138,0.15)", grad:"linear-gradient(135deg,#c45e8a,#e88ab8)", label:"Menstrual Phase"  },
  Follicular: { emoji:"🌱", color:"#5b9e8a", light:"rgba(91,158,138,0.15)", grad:"linear-gradient(135deg,#5b9e8a,#7dcbb8)", label:"Follicular Phase" },
  Ovulation:  { emoji:"🥚", color:"#b87000", light:"rgba(184,112,0,0.15)",  grad:"linear-gradient(135deg,#b87000,#f5a623)", label:"Ovulation Phase"  },
  Luteal:     { emoji:"🌙", color:"#7c5cbf", light:"rgba(124,92,191,0.15)", grad:"linear-gradient(135deg,#7c5cbf,#b565a7)", label:"Luteal Phase"     },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Nunito:wght@600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
  @keyframes slideNext  { from{opacity:0;transform:translateX(56px)}  to{opacity:1;transform:translateX(0)} }
  @keyframes slidePrev  { from{opacity:0;transform:translateX(-56px)} to{opacity:1;transform:translateX(0)} }
  @keyframes popIn      { from{opacity:0;transform:scale(0.88) translateY(24px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes floatPetal { 0%{transform:translateY(-40px) rotate(0deg);opacity:0} 8%{opacity:1} 92%{opacity:.7} 100%{transform:translateY(105vh) rotate(600deg);opacity:0} }
  @keyframes shimmerAnim{ 0%{background-position:200% center} 100%{background-position:-200% center} }
  @keyframes glowPulse  { 0%,100%{box-shadow:0 0 18px rgba(255,200,50,.5),0 0 36px rgba(255,170,20,.3)} 50%{box-shadow:0 0 28px rgba(255,220,60,.8),0 0 56px rgba(255,180,30,.5)} }
  @keyframes bounceIn   { 0%{transform:scale(0.3);opacity:0} 50%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
  @keyframes fadeUp     { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin       { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes aiShimmer  { 0%,100%{opacity:0.5} 50%{opacity:1} }
  @keyframes progressFill { from{width:0%} to{width:var(--w)} }
  .slide-next  { animation:slideNext .38s cubic-bezier(.22,1,.36,1) both; }
  .slide-prev  { animation:slidePrev .38s cubic-bezier(.22,1,.36,1) both; }
  .pop-in      { animation:popIn .52s cubic-bezier(.34,1.56,.64,1) both; }
  .fade-up     { animation:fadeUp .5s cubic-bezier(.22,1,.36,1) both; }
  .glow-card   { transition:transform .2s cubic-bezier(.34,1.56,.64,1),box-shadow .2s ease; cursor:pointer; border:none; position:relative; overflow:hidden; }
  .glow-card:hover { transform:translateY(-6px) scale(1.04)!important; box-shadow:0 12px 36px rgba(255,190,30,.45),0 0 0 2px rgba(255,210,60,.5)!important; }
  .glow-card-sel { animation:glowPulse 2s ease-in-out infinite!important; }
  .shimmer-card::after { content:''; position:absolute; inset:0; border-radius:inherit; background:linear-gradient(105deg,transparent 30%,rgba(255,255,220,.7) 50%,transparent 70%); background-size:200% 100%; animation:shimmerAnim 0.6s ease forwards; pointer-events:none; z-index:10; }
  .multi-chip  { transition:all .18s cubic-bezier(.34,1.56,.64,1); cursor:pointer; border:none; position:relative; overflow:hidden; }
  .multi-chip:hover { transform:scale(1.08) translateY(-2px)!important; }
  .check-bounce { animation:bounceIn .3s cubic-bezier(.34,1.56,.64,1) both; }
  .next-btn { transition:all .2s ease; }
  .next-btn:hover { transform:translateY(-3px)!important; box-shadow:0 12px 32px rgba(220,160,20,.55)!important; }
  .back-top:hover { background:rgba(255,200,50,.2)!important; }
  .dash-nav:hover { background:rgba(255,255,255,0.35)!important; }
  .dash-card { transition:all .2s ease; }
  .dash-card:hover { transform:translateY(-2px); }
  .ai-skeleton { animation:aiShimmer 1.4s ease-in-out infinite; background:rgba(0,0,0,0.06); border-radius:10px; }
  .weekly-card { transition:all .22s cubic-bezier(.34,1.56,.64,1); cursor:pointer; }
  .weekly-card:hover { transform:translateY(-4px) scale(1.02); }
  input[type=date] { color-scheme:light; }
  input[type=date]::-webkit-calendar-picker-indicator { cursor:pointer; filter:sepia(1) saturate(3) hue-rotate(10deg); }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:rgba(180,130,0,0.2); border-radius:4px; }
`;

// ── ✅ FIXED: Multi-model OpenRouter AI with fallback ─────────────────────────
const AI_MODELS = [
  "deepseek/deepseek-r1-distill-llama-70b:free",
  "deepseek/deepseek-chat-v3-0324:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "google/gemma-3-4b-it:free",
  "google/gemma-2-9b-it:free",
  "meta-llama/llama-3.2-3b-instruct:free",
];

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function tryAIModel(model, messages, key) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-Title": "HerSpace Period Tracker",
    },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 500 }),
  });
  let data;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok || data?.error) {
    const msg = data?.error?.message || `Model error (HTTP ${res.status || "?"})`;
    const hint =
      res.status === 404
        ? " If you're using free models, check OpenRouter privacy/provider settings (Free model publication) or try a different model."
        : "";
    const err = new Error(`${msg}${hint}`);
    err.is429 = data?.error?.code === 429 || res.status === 429;
    throw err;
  }
  return data?.choices?.[0]?.message?.content || "[]";
}

async function fetchAIRecommendations(trackerData, phase, comparison, ageGroup) {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!key) return null;

  const prevText = comparison
    ? `Previous cycle: regularity=${comparison.previousCycle?.regularity}, cycleLength=${comparison.previousCycle?.cycleLength}, flow=${comparison.previousCycle?.flow}, pain=${comparison.previousCycle?.pain}`
    : "First assessment — no previous cycle data.";

  const messages = [{
    role: "user",
    content: `You are a compassionate PCOD health advisor for a women's wellness app.

A woman with PCOD has tracked her period. Here is her data:
- Age Group: ${ageGroup}
- Current Phase: ${phase}
- Regularity: ${trackerData.regularity}
- Cycle Length: ${trackerData.cycleLength}
- Flow: ${trackerData.flow}
- Spotting: ${trackerData.spotting}
- Skin: ${trackerData.skin}
- Hair: ${trackerData.hair}
- Weight: ${trackerData.weight}
- Sleep: ${trackerData.sleep}
- Ovulation: ${trackerData.ovulation}
- Pain: ${trackerData.pain}
- ${prevText}

Give exactly 4 PCOD-specific health recommendations tailored to her current cycle phase (${phase}). Each should be 1-2 warm, actionable sentences.

Return ONLY a JSON array of 4 strings. No markdown, no extra text.
Example: ["tip1", "tip2", "tip3", "tip4"]`,
  }];

  let lastErr;
  const rateLimited = [];

  for (const model of AI_MODELS) {
    try {
      console.log("🤖 Trying:", model);
      const text  = await tryAIModel(model, messages, key);
      const clean = text.replace(/```json|```/g, "").trim();
      const arr   = JSON.parse(clean);
      if (Array.isArray(arr) && arr.length) {
        console.log("✅ Success with:", model);
        return arr;
      }
    } catch (e) {
      console.warn("⚠️ Failed:", model, e.message);
      lastErr = e;
      if (e.is429) rateLimited.push(model);
    }
  }

  if (rateLimited.length > 0) {
    console.log("⏳ Retrying rate-limited models in 4s…");
    await sleep(4000);
    for (const model of rateLimited) {
      try {
        const text  = await tryAIModel(model, messages, key);
        const clean = text.replace(/```json|```/g, "").trim();
        const arr   = JSON.parse(clean);
        if (Array.isArray(arr) && arr.length) return arr;
      } catch (e) {
        lastErr = e;
      }
    }
  }

  throw lastErr || new Error("All models unavailable");
}

// ════════════════════════════════════════════════════════════════════════════
export default function PeriodTracker({ userData, onBack }) {
  const ageKey    = userData?.ageGroup?.value || userData?.ageGroup || null;

  // ── Block if no age group (About You not completed) ──────────────────────
  if (!ageKey) {
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,rgba(255,245,190,.8),rgba(255,220,100,.6))",padding:"32px 24px",boxSizing:"border-box"}}>
        <div style={{maxWidth:"460px",width:"100%",background:"rgba(255,252,225,.95)",backdropFilter:"blur(32px)",borderRadius:"32px",padding:"48px 36px",textAlign:"center",boxShadow:"0 20px 60px rgba(180,130,0,.25)",border:"1px solid rgba(255,230,80,.4)"}}>
          <div style={{fontSize:"52px",marginBottom:"16px"}}>🌸</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"24px",fontWeight:"900",color:"#3d1a00",margin:"0 0 12px"}}>Complete Your Profile First</h2>
          <p style={{fontSize:"14px",color:"#7a4a10",lineHeight:1.75,margin:"0 0 28px",fontWeight:"500"}}>
            Your age group helps us personalise your PCOD cycle questions. Please complete <strong>About You</strong> before tracking your period. 🌻
          </p>
          <button onClick={onBack} style={{width:"100%",padding:"14px",border:"none",borderRadius:"22px",background:"linear-gradient(135deg,#ffd700,#f5a623)",color:"#5a3000",fontWeight:"900",fontSize:"15px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:"0 6px 22px rgba(220,160,20,.5)"}}>
            ← Go Complete About You
          </button>
        </div>
      </div>
    );
  }

  const aq        = AGE_QS[ageKey] || AGE_QS.young;
  const STEP_META = buildStepMeta(ageKey);
  const weeklyQuestionList = useMemo(
    () => WEEKLY_QUESTIONS_BY_AGE[ageKey] || WEEKLY_QUESTIONS_BY_AGE.young,
    [ageKey]
  );
  const formatDateInput = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };
  const now = new Date();
  const todayStr  = formatDateInput(now);
  const currentMonthStartStr = formatDateInput(
    new Date(now.getFullYear(), now.getMonth(), 1)
  );
  const isLastPeriodAllowed = (dateStr) =>
    !!dateStr && dateStr >= currentMonthStartStr && dateStr <= todayStr;

  const [view,        setView]        = useState("loading");
  const [animDir,     setAnimDir]     = useState("next");
  const [animKey,     setAnimKey]     = useState(0);
  const [step,        setStep]        = useState(1);
  const [shimmer,     setShimmer]     = useState(null);
  const [error,       setError]       = useState("");
  const [saving,      setSaving]      = useState(false);
  const [dashData,    setDashData]    = useState(null);
  const [checkinInfo, setCheckinInfo] = useState(null);
  const [followedRecs, setFollowedRecs] = useState("");

  // ── Weekly check-in state ─────────────────────────────────────────────────
  const [weeklyStep,        setWeeklyStep]        = useState(1); // 1=action rating, 2=mini Qs, 3=submitting
  const [weeklyActionRating, setWeeklyActionRating] = useState("");
  const [weeklyAnswers,     setWeeklyAnswers]     = useState({ regularity:"", acne:"", energy:"", symptoms:"", weight:"" });
  const [weeklyQStep,       setWeeklyQStep]       = useState(0); // 0–4 for 5 mini questions
  const [weeklySubmitting,  setWeeklySubmitting]  = useState(false);
  const [weeklyAnimKey,     setWeeklyAnimKey]     = useState(0);
  const [weeklyAnimDir,     setWeeklyAnimDir]     = useState("next");
  const [weeklyCheckinInfo, setWeeklyCheckinInfo] = useState(null); // stores /me response

  const [form, setForm] = useState({
    lastPeriod:"", regularity:"", cycleLength:"",
    flow:"", spotting:"", skin:"", hair:"",
    weight:"", sleep:"", ovulation:"", pain:"",
    conditions:[],
  });

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${API}/period/me`, { credentials:"include" });
        const data = await res.json();
        if (!data.hasTracker) { setView("intro"); return; }
        setCheckinInfo(data);
        setWeeklyCheckinInfo(data);

        if (data.needsCheckIn || data.needsMonthlyCheckIn) {
          // Monthly reset — full 12 questions
          setView("checkin");
          const c = data.current;
          const existingLastPeriod = c.lastPeriod ? c.lastPeriod.split("T")[0] : "";
          setForm({
            lastPeriod:  isLastPeriodAllowed(existingLastPeriod) ? existingLastPeriod : "",
            regularity:  c.regularity  || "",
            cycleLength: c.cycleLength || "",
            flow:        c.flow        || "",
            spotting:    c.spotting    || "",
            skin:        c.skin        || "",
            hair:        c.hair        || "",
            weight:      c.weight      || "",
            sleep:       c.sleep       || "",
            ovulation:   c.ovulation   || "",
            pain:        c.pain        || "",
            conditions:  c.conditions  || [],
          });
        } else if (data.needsWeeklyCheckIn) {
          // Weekly mini check-in
          setView("weekly");
        } else {
          await loadDashboard();
        }
      } catch { setView("intro"); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboard = async () => {
    try {
      const res  = await fetch(`${API}/period/dashboard`, { credentials:"include" });
      const data = await res.json();
      setDashData(data);
      setView("dashboard");
    } catch { toast.error("Could not load dashboard."); }
  };
  const readApiMessage = async (res, fallback) => {
    try {
      const data = await res.json();
      return data?.message || fallback;
    } catch {
      return fallback;
    }
  };

  const goTo = (s, dir="next") => { setAnimDir(dir); setAnimKey(k=>k+1); setError(""); setStep(s); };

  const MILESTONES = { 3:"Halfway there! 🌻", 6:"You're doing great! ✨", 9:"Almost done! 💛" };

  const pickSingle = (field, val) => {
    setShimmer(val);
    setForm(f => ({ ...f, [field]: val }));
    setError("");
    if (MILESTONES[step]) {
      toast(MILESTONES[step], { position:"top-center", autoClose:1500, icon:false,
        style:{ borderRadius:"16px", background:"linear-gradient(135deg,#ffd700,#f5a623)", color:"#5a3000", fontWeight:"800", fontFamily:"'Nunito',sans-serif", fontSize:"13px" }});
    }
    setTimeout(() => { setShimmer(null); goTo(step+1,"next"); }, 420);
  };

  const toggleMulti = (field, val) => {
    setForm(f => {
      const arr = f[field].includes(val) ? f[field].filter(x=>x!==val) : [...f[field], val];
      return { ...f, [field]: arr };
    });
    setError("");
  };

  const canGoNext = () => {
    if (step === 1) return isLastPeriodAllowed(form.lastPeriod);
    const fieldMap = {
      1:"lastPeriod", 2:"regularity", 3:"cycleLength", 4:"flow",
      5:"spotting", 6:"skin", 7:"hair", 8:"weight", 9:"sleep",
      10:"ovulation", 11:"pain",
    };
    if (step === 12) return true;
    const field = fieldMap[step];
    return field ? !!form[field] : true;
  };

  const handleManualNext = () => {
    if (step === 1 && !isLastPeriodAllowed(form.lastPeriod)) {
      setError("Please select a date from this month up to today 🌸");
      return;
    }
    if (!canGoNext()) { setError("Please select an option to continue 🌸"); return; }
    if (step < 12) goTo(step+1,"next");
  };

  const saveTracker = async (skipConditions = false) => {
    setSaving(true);
    toast("🌻 Setting up your Cycle Dashboard...", {
      position:"top-center", autoClose:2000, icon:false,
      style:{ borderRadius:"16px", background:"linear-gradient(135deg,#ffd700,#f5a623)", color:"#5a3000", fontWeight:"800", fontFamily:"'Nunito',sans-serif" },
    });
    try {
      const saveRes = await fetch(`${API}/period`, {
        method:"POST", credentials:"include",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          ...form,
          conditions: skipConditions ? [] : form.conditions,
          ageGroup: ageKey,
          followedRecommendations: followedRecs || undefined,
        }),
      });
      if (!saveRes.ok) {
        const message = await readApiMessage(saveRes, "Could not save period tracker.");
        throw new Error(message);
      }

      // ── Day 0 fix: auto-generate first action plan immediately after 12Q save ──
      const weeklyRes = await fetch(`${API}/period/weekly`, {
        method:"POST", credentials:"include",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          actionRating: "",
          answers: { regularity:"", acne:"", energy:"", symptoms:"", weight:"" },
        }),
      });
      if (!weeklyRes.ok) {
        const message = await readApiMessage(weeklyRes, "Weekly plan could not be generated right now.");
        toast.warning(message);
      }

      setTimeout(() => { setSaving(false); setView("done"); }, 2400);
    } catch (err) {
      toast.error(err?.message || "Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  // ── Weekly check-in helpers ───────────────────────────────────────────────
  const pickWeeklyAnswer = (questionId, val) => {
    setWeeklyAnswers(prev => ({ ...prev, [questionId]: val }));
    setWeeklyAnimDir("next");
    setWeeklyAnimKey(k => k+1);
    setTimeout(() => {
      if (weeklyQStep < weeklyQuestionList.length - 1) {
        setWeeklyQStep(q => q + 1);
      } else {
        // All 5 answered — submit
        submitWeeklyCheckin({ ...weeklyAnswers, [questionId]: val });
      }
    }, 380);
  };

  const submitWeeklyCheckin = async (finalAnswers) => {
    setWeeklySubmitting(true);
    setWeeklyStep(3);
    try {
      const res = await fetch(`${API}/period/weekly`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionRating: weeklyActionRating,
          answers: finalAnswers || weeklyAnswers,
        }),
      });
      if (!res.ok) throw new Error("Server error");
      toast("🌸 Weekly check-in complete! Your plan is ready.", {
        position:"top-center", autoClose:2500, icon:false,
        style:{ borderRadius:"16px", background:"linear-gradient(135deg,#ffd700,#f5a623)", color:"#5a3000", fontWeight:"800", fontFamily:"'Nunito',sans-serif" },
      });
      setTimeout(() => { setWeeklySubmitting(false); loadDashboard(); }, 2600);
    } catch {
      toast.error("Check-in failed. Please try again.");
      setWeeklySubmitting(false);
      setWeeklyStep(2);
    }
  };

  const progress = Math.round((step / 12) * 100);

  return (
    <div style={S.root}>
      <div style={S.bgImage} />
      <div style={S.bgOverlay} />
      <style>{CSS}</style>
      <ToastContainer />

      {[...Array(12)].map((_,i) => (
        <div key={i} style={{ position:"fixed", pointerEvents:"none", zIndex:2,
          left:`${(i*8.7+3)%96}%`, top:"-50px", fontSize:`${10+(i*3)%14}px`,
          animation:`floatPetal ${8+(i*1.1)%7}s ${(i*0.9)%9}s linear infinite`,
          opacity:0 }}>
          {["🌻","🌼","💛","✨","🌟","⭐"][i%6]}
        </div>
      ))}

      {/* ══ LOADING ══ */}
      {view==="loading" && (
        <div style={{position:"relative",zIndex:3,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:"48px",marginBottom:"12px",animation:"spin 2s linear infinite",display:"inline-block"}}>🌸</div>
            <p style={{color:"#b87000",fontWeight:"700",fontFamily:"'Nunito',sans-serif",fontSize:"15px"}}>Loading your cycle data…</p>
          </div>
        </div>
      )}

      {/* ══ INTRO ══ */}
      {view==="intro" && (
        <div style={S.splitPage}>
          <div className="pop-in" style={S.splitWrap}>
            <div style={S.leftPanel}>
              <span style={S.introBadge}>⏱️ PCOD Cycle Setup · 90 seconds</span>
              <h1 style={S.introTitle}>Begin Your<br/><span style={{color:"#c47d00",fontStyle:"italic"}}>Cycle Journey</span></h1>
              <p style={{fontSize:"14px",color:"#7a4a10",lineHeight:1.75,margin:"0 0 24px"}}>
                12 PCOD-focused questions personalised for your age — smarter cycle predictions start here. 🌻
              </p>
              <div style={{display:"flex",gap:"10px",marginBottom:"28px",flexWrap:"wrap"}}>
                {[{e:"📅",v:"12",l:"Qs"},{e:"⏱️",v:"90s",l:"Quick"},{e:"🔬",v:"",l:"PCOD-Smart"}].map((s,i)=>(
                  <div key={i} style={S.statBox}>
                    <div style={{fontSize:"20px"}}>{s.e}</div>
                    <div style={{fontSize:"15px",fontWeight:"900",color:"#5a3000",fontFamily:"'Nunito',sans-serif"}}>{s.v}</div>
                    <div style={{fontSize:"9px",color:"#c47d00",fontWeight:"800",textTransform:"uppercase",letterSpacing:"0.5px"}}>{s.l}</div>
                  </div>
                ))}
              </div>
              <button className="next-btn" onClick={()=>{ setStep(1); setView("questions"); }} style={S.nextBtn}>✨ Begin My Cycle Tracking</button>
              <button onClick={onBack} style={S.skipBtn}>← Back to Dashboard</button>
            </div>
            <div style={S.rightPanel}>
              <img src={periodGirl} alt="cycle" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top"}}/>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(to right,rgba(255,252,215,0.3) 0%,transparent 25%)",pointerEvents:"none"}}/>
            </div>
          </div>
        </div>
      )}

      {/* ══ CHECK-IN (monthly) ══ */}
      {view==="checkin" && (
        <div style={S.splitPage}>
          <div className="pop-in" style={{...S.splitWrap, maxWidth:"820px"}}>
            <div style={{...S.leftPanel, flex:"1"}}>
              <span style={{...S.introBadge, background:"linear-gradient(135deg,rgba(255,215,0,.3),rgba(245,166,35,.25))"}}>
                🔄 Monthly Check-in · {checkinInfo?.daysSinceUpdate} days since last update
              </span>
              <h1 style={{...S.introTitle, fontSize:"clamp(22px,3.5vw,32px)"}}>
                Time for your<br/><span style={{color:"#c47d00",fontStyle:"italic"}}>Cycle Update 🌸</span>
              </h1>
              {checkinInfo?.current && (
                <div style={{marginBottom:"20px"}}>
                  <div style={{fontSize:"13px",fontWeight:"800",color:"#7a4a10",fontFamily:"'Nunito',sans-serif",marginBottom:"10px"}}>
                    💛 Did you follow last month's recommendations?
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                    {FOLLOWED_OPTS.map(o=>{
                      const isSel = followedRecs === o.label;
                      return (
                        <button key={o.label} onClick={()=>setFollowedRecs(o.label)}
                          style={{display:"flex",alignItems:"center",gap:"8px",padding:"10px 12px",borderRadius:"14px",
                            border:`1.5px solid ${isSel?"rgba(255,200,30,.7)":"rgba(220,170,30,.25)"}`,
                            background:isSel?"linear-gradient(135deg,#ffd700,#f5a623)":"rgba(255,255,255,.65)",
                            cursor:"pointer",fontFamily:"'Nunito',sans-serif",transition:"all .2s"}}>
                          <span style={{fontSize:"16px"}}>{o.emoji}</span>
                          <div style={{textAlign:"left"}}>
                            <div style={{fontSize:"11px",fontWeight:"800",color:isSel?"#5a3000":"#7a4a10"}}>{o.label}</div>
                            <div style={{fontSize:"10px",color:isSel?"#8a5000":"#a07030",fontWeight:"600"}}>{o.sub}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <p style={{fontSize:"13px",color:"#7a4a10",lineHeight:1.75,margin:"0 0 20px"}}>
                Your previous answers are pre-filled — just update what's changed this cycle. 💫
              </p>
              <button className="next-btn" onClick={()=>{ setStep(1); setView("questions"); }} style={S.nextBtn}>
                Start Monthly Check-in 🔄
              </button>
              <button onClick={()=>loadDashboard()} style={S.skipBtn}>View last dashboard instead →</button>
            </div>
            <div style={{flex:"0 0 38%",position:"relative",overflow:"hidden",minHeight:"400px",background:"linear-gradient(135deg,rgba(255,248,195,0.9),rgba(255,220,80,0.7))",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"20px",padding:"40px 20px"}}>
              <div style={{fontSize:"64px"}}>🌙</div>
              <div style={{textAlign:"center"}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:"900",color:"#5a3000",marginBottom:"8px"}}>Your Cycle Awaits</div>
                <div style={{fontSize:"13px",color:"#a07030",fontWeight:"600",lineHeight:1.6}}>Answer 12 quick questions<br/>to see your updated<br/>cycle intelligence</div>
              </div>
              {checkinInfo?.current && (
                <div style={{background:"rgba(255,255,255,0.6)",borderRadius:"16px",padding:"14px 16px",width:"100%",boxSizing:"border-box",border:"1px solid rgba(220,170,30,0.3)"}}>
                  <div style={{fontSize:"10px",fontWeight:"900",color:"#a07030",letterSpacing:"1.5px",fontFamily:"'Nunito',sans-serif",marginBottom:"8px"}}>LAST CYCLE</div>
                  {[
                    {k:"Regularity",   v:checkinInfo.current.regularity},
                    {k:"Cycle Length", v:checkinInfo.current.cycleLength},
                    {k:"Flow",         v:checkinInfo.current.flow},
                    {k:"Pain",         v:checkinInfo.current.pain},
                  ].map((row,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:"11px",fontWeight:"600",color:"#5a3000",marginBottom:"4px",fontFamily:"'Nunito',sans-serif"}}>
                      <span style={{opacity:.6}}>{row.k}</span><span>{row.v||"—"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ WEEKLY CHECK-IN ══ */}
      {view==="weekly" && (
        <div style={S.splitPage}>
          <div className="pop-in" style={{width:"100%",maxWidth:"580px",background:"rgba(255,252,225,.92)",backdropFilter:"blur(32px)",borderRadius:"32px",padding:"32px 28px",boxShadow:"0 20px 60px rgba(180,130,0,.25),0 0 0 1px rgba(255,230,80,.3)",border:"1px solid rgba(255,230,80,.4)"}}>

            {/* Header */}
            <div style={{textAlign:"center",marginBottom:"24px"}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"linear-gradient(135deg,rgba(255,215,0,.3),rgba(245,166,35,.25))",color:"#a06000",fontWeight:"900",fontSize:"11px",padding:"5px 14px",borderRadius:"20px",border:"1px solid rgba(220,170,30,.4)",fontFamily:"'Nunito',sans-serif",marginBottom:"12px",letterSpacing:"1px"}}>
                🔁 WEEKLY CHECK-IN · {weeklyCheckinInfo?.daysSinceWeekly ?? 7} DAYS SINCE LAST
              </div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"24px",fontWeight:"900",color:"#3d1a00",margin:"0 0 6px"}}>
                {weeklyStep===1 ? "How did your week go? 💛" : weeklyStep===3 ? "Generating your plan… 🌸" : `Question ${weeklyQStep+1} of ${weeklyQuestionList.length}`}
              </h2>
              <p style={{fontSize:"13px",color:"rgba(0,0,0,0.45)",margin:0,fontWeight:"500"}}>
                {weeklyStep===1 ? "Rate how you followed your last action plan" : weeklyStep===3 ? "AI is personalising your weekly health plan" : "Quick health check — 5 simple questions"}
              </p>
            </div>

            {/* Progress dots */}
            {weeklyStep===2 && (
              <div style={{display:"flex",gap:"6px",justifyContent:"center",marginBottom:"20px"}}>
                {weeklyQuestionList.map((_,i)=>(
                  <div key={i} style={{width: i===weeklyQStep?"24px":"8px",height:"8px",borderRadius:"4px",background:i<weeklyQStep?"linear-gradient(90deg,#ffd700,#f5a623)":i===weeklyQStep?"linear-gradient(90deg,#ffd700,#f5a623)":"rgba(0,0,0,0.12)",transition:"all .3s ease",boxShadow:i===weeklyQStep?"0 0 8px rgba(255,200,30,.6)":"none"}}/>
                ))}
              </div>
            )}

            {/* Step 1: Action Rating */}
            {weeklyStep===1 && (
              <div className="fade-up">
                {/* Show last plan summary if available */}
                {weeklyCheckinInfo?.latestActionPlan && (
                  <div style={{background:"rgba(255,248,180,0.6)",borderRadius:"16px",padding:"14px 16px",marginBottom:"18px",border:"1px solid rgba(220,170,30,0.25)"}}>
                    <div style={{fontSize:"10px",fontWeight:"900",color:"#a07030",letterSpacing:"1.5px",fontFamily:"'Nunito',sans-serif",marginBottom:"8px"}}>YOUR LAST PLAN INCLUDED</div>
                    {[...(weeklyCheckinInfo.latestActionPlan.diet||[]).slice(0,1), ...(weeklyCheckinInfo.latestActionPlan.movement||[]).slice(0,1), ...(weeklyCheckinInfo.latestActionPlan.selfCare||[]).slice(0,1)].map((tip,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"8px",marginBottom:"5px"}}>
                        <span style={{fontSize:"12px",flexShrink:0,marginTop:"1px"}}>{"🥗🏃🧘"[i]}</span>
                        <span style={{fontSize:"11px",color:"#5a3000",fontWeight:"600",fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>{tip}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{fontSize:"13px",fontWeight:"800",color:"#7a4a10",fontFamily:"'Nunito',sans-serif",marginBottom:"12px"}}>
                  Rate how well you followed it:
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"20px"}}>
                  {ACTION_RATING_OPTS.map(o=>{
                    const isSel = weeklyActionRating===o.rating;
                    return (
                      <button key={o.rating} className="weekly-card"
                        onClick={()=>{
                          setWeeklyActionRating(o.rating);
                          setTimeout(()=>{ setWeeklyStep(2); setWeeklyQStep(0); }, 300);
                        }}
                        style={{display:"flex",alignItems:"center",gap:"14px",padding:"14px 18px",borderRadius:"16px",
                          border:`2px solid ${isSel?"rgba(255,200,30,.7)":"rgba(220,170,30,.25)"}`,
                          background:isSel?"linear-gradient(135deg,#ffd700,#f5a623)":"rgba(255,255,255,.72)",
                          cursor:"pointer",fontFamily:"'Nunito',sans-serif",
                          boxShadow:isSel?"0 6px 20px rgba(255,190,30,.4)":"0 2px 8px rgba(0,0,0,.05)"}}>
                        <span style={{fontSize:"24px"}}>{o.emoji}</span>
                        <div style={{textAlign:"left"}}>
                          <div style={{fontSize:"14px",fontWeight:"900",color:isSel?"#5a3000":"#3d1a00"}}>{o.label}</div>
                          <div style={{fontSize:"11px",color:isSel?"#8a5000":"rgba(0,0,0,.4)",fontWeight:"600"}}>{o.sub}</div>
                        </div>
                        {isSel && <div className="check-bounce" style={{marginLeft:"auto",width:"22px",height:"22px",borderRadius:"50%",background:"rgba(255,255,255,.9)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",color:"#c47d00",fontWeight:"900"}}>✓</div>}
                      </button>
                    );
                  })}
                </div>
                <button onClick={()=>{ setWeeklyActionRating(""); setWeeklyStep(2); setWeeklyQStep(0); }} style={S.skipBtn}>
                  Skip rating → go to check-in questions
                </button>
                <button onClick={()=>loadDashboard()} style={{...S.skipBtn,marginTop:"4px",fontSize:"12px",color:"rgba(0,0,0,.3)"}}>
                  Skip weekly check-in → view dashboard
                </button>
              </div>
            )}

            {/* Step 2: Mini Questions */}
            {weeklyStep===2 && (
              <div key={weeklyAnimKey} className={weeklyAnimDir==="next"?"slide-next":"slide-prev"}>
                {(() => {
                  const q = weeklyQuestionList[weeklyQStep];
                  return (
                    <>
                      <div style={{display:"flex",alignItems:"flex-start",gap:"10px",marginBottom:"14px"}}>
                        <div style={{minWidth:"36px",height:"36px",borderRadius:"12px",background:"linear-gradient(135deg,#ffd700,#f5a623)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:"900",color:"#fff",fontFamily:"'Nunito',sans-serif",flexShrink:0,boxShadow:"0 3px 12px rgba(220,160,20,.45)"}}>
                          {weeklyQStep+1}
                        </div>
                        <div>
                          <div style={{fontFamily:"'Nunito',sans-serif",fontSize:"clamp(14px,2.2vw,16px)",fontWeight:"900",color:"#3d1a00",lineHeight:1.3}}>{q.q}</div>
                          <div style={{display:"inline-flex",alignItems:"center",marginTop:"4px",background:"rgba(255,215,0,.18)",border:"1px solid rgba(220,170,30,.3)",borderRadius:"20px",padding:"2px 9px"}}>
                            <span style={{fontSize:"10px",color:"#9a6200",fontWeight:"800",fontFamily:"'Nunito',sans-serif"}}>{q.hint}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"9px",marginBottom:"16px"}}>
                        {q.opts.map(o=>{
                          const isSel = weeklyAnswers[q.id]===o.label;
                          return (
                            <button key={o.label}
                              className={`glow-card${isSel?" glow-card-sel":""}`}
                              onClick={()=>pickWeeklyAnswer(q.id, o.label)}
                              style={{...S.glowCardBase,
                                background: isSel?"linear-gradient(135deg,#ffd700,#f5a623)":"rgba(255,255,255,0.72)",
                                border:     isSel?"2px solid rgba(255,210,50,.8)":"1.5px solid rgba(220,170,30,.25)",
                                boxShadow:  isSel?"0 0 22px rgba(255,200,40,.7),0 8px 28px rgba(220,160,20,.45)":"0 2px 10px rgba(220,160,20,.12)",
                                transform:  isSel?"scale(1.04)":"scale(1)",
                                padding:"16px 10px",
                              }}>
                              {isSel && <div className="check-bounce" style={{position:"absolute",top:"6px",right:"6px",width:"16px",height:"16px",borderRadius:"50%",background:"rgba(255,255,255,.9)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9px",color:"#c47d00",fontWeight:"900"}}>✓</div>}
                              <div style={{fontSize:"28px",marginBottom:"5px"}}>{o.emoji}</div>
                              <div style={{fontWeight:"800",fontSize:"11px",color:"#5a3000",fontFamily:"'Nunito',sans-serif",lineHeight:1.3}}>{o.label}</div>
                              <div style={{fontSize:"9px",color:"#a07030",marginTop:"2px",fontWeight:"600"}}>{o.sub}</div>
                            </button>
                          );
                        })}
                      </div>
                      {weeklyQStep > 0 && (
                        <button onClick={()=>{ setWeeklyAnimDir("prev"); setWeeklyAnimKey(k=>k+1); setWeeklyQStep(q=>q-1); }} style={S.skipBtn}>
                          ← Previous question
                        </button>
                      )}
                      {weeklyQStep === 0 && (
                        <button onClick={()=>setWeeklyStep(1)} style={S.skipBtn}>← Back to action rating</button>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* Step 3: Submitting / Loading */}
            {weeklyStep===3 && (
              <div className="fade-up" style={{textAlign:"center",padding:"20px 0"}}>
                <div style={{fontSize:"52px",marginBottom:"16px",animation:"spin 2s linear infinite",display:"inline-block"}}>🌸</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:"900",color:"#3d1a00",marginBottom:"10px"}}>
                  Building your personalised plan…
                </div>
                <p style={{fontSize:"13px",color:"rgba(0,0,0,.45)",lineHeight:1.7,margin:"0 0 20px",fontWeight:"500"}}>
                  AI is analysing your check-in, baseline data, and current phase to create your weekly action plan. 💛
                </p>
                <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                  {["🥗 Personalised diet tips","🏃 Movement for your phase","🧘 Self-care guidance"].map((s,i)=>(
                    <div key={i} className="ai-skeleton" style={{height:"40px",display:"flex",alignItems:"center",padding:"0 14px",borderRadius:"12px",background:"rgba(255,215,0,.12)",border:"1px solid rgba(220,170,30,.2)"}}>
                      <span style={{fontSize:"12px",fontWeight:"700",color:"rgba(0,0,0,.3)",fontFamily:"'Nunito',sans-serif",animationDelay:`${i*0.2}s`}}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ══ QUESTIONS ══ */}
      {view==="questions" && (
        <div style={S.stepsPage}>
          <div style={S.stepsCard}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <button className="back-top" onClick={()=>{
                if(step===1){ setView(checkinInfo?.hasTracker?"checkin":"intro"); }
                else { goTo(step-1,"prev"); }
              }} style={S.backBtnTop}>← Prev</button>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:"13px",fontWeight:"900",color:"#b87000",fontFamily:"'Nunito',sans-serif"}}>{step} / 12</div>
                <div style={{fontSize:"10px",color:"#c49030",fontWeight:"700",fontFamily:"'Nunito',sans-serif"}}>{progress}% done</div>
              </div>
              {step < 12 && canGoNext() ? (
                <button className="back-top" onClick={handleManualNext}
                  style={{...S.backBtnTop, background:"linear-gradient(135deg,rgba(255,215,0,.3),rgba(245,166,35,.25))"}}>
                  Next →
                </button>
              ) : (
                <div style={S.badge}>🌻 Period Tracker</div>
              )}
            </div>

            <div style={{height:"6px",background:"rgba(220,170,30,.15)",borderRadius:"10px",marginBottom:"18px",overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:"10px",background:"linear-gradient(90deg,#ffd700,#f5a623,#ffd700)",backgroundSize:"200% 100%",animation:"shimmerAnim 2s linear infinite",width:`${progress}%`,transition:"width .4s ease",boxShadow:"0 0 10px rgba(255,200,30,.6)"}}/>
            </div>

            <div key={animKey} className={animDir==="next"?"slide-next":"slide-prev"}>
              <div style={{display:"flex",alignItems:"flex-start",gap:"10px",marginBottom:"14px"}}>
                <div style={{minWidth:"40px",height:"40px",borderRadius:"14px",background:"linear-gradient(135deg,#ffd700,#f5a623)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:"900",color:"#fff",fontFamily:"'Nunito',sans-serif",flexShrink:0,boxShadow:"0 4px 14px rgba(220,160,20,.45)"}}>
                  {STEP_META[step-1].num}
                </div>
                <div>
                  <div style={{fontFamily:"'Nunito',sans-serif",fontSize:"clamp(14px,2.4vw,17px)",fontWeight:"900",color:"#3d1a00",lineHeight:1.3}}>{STEP_META[step-1].q}</div>
                  <div style={{display:"inline-flex",alignItems:"center",marginTop:"5px",background:"rgba(255,215,0,.18)",border:"1px solid rgba(220,170,30,.3)",borderRadius:"20px",padding:"3px 10px"}}>
                    <span style={{fontSize:"11px",color:"#9a6200",fontWeight:"800",fontFamily:"'Nunito',sans-serif"}}>{STEP_META[step-1].hint}</span>
                  </div>
                </div>
              </div>

              {step===1 && (
                <div style={{marginTop:"8px"}}>
                  <input type="date" value={form.lastPeriod}
                    min={currentMonthStartStr} max={todayStr}
                    onClick={e=>e.target.showPicker?.()}
                    onChange={e=>{
                      const v=e.target.value;
                      if(!v) return;
                      if (v < currentMonthStartStr) {
                        setError("Please select a date from this month 🌸");
                        return;
                      }
                      if (v > todayStr) {
                        setError("Future dates are not allowed for last period 🌸");
                        return;
                      }
                      setForm(f=>({...f,lastPeriod:v}));
                      setError("");
                      setTimeout(()=>goTo(2,"next"),300);
                    }}
                    style={S.dateInput}/>
                  <p style={{fontSize:"11px",color:"#a07030",textAlign:"center",marginTop:"10px",fontWeight:"600"}}>
                    📅 Tap to open calendar · select a date from this month up to today
                  </p>
                  {form.lastPeriod && (
                    <div style={{textAlign:"center",marginTop:"8px",fontSize:"13px",color:"#b87000",fontWeight:"800",fontFamily:"'Nunito',sans-serif"}}>
                      ✅ {new Date(form.lastPeriod+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}
                    </div>
                  )}
                </div>
              )}

              {step===2  && <GlowGrid opts={REGULARITY_OPTS} sel={form.regularity}  shimmer={shimmer} onPick={v=>pickSingle("regularity",v)}  showSub/>}
              {step===3  && <GlowGrid opts={CYCLE_LEN_OPTS}  sel={form.cycleLength} shimmer={shimmer} onPick={v=>pickSingle("cycleLength",v)} showSub/>}
              {step===4  && <GlowGrid opts={FLOW_OPTS}        sel={form.flow}        shimmer={shimmer} onPick={v=>pickSingle("flow",v)}         showSub/>}
              {step===5  && <GlowGrid opts={SPOTTING_OPTS}    sel={form.spotting}    shimmer={shimmer} onPick={v=>pickSingle("spotting",v)}     showSub/>}
              {step===6  && <GlowGrid opts={aq.skin.opts}     sel={form.skin}        shimmer={shimmer} onPick={v=>pickSingle("skin",v)}          showSub/>}
              {step===7  && <GlowGrid opts={aq.hair.opts}     sel={form.hair}        shimmer={shimmer} onPick={v=>pickSingle("hair",v)}          showSub/>}
              {step===8  && <GlowGrid opts={aq.weight.opts}   sel={form.weight}      shimmer={shimmer} onPick={v=>pickSingle("weight",v)}        showSub/>}
              {step===9  && <GlowGrid opts={aq.sleep.opts}    sel={form.sleep}       shimmer={shimmer} onPick={v=>pickSingle("sleep",v)}         showSub/>}
              {step===10 && <GlowGrid opts={OVULATION_OPTS}   sel={form.ovulation}   shimmer={shimmer} onPick={v=>pickSingle("ovulation",v)}    showSub/>}
              {step===11 && <GlowGrid opts={PAIN_OPTS}        sel={form.pain}        shimmer={shimmer} onPick={v=>pickSingle("pain",v)}          showSub/>}

              {step===12 && (
                <>
                  <div style={{display:"inline-flex",alignItems:"center",gap:"6px",background:"rgba(255,215,0,.2)",color:"#b87000",fontSize:"11px",fontWeight:"800",padding:"4px 12px",borderRadius:"20px",fontFamily:"'Nunito',sans-serif",marginBottom:"12px",border:"1px solid rgba(220,170,30,.3)"}}>⭐ Optional</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                    {CONDITION_OPTS.map(o=>{
                      const isSel=form.conditions.includes(o.label);
                      return (
                        <button key={o.label} className="multi-chip" onClick={()=>toggleMulti("conditions",o.label)}
                          style={{...S.chip2, background:isSel?"linear-gradient(135deg,#ffd700,#f5a623)":"rgba(255,255,255,0.72)", border:isSel?"2px solid rgba(255,200,30,.7)":"1.5px solid rgba(220,170,30,.25)", boxShadow:isSel?"0 4px 16px rgba(255,190,20,.5)":"0 2px 8px rgba(220,160,20,.1)"}}>
                          {isSel && <div className="check-bounce" style={{position:"absolute",top:"6px",right:"8px",fontSize:"9px",color:"#5a3000",fontWeight:"900"}}>✓</div>}
                          <div style={{fontSize:"26px",marginBottom:"5px"}}>{o.emoji}</div>
                          <div style={{fontSize:"13px",fontWeight:"800",fontFamily:"'Nunito',sans-serif",color:"#5a3000",lineHeight:1.3,textAlign:"center"}}>{o.label}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:"10px",marginTop:"18px"}}>
                    <button className="next-btn" onClick={()=>saveTracker(false)} disabled={saving} style={S.nextBtn}>
                      {saving ? "Setting up... 🌸" : "Finish Setup 🌻"}
                    </button>
                    <button onClick={()=>saveTracker(true)} style={S.skipBtn}>Skip this step</button>
                  </div>
                </>
              )}

              {error && (
                <div style={{marginTop:"12px",padding:"10px 14px",borderRadius:"12px",background:"rgba(220,60,60,0.08)",border:"1px solid rgba(220,60,60,0.2)",fontSize:"12px",color:"#a32d2d",fontWeight:"700",fontFamily:"'Nunito',sans-serif",textAlign:"center"}}>
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ DONE ══ */}
      {view==="done" && (
        <div style={{position:"relative",zIndex:3,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"32px 24px",boxSizing:"border-box"}}>
          <div className="pop-in" style={{width:"100%",maxWidth:"520px",background:"rgba(255,252,225,.92)",backdropFilter:"blur(32px)",borderRadius:"32px",padding:"48px 40px",boxShadow:"0 20px 60px rgba(180,130,0,.28)",border:"1px solid rgba(255,230,80,.4)",textAlign:"center"}}>
            <div style={{fontSize:"56px",marginBottom:"16px"}}>🎉</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"28px",fontWeight:"900",color:"#3d1a00",margin:"0 0 10px"}}>You're all set!</h2>
            <p style={{fontSize:"15px",color:"#7a4a10",lineHeight:1.75,margin:"0 0 28px",fontWeight:"500"}}>
              Your cycle data is saved. Your personalised <strong>Cycle Dashboard</strong> is ready — let's see what your body is telling you. 🌙
            </p>
            <div style={{display:"flex",flexWrap:"wrap",gap:"8px",justifyContent:"center",marginBottom:"28px"}}>
              {["🩸 Menstrual","🌱 Follicular","🥚 Ovulation","🌙 Luteal"].map((p,i)=>(
                <div key={i} style={{background:"rgba(255,215,0,0.2)",border:"1px solid rgba(220,170,30,0.35)",borderRadius:"20px",padding:"6px 14px",fontSize:"13px",fontWeight:"700",color:"#8a6000",fontFamily:"'Nunito',sans-serif"}}>{p}</div>
              ))}
            </div>
            <button className="next-btn" onClick={loadDashboard} style={{...S.nextBtn,fontSize:"16px",padding:"16px"}}>
              🌙 View My Cycle Dashboard →
            </button>
            <button onClick={onBack} style={{...S.skipBtn,marginTop:"14px"}}>← Back to Dashboard</button>
          </div>
        </div>
      )}

      {/* ══ DASHBOARD ══ */}
      {view==="dashboard" && dashData && (
        <CycleDashboard
          data={dashData}
          onBack={onBack}
          onUpdate={()=>{ setStep(1); setView("questions"); }}
          onWeeklyCheckin={()=>{ setWeeklyStep(1); setWeeklyActionRating(""); setWeeklyAnswers({regularity:"",acne:"",energy:"",symptoms:"",weight:""}); setWeeklyQStep(0); setView("weekly"); }}
          ageKey={ageKey}
          onRefreshCycleData={loadDashboard}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CYCLE DASHBOARD
// ════════════════════════════════════════════════════════════════════════════
const DASH_SECTIONS = [
  { id:"today",      emoji:"🌙", label:"My Cycle Today"  },
  { id:"expect",     emoji:"🔮", label:"What to Expect"  },
  { id:"insights",   emoji:"⚠️", label:"PCOD Insights"   },
  { id:"plan",       emoji:"💡", label:"Weekly Plan"      },
  { id:"tips",       emoji:"🍎", label:"Phase Tips"       },
  { id:"skin",       emoji:"🧴", label:"Skin Connection" },
  { id:"comparison", emoji:"📊", label:"Cycle Progress"  },
];

function CycleDashboard({ data, onBack, onUpdate, onWeeklyCheckin, ageKey, onRefreshCycleData }) {
  const [active, setActive] = useState("today");
  const pc = PHASE_CONFIG[data.phase] || PHASE_CONFIG.Luteal;
  const PHASES = ["Menstrual","Follicular","Ovulation","Luteal"];
  const phaseIdx = PHASES.indexOf(data.phase);

  // Refetch cycle math when user returns to the tab or refocuses — phase/day advance with the calendar
  useEffect(() => {
    if (typeof onRefreshCycleData !== "function") return;
    const run = () => onRefreshCycleData();
    const onVis = () => {
      if (document.visibilityState === "visible") run();
    };
    window.addEventListener("focus", run);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", run);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [onRefreshCycleData]);

  const [aiRecs,    setAiRecs]    = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError,   setAiError]   = useState(false);
  const aiFetched = useRef(false);

  const [skinHistory, setSkinHistory] = useState([]);
  const [skinLoading, setSkinLoading] = useState(false);
  const [skinFetched, setSkinFetched] = useState(false);
  const [skinPattern, setSkinPattern] = useState(null);

  useEffect(() => {
    if (active !== "skin" || skinFetched) return;
    setSkinFetched(true);
    setSkinLoading(true);
    fetch(`${API}/skin/history`, { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        setSkinHistory(d.entries || []);
        setSkinPattern(d.patternInsight || null);
        setSkinLoading(false);
      })
      .catch(() => setSkinLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    if (active !== "insights" || aiFetched.current) return;
    aiFetched.current = true;
    setAiLoading(true);
    fetchAIRecommendations(data.trackerData, data.phase, data.comparison || null, ageKey)
      .then(recs => { if (recs) setAiRecs(recs); else setAiError(true); setAiLoading(false); })
      .catch(() => { setAiError(true); setAiLoading(false); });
  }, [active, data, ageKey]);

  const sections = DASH_SECTIONS.filter(s => {
    if (s.id === "comparison") return !!data.comparison;
    if (s.id === "plan") return true; // always show plan tab
    return true;
  });

  return (
    <div style={{position:"relative",zIndex:3,display:"flex",minHeight:"100vh"}}>

      {/* ── SIDEBAR ── */}
      <div style={{width:"260px",flexShrink:0,position:"sticky",top:0,height:"100vh",
        background:"linear-gradient(180deg,rgba(255,248,195,0.98),rgba(255,228,90,0.92))",
        borderRight:"1.5px solid rgba(220,170,30,0.25)",padding:"20px 16px",
        display:"flex",flexDirection:"column",overflowY:"auto",boxSizing:"border-box"}}>

        <button onClick={onBack} style={{
          width:"100%", padding:"10px", borderRadius:"14px",
          background:"rgba(255,255,255,0.55)", color:"#b87000",
          fontWeight:"800", fontSize:"12px", cursor:"pointer",
          fontFamily:"'Nunito',sans-serif", marginBottom:"14px",
          border:"1px solid rgba(220,170,30,0.3)",
          transition:"all 0.2s"
        }}>
          ← Back to Dashboard
        </button>

        <div style={{textAlign:"center",marginBottom:"16px"}}>
          <div style={{width:"56px",height:"56px",borderRadius:"18px",background:pc.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px",margin:"0 auto 8px",boxShadow:`0 6px 18px ${pc.light}`}}>
            {pc.emoji}
          </div>
          <div style={{fontFamily:"'Playfair Display',serif",fontWeight:"900",fontSize:"16px",color:"#3d1a00",lineHeight:1.2}}>{pc.label}</div>
          <div style={{fontSize:"11px",color:"#a07030",fontWeight:"700",fontFamily:"'Nunito',sans-serif",marginTop:"3px"}}>Day {data.cycleDay} of {data.cycleLengthDays}</div>
          <div style={{marginTop:"8px",padding:"5px 12px",borderRadius:"20px",background:"rgba(255,255,255,0.7)",display:"inline-block",fontSize:"11px",fontWeight:"800",color:"#b87000",fontFamily:"'Nunito',sans-serif",border:"1px solid rgba(220,170,30,0.3)"}}>
            Next period in {data.daysUntilNextPeriod} days
          </div>
        </div>

        <div style={{marginBottom:"14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
            {PHASES.map((p,i)=>(
              <div key={p} style={{textAlign:"center",flex:1}}>
                <div style={{fontSize:"12px",marginBottom:"3px"}}>{PHASE_CONFIG[p].emoji}</div>
                <div style={{height:"4px",borderRadius:"4px",background:i<=phaseIdx?"linear-gradient(90deg,#ffd700,#f5a623)":"rgba(0,0,0,0.08)",transition:"all 0.4s"}}/>
              </div>
            ))}
          </div>
        </div>

        <div style={{height:"1px",background:"linear-gradient(90deg,transparent,rgba(0,0,0,0.1),transparent)",marginBottom:"12px"}}/>

        <div style={{display:"flex",flexDirection:"column",gap:"4px",flex:1}}>
          {sections.map(s=>(
            <button key={s.id} className="dash-nav" onClick={()=>setActive(s.id)} style={{
              display:"flex",alignItems:"center",gap:"10px",width:"100%",padding:"10px 13px",
              borderRadius:"14px",border:"none",cursor:"pointer",fontFamily:"'Nunito',sans-serif",
              fontSize:"13px",fontWeight:active===s.id?"900":"700",textAlign:"left",
              transition:"all 0.18s ease",
              background:active===s.id?"rgba(255,255,255,0.85)":"transparent",
              color:active===s.id?"#b87000":"#6a4500",
              boxShadow:active===s.id?"0 4px 14px rgba(220,160,20,0.2)":"none",
              borderLeft:active===s.id?"3px solid #f5a623":"3px solid transparent",
            }}>
              <span style={{fontSize:"15px"}}>{s.emoji}</span>
              {s.label}
              {s.id==="plan" && data.actionPlan && (
                <span style={{marginLeft:"auto",width:"7px",height:"7px",borderRadius:"50%",background:"#f5a623",flexShrink:0,boxShadow:"0 0 6px rgba(245,166,35,.8)"}}/>
              )}
            </button>
          ))}
        </div>

        <div style={{height:"1px",background:"linear-gradient(90deg,transparent,rgba(0,0,0,0.1),transparent)",margin:"12px 0"}}/>

        {/* Weekly check-in prompt */}
        {data.needsWeeklyCheckIn ? (
          <button onClick={onWeeklyCheckin} className="next-btn" style={{...S.nextBtn,fontSize:"12px",padding:"11px",marginBottom:"8px",background:"linear-gradient(135deg,#7c5cbf,#b565a7)",boxShadow:"0 4px 16px rgba(124,92,191,.4)"}}>
            🔁 Weekly Check-in Ready
          </button>
        ) : data.daysUntilNextWeeklyCheckIn > 0 ? (
          <div style={{padding:"9px 12px",borderRadius:"12px",background:"rgba(255,255,255,0.5)",border:"1px solid rgba(220,170,30,0.25)",marginBottom:"8px",textAlign:"center"}}>
            <div style={{fontSize:"11px",fontWeight:"700",color:"#a07030",fontFamily:"'Nunito',sans-serif"}}>
              Weekly check-in in <strong style={{color:"#b87000"}}>{data.daysUntilNextWeeklyCheckIn} days</strong> 🌸
            </div>
          </div>
        ) : null}

        {data.daysUntilNextCheckIn > 0 && (
          <div style={{padding:"9px 12px",borderRadius:"12px",background:"rgba(255,255,255,0.5)",border:"1px solid rgba(220,170,30,0.25)",marginBottom:"8px",textAlign:"center"}}>
            <div style={{fontSize:"11px",fontWeight:"700",color:"#a07030",fontFamily:"'Nunito',sans-serif"}}>
              Next check-in in <strong style={{color:"#b87000"}}>{data.daysUntilNextCheckIn} days</strong> 🌸
            </div>
          </div>
        )}

      </div>

      {/* ── CONTENT ── */}
      <div key={active} className="pop-in" style={{flex:1,padding:"36px 44px",overflowY:"auto",maxHeight:"100vh",boxSizing:"border-box",background:"rgba(255,252,220,0.5)"}}>

        {active==="today" && (
          <div className="fade-up">
            <SectionTitle emoji="🌙" title="My Cycle Today" sub="Where you are right now in your cycle"/>
            {ageKey === "hormonal" && (
              <p style={{ fontSize:"12px", color:"rgba(90,48,0,0.75)", lineHeight:1.65, margin:"0 0 14px", fontWeight:"600", fontFamily:"'Nunito',sans-serif", maxWidth:"640px" }}>
                In perimenopause, bleeding and timing can vary. The phase below is estimated from your <strong>last logged period</strong> and typical length — update your monthly check-in when your period starts for best accuracy. 🌸
              </p>
            )}
            <div style={{background:pc.grad,borderRadius:"24px",padding:"28px",marginBottom:"18px",position:"relative",overflow:"hidden",boxShadow:`0 12px 40px ${pc.light}`}}>
              <div style={{position:"absolute",top:"-20px",right:"-20px",width:"120px",height:"120px",background:"rgba(255,255,255,0.15)",borderRadius:"50%",filter:"blur(30px)"}}/>
              <div style={{display:"flex",alignItems:"center",gap:"20px",marginBottom:"18px",position:"relative"}}>
                <div style={{fontSize:"48px"}}>{pc.emoji}</div>
                <div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:"24px",fontWeight:"900",color:"#fff",lineHeight:1.1}}>{pc.label}</div>
                  <div style={{fontSize:"13px",color:"rgba(255,255,255,0.85)",fontWeight:"600",marginTop:"3px"}}>Day {data.cycleDay} of {data.cycleLengthDays}-day cycle</div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",position:"relative"}}>
                {[
                  {icon:"📅",label:"Next Period",   val:`In ${data.daysUntilNextPeriod} days`},
                  {icon:"📆",label:"Expected Date", val:new Date(data.nextPeriodDate).toLocaleDateString("en-IN",{day:"numeric",month:"short"})},
                  {icon:"🔄",label:"Cycle Length",  val:`${data.cycleLengthDays} days`},
                  {icon:"📍",label:"Cycle Day",     val:`Day ${data.cycleDay}`},
                ].map((s,i)=>(
                  <div key={i} style={{background:"rgba(255,255,255,0.2)",borderRadius:"12px",padding:"12px 14px",backdropFilter:"blur(10px)"}}>
                    <div style={{fontSize:"16px",marginBottom:"3px"}}>{s.icon}</div>
                    <div style={{fontSize:"10px",color:"rgba(255,255,255,0.75)",fontWeight:"700",fontFamily:"'Nunito',sans-serif",marginBottom:"1px"}}>{s.label}</div>
                    <div style={{fontSize:"15px",fontWeight:"900",color:"#fff",fontFamily:"'Nunito',sans-serif"}}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>
            <GlassCard>
              <div style={{fontSize:"12px",fontWeight:"900",color:"rgba(0,0,0,0.35)",fontFamily:"'Nunito',sans-serif",letterSpacing:"2px",marginBottom:"14px"}}>PHASE TIMELINE</div>
              <div style={{display:"flex",alignItems:"center",gap:"4px"}}>
                {PHASES.map((p,i)=>{
                  const pc2=PHASE_CONFIG[p]; const isActive=p===data.phase; const isPast=PHASES.indexOf(p)<phaseIdx;
                  return (
                    <React.Fragment key={p}>
                      <div style={{flex:1,textAlign:"center"}}>
                        <div style={{fontSize:isActive?"26px":"18px",marginBottom:"5px",transition:"all 0.3s",filter:isActive?`drop-shadow(0 0 8px ${pc2.color})`:"none"}}>{pc2.emoji}</div>
                        <div style={{height:"5px",borderRadius:"5px",background:isPast||isActive?pc2.grad:"rgba(0,0,0,0.07)",boxShadow:isActive?`0 0 10px ${pc2.color}`:"none",marginBottom:"5px",transition:"all 0.3s"}}/>
                        <div style={{fontSize:"9px",fontWeight:isActive?"900":"700",color:isActive?pc2.color:"rgba(0,0,0,0.35)",fontFamily:"'Nunito',sans-serif",lineHeight:1.3}}>{pc2.label.replace(" Phase","")}</div>
                        {isActive && <div style={{fontSize:"8px",color:pc2.color,fontWeight:"800",fontFamily:"'Nunito',sans-serif",marginTop:"2px"}}>← Now</div>}
                      </div>
                      {i<3 && <div style={{fontSize:"9px",color:"rgba(0,0,0,0.2)",flexShrink:0}}>→</div>}
                    </React.Fragment>
                  );
                })}
              </div>
            </GlassCard>
            <GlassCard>
              <div style={{fontSize:"12px",fontWeight:"900",color:"rgba(0,0,0,0.35)",fontFamily:"'Nunito',sans-serif",letterSpacing:"2px",marginBottom:"12px"}}>YOUR CYCLE PROFILE</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                {[
                  {label:"Regularity", val:data.trackerData.regularity},
                  {label:"Flow",       val:data.trackerData.flow},
                  {label:"Spotting",   val:data.trackerData.spotting},
                  {label:"Ovulation",  val:data.trackerData.ovulation},
                  {label:"Pain Level", val:data.trackerData.pain},
                  {label:"Conditions", val:data.trackerData.conditions?.join(", ")||"None noted"},
                ].map((s,i)=>(
                  <div key={i} style={{background:"rgba(255,248,180,0.5)",borderRadius:"10px",padding:"10px 12px",border:"1px solid rgba(220,170,30,0.2)"}}>
                    <div style={{fontSize:"10px",fontWeight:"700",color:"rgba(0,0,0,0.35)",fontFamily:"'Nunito',sans-serif",marginBottom:"3px"}}>{s.label}</div>
                    <div style={{fontSize:"12px",fontWeight:"800",color:"#5a3000",fontFamily:"'Nunito',sans-serif",lineHeight:1.3}}>{s.val||"—"}</div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}

        {active==="expect" && (
          <div className="fade-up">
            <SectionTitle emoji="🔮" title="What to Expect" sub={`How your body typically feels during ${data.phaseTips?.label}`}/>
            <GlassCard>
              <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"18px"}}>
                <div style={{width:"44px",height:"44px",borderRadius:"13px",background:pc.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",flexShrink:0}}>{pc.emoji}</div>
                <div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:"17px",fontWeight:"900",color:"#3d1a00"}}>You may feel…</div>
                  <div style={{fontSize:"11px",color:"rgba(0,0,0,0.4)",fontWeight:"600",fontFamily:"'Nunito',sans-serif"}}>During {data.phaseTips?.label}</div>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"14px"}}>
                {data.phaseTips?.feeling?.map((f,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 13px",background:"rgba(255,248,180,0.6)",borderRadius:"11px",border:"1px solid rgba(220,170,30,0.2)"}}>
                    <div style={{width:"5px",height:"5px",borderRadius:"50%",background:pc.color,flexShrink:0}}/>
                    <span style={{fontSize:"13px",fontWeight:"600",color:"rgba(0,0,0,0.65)",fontFamily:"'DM Sans',sans-serif"}}>{f}</span>
                  </div>
                ))}
              </div>
              <div style={{padding:"12px 16px",borderRadius:"12px",background:`${pc.light}`,border:`1px solid ${pc.color}33`}}>
                <p style={{fontSize:"12.5px",color:pc.color,fontWeight:"700",margin:0,fontStyle:"italic"}}>💛 These feelings are completely normal for this phase.</p>
              </div>
            </GlassCard>
            <div style={{background:pc.grad,borderRadius:"18px",padding:"22px 26px",textAlign:"center",boxShadow:`0 8px 28px ${pc.light}`}}>
              <div style={{fontSize:"28px",marginBottom:"10px"}}>🌸</div>
              <p style={{fontFamily:"'Playfair Display',serif",fontSize:"17px",fontWeight:"700",color:"#fff",margin:0,lineHeight:1.65,fontStyle:"italic"}}>"{data.phaseTips?.affirmation}"</p>
            </div>
          </div>
        )}

        {active==="insights" && (
          <div className="fade-up">
            <SectionTitle emoji="⚠️" title="PCOD Insights" sub="Intelligence layer — what your cycle patterns may indicate"/>
            {data.insights?.length === 0 && (
              <GlassCard>
                <div style={{textAlign:"center",padding:"16px 0"}}>
                  <div style={{fontSize:"36px",marginBottom:"10px"}}>✅</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:"18px",fontWeight:"900",color:"#3d1a00",marginBottom:"6px"}}>No major PCOD signals detected</div>
                  <p style={{fontSize:"13px",color:"rgba(0,0,0,0.5)",lineHeight:1.7,margin:0}}>Keep tracking monthly for better insights.</p>
                </div>
              </GlassCard>
            )}
            {data.insights?.map((ins,i)=>(
              <div key={i} className="dash-card" style={{background:"rgba(255,255,255,0.65)",backdropFilter:"blur(20px)",borderRadius:"16px",padding:"18px 20px",marginBottom:"12px",border:`1px solid ${ins.type==="alert"?"rgba(163,45,45,0.25)":ins.type==="warning"?"rgba(220,120,20,0.25)":"rgba(220,170,30,0.2)"}`,boxShadow:"0 4px 16px rgba(0,0,0,0.06)"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px"}}>
                  <div style={{fontSize:"22px",flexShrink:0,marginTop:"2px"}}>{ins.icon}</div>
                  <div>
                    <div style={{fontSize:"12px",fontWeight:"900",color:ins.type==="alert"?"#a32d2d":ins.type==="warning"?"#c45020":"#8a6000",fontFamily:"'Nunito',sans-serif",marginBottom:"5px",letterSpacing:"0.5px"}}>{ins.title}</div>
                    <p style={{fontSize:"13px",color:"rgba(0,0,0,0.65)",lineHeight:1.7,margin:0,fontFamily:"'DM Sans',sans-serif",fontWeight:"500"}}>{ins.text}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* AI RECOMMENDATIONS */}
            <div style={{background:"rgba(255,255,255,0.72)",backdropFilter:"blur(24px)",borderRadius:"20px",padding:"24px 26px",marginTop:"6px",border:"1px solid rgba(255,255,255,0.88)",boxShadow:"0 6px 24px rgba(0,0,0,0.07)",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:"-20px",right:"-20px",width:"100px",height:"100px",background:"rgba(255,200,50,0.3)",filter:"blur(35px)",borderRadius:"50%",pointerEvents:"none"}}/>
              <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"18px",position:"relative"}}>
                <div style={{width:"38px",height:"38px",borderRadius:"12px",background:"linear-gradient(135deg,#ffd700,#f5a623)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0,boxShadow:"0 4px 14px rgba(220,160,20,0.45)"}}>✨</div>
                <div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:"17px",fontWeight:"900",color:"#3d1a00"}}>AI Wellness Recommendations</div>
                  <div style={{fontSize:"11px",color:"rgba(0,0,0,0.35)",fontWeight:"600",fontFamily:"'Nunito',sans-serif"}}>Personalised by AI · based on your cycle data</div>
                </div>
                <div style={{marginLeft:"auto",padding:"3px 10px",borderRadius:"20px",background:"linear-gradient(135deg,rgba(255,215,0,0.25),rgba(245,166,35,0.2))",border:"1px solid rgba(220,170,30,0.35)",fontSize:"9px",fontWeight:"900",color:"#b87000",fontFamily:"'Nunito',sans-serif",letterSpacing:"1px"}}>AI</div>
              </div>
              {aiLoading && (
                <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                  {[1,2,3,4].map(i=>(
                    <div key={i} className="ai-skeleton" style={{height:"52px",animationDelay:`${i*0.1}s`}}/>
                  ))}
                  <div style={{textAlign:"center",fontSize:"11px",color:"rgba(0,0,0,0.35)",fontFamily:"'Nunito',sans-serif",fontWeight:"700",marginTop:"4px"}}>✨ AI is personalising your advice…</div>
                </div>
              )}
              {aiError && (
                <div style={{background:"rgba(220,170,30,0.1)",borderRadius:"12px",padding:"16px",textAlign:"center"}}>
                  <div style={{fontSize:"22px",marginBottom:"8px"}}>⚠️</div>
                  <p style={{fontSize:"12px",color:"rgba(0,0,0,0.45)",fontWeight:"600",margin:0,fontFamily:"'Nunito',sans-serif"}}>
                    AI advice unavailable. Check your <code>VITE_OPENROUTER_API_KEY</code> in <code>.env</code> and restart.
                  </p>
                </div>
              )}
              {!aiLoading && !aiError && aiRecs.length > 0 && (
                <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                  {aiRecs.map((rec,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"12px",background:"linear-gradient(135deg,rgba(255,248,180,0.7),rgba(255,240,160,0.5))",border:"1px solid rgba(220,170,30,0.25)",borderRadius:"14px",padding:"13px 16px",position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",left:0,top:0,bottom:0,width:"3px",background:"linear-gradient(180deg,#ffd700,#f5a623)",borderRadius:"14px 0 0 14px"}}/>
                      <div style={{width:"26px",height:"26px",borderRadius:"8px",background:"linear-gradient(135deg,#ffd700,#f5a623)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"12px",fontWeight:"900",color:"#5a3000",fontFamily:"'Nunito',sans-serif",boxShadow:"0 2px 8px rgba(220,160,20,0.35)"}}>{i+1}</div>
                      <span style={{fontSize:"13px",fontWeight:"500",color:"rgba(0,0,0,0.65)",lineHeight:1.75,fontFamily:"'DM Sans',sans-serif"}}>{rec}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {data.shouldSeeDoctor && (
              <div style={{background:"linear-gradient(135deg,rgba(163,45,45,0.12),rgba(220,90,48,0.08))",borderRadius:"18px",padding:"22px 24px",border:"1.5px solid rgba(163,45,45,0.3)",boxShadow:"0 6px 24px rgba(163,45,45,0.12)",marginTop:"16px"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px",marginBottom:"16px"}}>
                  <div style={{fontSize:"26px",flexShrink:0}}>🚨</div>
                  <div>
                    <div style={{fontSize:"12px",fontWeight:"900",color:"#a32d2d",fontFamily:"'Nunito',sans-serif",letterSpacing:"1px",marginBottom:"5px"}}>DOCTOR CONSULTATION RECOMMENDED</div>
                    <p style={{fontSize:"13px",color:"rgba(0,0,0,0.65)",lineHeight:1.7,margin:0,fontFamily:"'DM Sans',sans-serif",fontWeight:"500"}}>
                      Based on your cycle patterns — irregular cycles, possible anovulation, or frequent spotting — we strongly recommend consulting a gynecologist.
                    </p>
                  </div>
                </div>
                <div style={{display:"flex",gap:"10px"}}>
                  <button onClick={()=>window.open("https://wa.me/?text=Hi%2C+I+need+help+with+PCOD","_blank")} style={{flex:1,padding:"11px",border:"none",borderRadius:"12px",background:"linear-gradient(135deg,#25D366,#128C7E)",color:"#fff",fontWeight:"800",fontSize:"12px",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>💬 Chat with Expert</button>
                  <button onClick={()=>window.open("https://www.practo.com/","_blank")} style={{flex:1,padding:"11px",border:"none",borderRadius:"12px",background:"linear-gradient(135deg,#a32d2d,#e24b4a)",color:"#fff",fontWeight:"800",fontSize:"12px",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>📅 Book Consultation</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ WEEKLY PLAN TAB ══ */}
        {active==="plan" && (
          <div className="fade-up">
            <SectionTitle emoji="💡" title="Your Weekly Plan" sub="AI-personalised health guidance based on your progress and phase"/>

            {/* No plan yet */}
            {!data.actionPlan && (
              <GlassCard>
                <div style={{textAlign:"center",padding:"20px 0"}}>
                  <div style={{fontSize:"48px",marginBottom:"14px"}}>🌱</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:"900",color:"#3d1a00",marginBottom:"8px"}}>No plan yet</div>
                  <p style={{fontSize:"13px",color:"rgba(0,0,0,0.5)",lineHeight:1.75,margin:"0 0 20px",fontFamily:"'DM Sans',sans-serif"}}>
                    Complete your first weekly check-in to get a personalised diet, movement, and self-care plan from AI.
                  </p>
                  <button className="next-btn" onClick={onWeeklyCheckin} style={{...S.nextBtn,maxWidth:"300px",margin:"0 auto",display:"block",background:"linear-gradient(135deg,#7c5cbf,#b565a7)",boxShadow:"0 6px 22px rgba(124,92,191,.4)"}}>
                    🔁 Start Weekly Check-in
                  </button>
                </div>
              </GlassCard>
            )}

            {data.actionPlan && (
              <>
                {/* Phase insight line */}
                <div style={{background:pc.grad,borderRadius:"18px",padding:"18px 22px",marginBottom:"18px",display:"flex",alignItems:"center",gap:"14px",boxShadow:`0 8px 24px ${pc.light}`}}>
                  <div style={{fontSize:"28px",flexShrink:0}}>{pc.emoji}</div>
                  <div>
                    <div style={{fontSize:"10px",fontWeight:"900",color:"rgba(255,255,255,.75)",fontFamily:"'Nunito',sans-serif",letterSpacing:"2px",marginBottom:"4px"}}>THIS WEEK'S PHASE INSIGHT</div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:"15px",fontWeight:"700",color:"#fff",lineHeight:1.5}}>
                      You are in {pc.label} — {
                        data.phase==="Menstrual"  ? "focus on rest, warmth, and nourishment." :
                        data.phase==="Follicular" ? "rising energy — great time to build new habits." :
                        data.phase==="Ovulation"  ? "peak vitality — lean into intensity and connection." :
                        "slow down, prioritise sleep and gentle movement."
                      }
                    </div>
                  </div>
                </div>

                {/* AI Comparison Insight */}
                {data.actionPlan.comparisonInsight && (
                  <div style={{background:"rgba(255,255,255,0.72)",backdropFilter:"blur(20px)",borderRadius:"16px",padding:"18px 20px",marginBottom:"16px",border:"1px solid rgba(255,255,255,0.88)",boxShadow:"0 4px 16px rgba(0,0,0,0.06)",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",left:0,top:0,bottom:0,width:"4px",background:"linear-gradient(180deg,#7c5cbf,#b565a7)",borderRadius:"16px 0 0 16px"}}/>
                    <div style={{display:"flex",alignItems:"flex-start",gap:"10px",paddingLeft:"6px"}}>
                      <span style={{fontSize:"18px",flexShrink:0}}>🧠</span>
                      <div>
                        <div style={{fontSize:"10px",fontWeight:"900",color:"#7c5cbf",fontFamily:"'Nunito',sans-serif",letterSpacing:"1.5px",marginBottom:"5px"}}>AI PROGRESS INSIGHT</div>
                        <p style={{fontSize:"13px",color:"rgba(0,0,0,0.65)",lineHeight:1.75,margin:0,fontFamily:"'DM Sans',sans-serif",fontWeight:"500",fontStyle:"italic"}}>
                          "{data.actionPlan.comparisonInsight}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Consistency Score */}
                {data.actionPlan.consistencyScore !== undefined && (
                  <div style={{background:"rgba(255,255,255,0.65)",backdropFilter:"blur(20px)",borderRadius:"16px",padding:"18px 22px",marginBottom:"16px",border:"1px solid rgba(255,255,255,0.88)",boxShadow:"0 4px 16px rgba(0,0,0,0.06)"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px"}}>
                      <div>
                        <div style={{fontSize:"11px",fontWeight:"900",color:"rgba(0,0,0,0.35)",fontFamily:"'Nunito',sans-serif",letterSpacing:"1.5px",marginBottom:"3px"}}>🔥 CONSISTENCY SCORE</div>
                        <div style={{fontFamily:"'Nunito',sans-serif",fontSize:"13px",fontWeight:"700",color:"rgba(0,0,0,0.5)"}}>
                          {data.actionPlan.consistencyScore >= 80 ? "Excellent — keep this up! 🌟" :
                           data.actionPlan.consistencyScore >= 50 ? "Good progress — building habits! 💛" :
                           "Every small step counts 🌱"}
                        </div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"28px",fontWeight:"900",color:data.actionPlan.consistencyScore>=80?"#5b9e8a":data.actionPlan.consistencyScore>=50?"#b87000":"#c45e8a",lineHeight:1}}>
                          {data.actionPlan.consistencyScore}%
                        </div>
                      </div>
                    </div>
                    <div style={{height:"8px",background:"rgba(0,0,0,0.08)",borderRadius:"10px",overflow:"hidden"}}>
                      <div style={{height:"100%",borderRadius:"10px",background:data.actionPlan.consistencyScore>=80?"linear-gradient(90deg,#5b9e8a,#7dcbb8)":data.actionPlan.consistencyScore>=50?"linear-gradient(90deg,#ffd700,#f5a623)":"linear-gradient(90deg,#c45e8a,#e88ab8)",width:`${data.actionPlan.consistencyScore}%`,transition:"width 1s ease",boxShadow:"0 0 8px rgba(0,0,0,0.15)"}}/>
                    </div>
                  </div>
                )}

                {/* Weekly Progress Comparison */}
                {data.weeklyCheckin?.answers && (() => {
                  const a = data.weeklyCheckin.answers;
                  const items = [
                    { label:"Cycle", baseline: "Regularity", val: a.regularity, icon:"🌙" },
                    { label:"Energy", baseline: "This week", val: a.energy, icon:"⚡" },
                    { label:"Skin", baseline: "Skin changes", val: a.acne, icon:"✨" },
                    { label:"Bloating", baseline: "Body changes", val: a.weight, icon:"⚖️" },
                  ].filter(x=>x.val);
                  if (!items.length) return null;
                  return (
                    <GlassCard>
                      <div style={{fontSize:"11px",fontWeight:"900",color:"rgba(0,0,0,0.35)",fontFamily:"'Nunito',sans-serif",letterSpacing:"2px",marginBottom:"12px"}}>📊 THIS WEEK'S CHECK-IN SNAPSHOT</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                        {items.map((item,i)=>(
                          <div key={i} style={{background:"rgba(255,248,180,0.5)",borderRadius:"12px",padding:"12px 14px",border:"1px solid rgba(220,170,30,0.2)"}}>
                            <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"4px"}}>
                              <span style={{fontSize:"14px"}}>{item.icon}</span>
                              <span style={{fontSize:"10px",fontWeight:"700",color:"rgba(0,0,0,0.35)",fontFamily:"'Nunito',sans-serif"}}>{item.label}</span>
                            </div>
                            <div style={{fontSize:"11px",fontWeight:"800",color:"#5a3000",fontFamily:"'Nunito',sans-serif",lineHeight:1.3}}>{item.val}</div>
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  );
                })()}

                {/* Plan Sections: Diet / Movement / Self-care */}
                {[
                  { icon:"🥗", label:"Diet",       emoji:"🥗", items: data.actionPlan.diet,     color:"#5b9e8a", bg:"rgba(91,158,138,0.08)", border:"rgba(91,158,138,0.25)"  },
                  { icon:"🏃", label:"Movement",   emoji:"🏃", items: data.actionPlan.movement,  color:"#b87000", bg:"rgba(184,112,0,0.08)",  border:"rgba(184,112,0,0.25)"   },
                  { icon:"🧘", label:"Self-Care",  emoji:"🧘", items: data.actionPlan.selfCare,  color:"#b565a7", bg:"rgba(181,101,167,0.08)",border:"rgba(181,101,167,0.25)" },
                ].map((section,si)=>(
                  <div key={si} style={{background:"rgba(255,255,255,0.65)",backdropFilter:"blur(20px)",borderRadius:"18px",padding:"20px 22px",marginBottom:"14px",border:"1px solid rgba(255,255,255,0.88)",boxShadow:"0 6px 24px rgba(0,0,0,0.06)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px"}}>
                      <div style={{width:"40px",height:"40px",borderRadius:"12px",background:section.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",border:`1px solid ${section.border}`,flexShrink:0}}>
                        {section.emoji}
                      </div>
                      <div>
                        <div style={{fontSize:"14px",fontWeight:"900",color:section.color,fontFamily:"'Nunito',sans-serif"}}>{section.label}</div>
                        <div style={{fontSize:"10px",color:"rgba(0,0,0,0.35)",fontWeight:"600",fontFamily:"'Nunito',sans-serif"}}>AI-personalised for your phase</div>
                      </div>
                      <div style={{marginLeft:"auto",padding:"3px 8px",borderRadius:"20px",background:section.bg,border:`1px solid ${section.border}`,fontSize:"9px",fontWeight:"900",color:section.color,fontFamily:"'Nunito',sans-serif",letterSpacing:"0.5px"}}>
                        {(section.items||[]).length} tips
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                      {(section.items||[]).map((tip,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"12px",padding:"12px 14px",background:section.bg,borderRadius:"12px",border:`1px solid ${section.border}`,position:"relative",overflow:"hidden"}}>
                          <div style={{position:"absolute",left:0,top:0,bottom:0,width:"3px",background:`linear-gradient(180deg,${section.color},${section.color}88)`,borderRadius:"12px 0 0 12px"}}/>
                          <div style={{width:"22px",height:"22px",borderRadius:"7px",background:section.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"10px",fontWeight:"900",color:"#fff",fontFamily:"'Nunito',sans-serif",marginTop:"1px"}}>
                            {i+1}
                          </div>
                          <span style={{fontSize:"13px",fontWeight:"500",color:"rgba(0,0,0,0.65)",lineHeight:1.7,fontFamily:"'DM Sans',sans-serif"}}>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Generated at + next check-in nudge */}
                <div style={{textAlign:"center",padding:"12px",marginBottom:"16px"}}>
                  <div style={{fontSize:"11px",color:"rgba(0,0,0,0.3)",fontWeight:"600",fontFamily:"'Nunito',sans-serif"}}>
                    Plan generated {data.actionPlan.generatedAt ? new Date(data.actionPlan.generatedAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"}) : "recently"} · updates weekly 🌸
                  </div>
                </div>

                {/* Next check-in CTA */}
                {data.needsWeeklyCheckIn ? (
                  <div style={{background:"linear-gradient(135deg,rgba(124,92,191,0.15),rgba(181,101,167,0.1))",borderRadius:"18px",padding:"20px 24px",border:"1.5px solid rgba(124,92,191,0.3)",textAlign:"center"}}>
                    <div style={{fontSize:"28px",marginBottom:"10px"}}>🔁</div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:"18px",fontWeight:"900",color:"#3d1a00",marginBottom:"6px"}}>New week, new check-in ready!</div>
                    <p style={{fontSize:"13px",color:"rgba(0,0,0,0.5)",lineHeight:1.7,margin:"0 0 16px"}}>Complete this week's check-in to update your plan with fresh AI insights.</p>
                    <button className="next-btn" onClick={onWeeklyCheckin} style={{...S.nextBtn,maxWidth:"260px",margin:"0 auto",display:"block",background:"linear-gradient(135deg,#7c5cbf,#b565a7)",boxShadow:"0 6px 22px rgba(124,92,191,.4)"}}>
                      🌸 Start Weekly Check-in
                    </button>
                  </div>
                ) : (
                  <div style={{background:"rgba(255,248,180,0.5)",borderRadius:"14px",padding:"14px 18px",border:"1px solid rgba(220,170,30,0.2)",textAlign:"center"}}>
                    <div style={{fontSize:"12px",fontWeight:"700",color:"#a07030",fontFamily:"'Nunito',sans-serif"}}>
                      Next check-in in <strong style={{color:"#b87000"}}>{data.daysUntilNextWeeklyCheckIn} days</strong> — keep following the plan! 💛
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {active==="tips" && (
          <div className="fade-up">
            <SectionTitle emoji="🍎" title="Phase Tips" sub={`Personalised guidance for your ${data.phaseTips?.label}`}/>
            {[
              { icon:"🥗", label:"Nutrition", items:data.phaseTips?.nutrition, color:"#5b9e8a" },
              { icon:"💪", label:"Movement",  items:data.phaseTips?.movement,  color:"#b87000" },
              { icon:"💆‍♀️",label:"Self-Care", items:data.phaseTips?.selfCare,  color:"#b565a7" },
            ].map((section,si)=>(
              <GlassCard key={si}>
                <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px"}}>
                  <div style={{width:"38px",height:"38px",borderRadius:"11px",background:`${section.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",border:`1px solid ${section.color}33`}}>{section.icon}</div>
                  <div style={{fontSize:"13px",fontWeight:"900",color:section.color,fontFamily:"'Nunito',sans-serif",letterSpacing:"0.5px"}}>{section.label}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                  {section.items?.map((tip,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"10px",padding:"10px 13px",background:"rgba(255,248,180,0.5)",borderRadius:"11px",border:"1px solid rgba(220,170,30,0.18)"}}>
                      <div style={{width:"18px",height:"18px",borderRadius:"50%",background:"linear-gradient(135deg,#ffd700,#f5a623)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9px",fontWeight:"900",color:"#5a3000",flexShrink:0,marginTop:"1px"}}>{i+1}</div>
                      <span style={{fontSize:"12.5px",fontWeight:"500",color:"rgba(0,0,0,0.65)",fontFamily:"'DM Sans',sans-serif",lineHeight:1.6}}>{tip}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {active==="skin" && (
          <div className="fade-up">
            <SectionTitle emoji="🧴" title="Skin Connection" sub="How your cycle phase affects your skin & hormones"/>
            <GlassCard>
              <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"16px"}}>
                <div style={{width:"42px",height:"42px",borderRadius:"13px",background:pc.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0}}>{pc.emoji}</div>
                <div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:"17px",fontWeight:"900",color:"#3d1a00"}}>Skin during {pc.label}</div>
                  <div style={{fontSize:"11px",color:"rgba(0,0,0,0.4)",fontWeight:"600",fontFamily:"'Nunito',sans-serif"}}>What to expect this phase</div>
                </div>
              </div>
              {data.phase==="Menstrual"  && ["Skin may feel more sensitive and reactive 🌸","Sebum production lower — skin can feel dry","Avoid harsh exfoliants or actives this week","Gentle hydrating cleanser + moisturiser 💧"].map((t,i)=><TipRow key={i} text={t}/>)}
              {data.phase==="Follicular" && ["Rising estrogen = glowing, clearer skin 🌱","Great time to introduce new skincare products","Vitamin C serums work best during this phase ✨","Skin barrier is stronger — try actives now"].map((t,i)=><TipRow key={i} text={t}/>)}
              {data.phase==="Ovulation"  && ["Peak estrogen = your best skin day 🥚","Natural glow is at its highest — enjoy it!","Pores may appear smaller than usual","Use SPF — skin is more reactive to sun now ☀️"].map((t,i)=><TipRow key={i} text={t}/>)}
              {data.phase==="Luteal"     && ["Progesterone rises → sebum production increases 🌙","Hormonal acne most likely now (jaw/chin)","Avoid heavy makeup — skin needs to breathe","Spearmint tea may help reduce androgen breakouts 🍵"].map((t,i)=><TipRow key={i} text={t}/>)}
            </GlassCard>
            {skinLoading && (
              <GlassCard>
                <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                  <div style={{width:"60px",height:"60px",borderRadius:"12px",background:"rgba(0,0,0,0.05)",animation:"aiShimmer 1.4s ease-in-out infinite",flexShrink:0}}/>
                  <div style={{flex:1,display:"flex",flexDirection:"column",gap:"8px"}}>
                    <div style={{height:"14px",borderRadius:"6px",background:"rgba(0,0,0,0.05)",animation:"aiShimmer 1.4s ease-in-out infinite",width:"60%"}}/>
                    <div style={{height:"12px",borderRadius:"6px",background:"rgba(0,0,0,0.05)",animation:"aiShimmer 1.4s ease-in-out infinite",width:"80%"}}/>
                  </div>
                </div>
              </GlassCard>
            )}
            {!skinLoading && skinHistory.length > 0 && (() => {
              const latest = skinHistory[0];
              const samePhase = latest.cyclePhase === data.phase;
              const contextualNote = latest.cyclePhase
                ? `During your ${latest.cyclePhase} phase, ${latest.aiNote}`
                : latest.aiNote;
              const daysAgo = latest.createdAt
                ? Math.floor((Date.now() - new Date(latest.createdAt).getTime()) / 86400000)
                : null;
              return (
                <GlassCard>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px"}}>
                    <div style={{fontSize:"11px",fontWeight:"900",color:"#b87000",fontFamily:"'Nunito',sans-serif",letterSpacing:"1.5px"}}>📸 BASED ON YOUR RECENT SKIN SCAN</div>
                    <div style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"3px 10px",borderRadius:"20px",background:"rgba(91,158,138,0.1)",border:"1px solid rgba(91,158,138,0.25)"}}>
                      <span style={{fontSize:"10px"}}>🌸</span>
                      <span style={{fontSize:"10px",fontWeight:"800",color:"#3a7a60",fontFamily:"'Nunito',sans-serif"}}>Synced with your cycle</span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:"16px",alignItems:"flex-start",marginBottom:"16px"}}>
                    <div style={{width:"80px",height:"80px",borderRadius:"14px",overflow:"hidden",flexShrink:0,border:"2px solid rgba(220,170,30,0.3)",boxShadow:"0 4px 14px rgba(0,0,0,0.1)"}}>
                      <img src={latest.imageUrl} alt="skin scan"
                        style={{width:"100%",height:"100%",objectFit:"cover"}}
                        onError={e=>{ e.target.style.display="none"; e.target.parentNode.innerHTML="<div style=\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:28px;background:rgba(255,215,0,0.15)\'>🧴</div>"; }}
                      />
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:"15px",fontWeight:"900",color:"#3d1a00",fontFamily:"'Nunito',sans-serif",marginBottom:"4px"}}>{latest.condition || "Skin Analyzed"}</div>
                      <div style={{fontSize:"11px",color:"rgba(0,0,0,0.4)",fontWeight:"600",fontFamily:"'Nunito',sans-serif",marginBottom:"8px"}}>
                        {daysAgo === 0 ? "Scanned today" : daysAgo === 1 ? "Last scan: 1 day ago" : daysAgo !== null ? `Last scan: ${daysAgo} days ago` : "Recently scanned"}
                      </div>
                      {latest.cyclePhase && (
                        <div style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"4px 10px",borderRadius:"20px",
                          background:samePhase?"linear-gradient(135deg,rgba(255,215,0,0.3),rgba(245,166,35,0.2))":"rgba(0,0,0,0.05)",
                          border:`1px solid ${samePhase?"rgba(220,170,30,0.4)":"rgba(0,0,0,0.1)"}`,
                          fontSize:"11px",fontWeight:"800",
                          color:samePhase?"#b87000":"rgba(0,0,0,0.4)",
                          fontFamily:"'Nunito',sans-serif"}}>
                          {PHASE_CONFIG[latest.cyclePhase]?.emoji || "🌸"} {latest.cyclePhase} Phase
                          {samePhase && " · Same as now ✨"}
                        </div>
                      )}
                    </div>
                  </div>
                  {latest.aiNote && (
                    <div style={{padding:"14px 16px",borderRadius:"14px",background:"linear-gradient(135deg,rgba(255,248,180,0.7),rgba(255,240,160,0.5))",border:"1px solid rgba(220,170,30,0.25)",marginBottom:"14px",position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",left:0,top:0,bottom:0,width:"3px",background:"linear-gradient(180deg,#ffd700,#f5a623)",borderRadius:"3px 0 0 3px"}}/>
                      <div style={{fontSize:"10px",fontWeight:"900",color:"#b87000",fontFamily:"'Nunito',sans-serif",letterSpacing:"1px",marginBottom:"6px"}}>✨ AI INSIGHT FROM YOUR SCAN</div>
                      <p style={{fontSize:"13px",color:"rgba(0,0,0,0.65)",lineHeight:1.7,margin:0,fontFamily:"'DM Sans',sans-serif",fontWeight:"500"}}>{contextualNote}</p>
                    </div>
                  )}
                  {samePhase && latest.condition && (
                    <div style={{padding:"12px 16px",borderRadius:"12px",background:`${pc.light}`,border:`1px solid ${pc.color}33`,marginBottom:"14px"}}>
                      <p style={{fontSize:"12.5px",color:pc.color,fontWeight:"700",margin:0,fontStyle:"italic",fontFamily:"'DM Sans',sans-serif"}}>
                        🧴 Your scan was taken during the same cycle phase — this gives us a direct hormone-skin connection for your profile.
                      </p>
                    </div>
                  )}
                  {skinPattern?.detected && (
                    <div style={{padding:"14px 16px",borderRadius:"14px",background:"rgba(255,215,0,0.15)",border:"1px solid rgba(220,170,30,0.3)"}}>
                      <div style={{fontSize:"10px",fontWeight:"900",color:"#b87000",fontFamily:"'Nunito',sans-serif",letterSpacing:"1px",marginBottom:"6px"}}>
                        📊 PATTERN DETECTED ACROSS {skinHistory.length} SCANS
                      </div>
                      <p style={{fontSize:"13px",color:"rgba(0,0,0,0.65)",lineHeight:1.7,margin:"0 0 8px",fontFamily:"'DM Sans',sans-serif",fontWeight:"500"}}>{skinPattern.message}</p>
                      {skinPattern.tip && (
                        <p style={{fontSize:"12px",color:"rgba(0,0,0,0.5)",lineHeight:1.6,margin:0,fontFamily:"'DM Sans',sans-serif",fontStyle:"italic"}}>💡 {skinPattern.tip}</p>
                      )}
                    </div>
                  )}
                </GlassCard>
              );
            })()}
            {!skinLoading && skinHistory.length === 0 && (
              <div style={{background:"linear-gradient(135deg,rgba(255,215,0,0.2),rgba(245,166,35,0.15))",borderRadius:"18px",padding:"24px",border:"1.5px solid rgba(220,170,30,0.35)",textAlign:"center"}}>
                <div style={{fontSize:"40px",marginBottom:"12px"}}>🔬</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"18px",fontWeight:"900",color:"#3d1a00",marginBottom:"8px"}}>No Skin Scan Yet</div>
                <p style={{fontSize:"13px",color:"rgba(0,0,0,0.55)",lineHeight:1.7,margin:"0 0 16px",maxWidth:"320px",marginLeft:"auto",marginRight:"auto"}}>
                  Analyze your skin with our <strong>AI Skin Analyzer</strong> to see exactly how your cycle phase affects your skin — with real data, not just tips.
                </p>
                <div style={{display:"flex",flexWrap:"wrap",gap:"8px",justifyContent:"center",marginBottom:"16px"}}>
                  {["🧴 Skin history","📅 Cycle correlation","🔬 Hormonal pattern","✨ AI analysis"].map((t,i)=>(
                    <div key={i} style={{background:"rgba(255,215,0,0.25)",border:"1px solid rgba(220,170,30,0.35)",borderRadius:"20px",padding:"4px 12px",fontSize:"11px",fontWeight:"700",color:"#8a6000",fontFamily:"'Nunito',sans-serif"}}>{t}</div>
                  ))}
                </div>
                <button onClick={onBack} style={{padding:"12px 28px",border:"none",borderRadius:"16px",background:"linear-gradient(135deg,#ffd700,#f5a623)",color:"#5a3000",fontWeight:"900",fontSize:"13px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:"0 6px 20px rgba(220,160,20,0.4)"}}>
                  🔬 Go to Skin Analyzer
                </button>
                <p style={{fontSize:"11px",color:"rgba(0,0,0,0.3)",margin:"12px 0 0",fontStyle:"italic"}}>Dashboard → Skin Analyzer 🌸</p>
              </div>
            )}
          </div>
        )}

        {active==="comparison" && data.comparison && (
          <div className="fade-up">
            <SectionTitle emoji="📊" title="Cycle Progress" sub="Comparing this month with your previous cycle"/>
            <div style={{background:data.comparison.hasImprovement?"linear-gradient(135deg,rgba(91,158,138,0.18),rgba(74,143,168,0.12))":"linear-gradient(135deg,rgba(186,117,23,0.14),rgba(220,90,48,0.08))",borderRadius:"18px",padding:"20px 24px",marginBottom:"18px",border:`1.5px solid ${data.comparison.hasImprovement?"rgba(91,158,138,0.35)":"rgba(186,117,23,0.35)"}`,textAlign:"center"}}>
              <div style={{fontSize:"32px",marginBottom:"8px"}}>{data.comparison.hasImprovement?"✅":"💛"}</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"18px",fontWeight:"900",color:"#3d1a00",marginBottom:"5px"}}>{data.comparison.overallMessage}</div>
              <div style={{fontSize:"12px",color:"rgba(0,0,0,0.4)",fontWeight:"600",fontFamily:"'Nunito',sans-serif"}}>
                Previous cycle recorded {new Date(data.comparison.previousCycle.savedAt).toLocaleDateString("en-IN",{day:"numeric",month:"long"})}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px",marginBottom:"18px"}}>
              {[
                {label:"Last Month",data:data.comparison.previousCycle,color:"rgba(0,0,0,0.4)",bg:"rgba(255,255,255,0.5)",badge:"Previous"},
                {label:"This Month",data:data.comparison.currentCycle, color:"#b87000",          bg:"rgba(255,248,180,0.7)",badge:"Current ✨"},
              ].map((col,ci)=>(
                <div key={ci} style={{background:col.bg,borderRadius:"16px",padding:"18px",border:"1px solid rgba(220,170,30,0.25)"}}>
                  <div style={{fontSize:"9px",fontWeight:"900",color:col.color,fontFamily:"'Nunito',sans-serif",letterSpacing:"1.5px",marginBottom:"12px"}}>{col.badge}</div>
                  {[
                    {k:"Regularity",  v:col.data.regularity},
                    {k:"Cycle Length",v:col.data.cycleLength},
                    {k:"Flow",        v:col.data.flow},
                    {k:"Spotting",    v:col.data.spotting},
                    {k:"Pain",        v:col.data.pain},
                  ].map((row,ri)=>(
                    <div key={ri} style={{marginBottom:"8px"}}>
                      <div style={{fontSize:"9px",color:"rgba(0,0,0,0.35)",fontWeight:"700",fontFamily:"'Nunito',sans-serif",marginBottom:"1px"}}>{row.k}</div>
                      <div style={{fontSize:"11px",fontWeight:"800",color:"#5a3000",fontFamily:"'Nunito',sans-serif"}}>{row.v||"—"}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {data.comparison.improvements.length > 0 && (
              <GlassCard>
                <div style={{fontSize:"11px",fontWeight:"900",color:"#5b9e8a",fontFamily:"'Nunito',sans-serif",letterSpacing:"1.5px",marginBottom:"10px"}}>✅ IMPROVEMENTS</div>
                {data.comparison.improvements.map((imp,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"10px",padding:"10px 13px",background:"rgba(91,158,138,0.08)",borderRadius:"11px",border:"1px solid rgba(91,158,138,0.2)",marginBottom:"8px"}}>
                    <span style={{fontSize:"14px",flexShrink:0}}>🌱</span>
                    <span style={{fontSize:"13px",fontWeight:"600",color:"rgba(0,0,0,0.65)",fontFamily:"'DM Sans',sans-serif",lineHeight:1.6}}>{imp}</span>
                  </div>
                ))}
              </GlassCard>
            )}
            {data.comparison.regressions.length > 0 && (
              <GlassCard>
                <div style={{fontSize:"11px",fontWeight:"900",color:"#c45020",fontFamily:"'Nunito',sans-serif",letterSpacing:"1.5px",marginBottom:"10px"}}>📊 CHANGES TO WATCH</div>
                {data.comparison.regressions.map((reg,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"10px",padding:"10px 13px",background:"rgba(216,90,48,0.07)",borderRadius:"11px",border:"1px solid rgba(216,90,48,0.2)",marginBottom:"8px"}}>
                    <span style={{fontSize:"14px",flexShrink:0}}>🌀</span>
                    <span style={{fontSize:"13px",fontWeight:"600",color:"rgba(0,0,0,0.65)",fontFamily:"'DM Sans',sans-serif",lineHeight:1.6}}>{reg}</span>
                  </div>
                ))}
              </GlassCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ emoji, title, sub }) {
  return (
    <div style={{marginBottom:"22px"}}>
      <div style={{fontSize:"10px",fontWeight:"900",color:"rgba(0,0,0,0.28)",fontFamily:"'Nunito',sans-serif",letterSpacing:"3px",marginBottom:"6px"}}>CYCLE INTELLIGENCE</div>
      <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(22px,3vw,30px)",fontWeight:"900",color:"#1a1a2e",margin:"0 0 5px",lineHeight:1.2}}>{emoji} {title}</h1>
      <p style={{fontSize:"13px",color:"rgba(0,0,0,0.45)",margin:0,fontWeight:"500"}}>{sub}</p>
    </div>
  );
}

function GlassCard({ children }) {
  return (
    <div style={{background:"rgba(255,255,255,0.65)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderRadius:"18px",padding:"20px 22px",border:"1px solid rgba(255,255,255,0.88)",boxShadow:"0 6px 24px rgba(0,0,0,0.06)",marginBottom:"14px"}}>
      {children}
    </div>
  );
}

function TipRow({ text }) {
  return (
    <div style={{display:"flex",alignItems:"flex-start",gap:"9px",padding:"10px 13px",background:"rgba(255,248,180,0.5)",borderRadius:"11px",border:"1px solid rgba(220,170,30,0.18)",marginBottom:"8px"}}>
      <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#f5a623",flexShrink:0,marginTop:"6px"}}/>
      <span style={{fontSize:"13px",fontWeight:"500",color:"rgba(0,0,0,0.65)",fontFamily:"'DM Sans',sans-serif",lineHeight:1.6}}>{text}</span>
    </div>
  );
}

function GlowGrid({ opts, sel, onPick, shimmer, showSub=false }) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginTop:"8px"}}>
      {opts.map(o=>{
        const isSelected=sel===o.label; const isShimmer=shimmer===o.label;
        return (
          <button key={o.label}
            className={`glow-card${isSelected?" glow-card-sel":""}${isShimmer?" shimmer-card":""}`}
            onClick={()=>onPick(o.label)}
            style={{...S.glowCardBase,
              background:  isSelected?"linear-gradient(135deg,#ffd700,#f5a623)":"rgba(255,255,255,0.72)",
              border:      isSelected?"2px solid rgba(255,210,50,.8)":"1.5px solid rgba(220,170,30,.25)",
              boxShadow:   isSelected?"0 0 22px rgba(255,200,40,.7),0 8px 28px rgba(220,160,20,.45)":"0 2px 10px rgba(220,160,20,.12)",
              transform:   isSelected?"scale(1.04)":"scale(1)",
            }}>
            {isSelected && <div className="check-bounce" style={{position:"absolute",top:"8px",right:"8px",width:"18px",height:"18px",borderRadius:"50%",background:"rgba(255,255,255,.9)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",color:"#c47d00",fontWeight:"900"}}>✓</div>}
            <div style={{fontSize:"32px",marginBottom:"7px"}}>{o.emoji}</div>
            <div style={{fontWeight:"800",fontSize:"13px",color:"#5a3000",fontFamily:"'Nunito',sans-serif",lineHeight:1.3}}>{o.label}</div>
            {showSub && o.sub && <div style={{fontSize:"10px",color:"#a07030",marginTop:"3px",fontWeight:"600"}}>{o.sub}</div>}
          </button>
        );
      })}
    </div>
  );
}

const S = {
  root:        { minHeight:"100vh",fontFamily:"'DM Sans',sans-serif",position:"relative",overflow:"hidden" },
  bgImage:     { position:"fixed",inset:0,zIndex:0,backgroundImage:`url(${periodBg})`,backgroundSize:"cover",backgroundPosition:"center",filter:"blur(12px) brightness(0.78) saturate(1.1)",transform:"scale(1.1)",pointerEvents:"none" },
  bgOverlay:   { position:"fixed",inset:0,zIndex:1,background:"linear-gradient(160deg,rgba(255,245,190,.45) 0%,rgba(255,220,100,.3) 50%,rgba(255,200,80,.38) 100%)",pointerEvents:"none" },
  splitPage:   { position:"relative",zIndex:3,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"32px 24px",boxSizing:"border-box" },
  splitWrap:   { display:"flex",width:"100%",maxWidth:"900px",minHeight:"520px",borderRadius:"32px",overflow:"hidden",boxShadow:"0 24px 64px rgba(160,110,0,.3),0 0 0 1px rgba(255,220,60,.35)" },
  leftPanel:   { flex:"0 0 52%",background:"rgba(255,252,215,.92)",backdropFilter:"blur(32px)",WebkitBackdropFilter:"blur(32px)",padding:"44px 36px",display:"flex",flexDirection:"column",justifyContent:"center" },
  rightPanel:  { flex:"0 0 48%",position:"relative",overflow:"hidden",minHeight:"480px" },
  stepsPage:   { position:"relative",zIndex:3,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"32px 20px",boxSizing:"border-box" },
  stepsCard:   { width:"100%",maxWidth:"580px",background:"rgba(255,252,225,.88)",backdropFilter:"blur(32px)",WebkitBackdropFilter:"blur(32px)",borderRadius:"32px",padding:"26px",boxShadow:"0 20px 60px rgba(180,130,0,.25),0 0 0 1px rgba(255,230,80,.3)",border:"1px solid rgba(255,230,80,.4)" },
  badge:       { display:"inline-block",background:"linear-gradient(135deg,rgba(255,215,0,.25),rgba(245,166,35,.2))",color:"#b87000",fontWeight:"800",fontSize:"11px",padding:"4px 12px",borderRadius:"20px",border:"1px solid rgba(220,170,30,.35)",fontFamily:"'Nunito',sans-serif" },
  introBadge:  { display:"inline-block",background:"linear-gradient(135deg,rgba(255,215,0,.3),rgba(245,166,35,.25))",color:"#a06000",fontWeight:"800",fontSize:"12px",padding:"5px 14px",borderRadius:"20px",border:"1px solid rgba(220,170,30,.4)",fontFamily:"'Nunito',sans-serif",marginBottom:"14px" },
  introTitle:  { fontFamily:"'Playfair Display',serif",fontSize:"clamp(28px,4vw,40px)",fontWeight:"900",color:"#3d1a00",margin:"8px 0 12px",lineHeight:1.1 },
  statBox:     { display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",background:"rgba(255,255,255,.65)",border:"1px solid rgba(220,180,30,.25)",borderRadius:"18px",padding:"13px 16px",backdropFilter:"blur(10px)",minWidth:"76px",boxShadow:"0 4px 14px rgba(220,160,20,.15)" },
  dateInput:   { width:"100%",padding:"15px 18px",borderRadius:"18px",border:"2px solid rgba(220,170,30,.35)",background:"rgba(255,255,255,.88)",fontSize:"15px",color:"#3d1a00",fontFamily:"'Nunito',sans-serif",outline:"none",boxSizing:"border-box",cursor:"pointer" },
  glowCardBase:{ padding:"20px 12px",borderRadius:"20px",textAlign:"center",backdropFilter:"blur(14px)",position:"relative",overflow:"hidden" },
  chip2:       { padding:"18px 12px",borderRadius:"18px",textAlign:"center",backdropFilter:"blur(12px)",position:"relative",overflow:"hidden",display:"flex",flexDirection:"column",alignItems:"center" },
  nextBtn:     { width:"100%",padding:"14px",border:"none",borderRadius:"22px",background:"linear-gradient(135deg,#ffd700,#f5a623)",color:"#5a3000",fontWeight:"900",fontSize:"15px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:"0 6px 22px rgba(220,160,20,.5)",letterSpacing:"0.3px" },
  backBtnTop:  { background:"rgba(255,215,0,.15)",border:"1px solid rgba(220,170,30,.3)",borderRadius:"12px",padding:"6px 13px",fontSize:"12px",fontWeight:"800",color:"#b87000",cursor:"pointer",fontFamily:"'Nunito',sans-serif",transition:"all .18s ease" },
  skipBtn:     { background:"none",border:"none",color:"#b08040",fontWeight:"700",fontSize:"13px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",textAlign:"center",display:"block",width:"100%",marginTop:"8px" },
};