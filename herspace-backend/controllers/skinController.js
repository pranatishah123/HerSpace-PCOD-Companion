const axios       = require("axios");
const cloudinary  = require("../utils/cloudinary");
const SkinEntry   = require("../models/SkinEntry");
const PeriodTracker = require("../models/PeriodTracker");

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const VISION_MODEL   = process.env.OPENROUTER_VISION_MODEL || "openrouter/auto";

function extractFirstJsonObject(text) {
  if (!text) throw new Error("Empty model response");
  const cleaned = String(text).replace(/```json|```/gi, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found in model response");
  }
  const candidate = cleaned.slice(firstBrace, lastBrace + 1);
  return JSON.parse(candidate);
}

function getMissingSkinEnv() {
  const required = [
    "OPENROUTER_API_KEY",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];
  return required.filter((key) => !process.env[key]);
}

// ── Helper: compute cycle day + phase from lastPeriod ────────────────────────
function getCycleContext(lastPeriod, cycleLengthDays = 28) {
  if (!lastPeriod) return { cycleDay: null, cyclePhase: "" };

  const today      = new Date();
  const start      = new Date(lastPeriod);
  const diffMs     = today - start;
  const dayOfCycle = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
  const cycleDay   = ((dayOfCycle - 1) % cycleLengthDays) + 1;

  let cyclePhase;
  if      (cycleDay <= 5)  cyclePhase = "Menstrual";
  else if (cycleDay <= 13) cyclePhase = "Follicular";
  else if (cycleDay <= 16) cyclePhase = "Ovulation";
  else                     cyclePhase = "Luteal";

  return { cycleDay, cyclePhase };
}

// ── Helper: upload buffer to Cloudinary ──────────────────────────────────────
function uploadToCloudinary(buffer, mimeType) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:          "herspace/skin",
        resource_type:   "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// ── Helper: call OpenRouter vision model ──────────────────────────────────────
async function callVisionAI({ imageUrl, mimeType, base64Image, promptText }) {
  const url = "https://openrouter.ai/api/v1/chat/completions";
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": `Bearer ${OPENROUTER_KEY}`,
    "HTTP-Referer": "https://herspace.app",
    "X-Title": "HerSpace Skin Analysis",
  };

  const imagePayloadUrl = imageUrl
    ? imageUrl
    : `data:${mimeType};base64,${base64Image}`;

  const models = [
    VISION_MODEL,
    "openrouter/auto",
    "google/gemini-2.0-flash", // common vision-capable fallback on OpenRouter
  ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);

  let lastErr;
  for (const model of models) {
    const baseBody = {
      model,
      messages: [{
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imagePayloadUrl } },
          { type: "text", text: promptText },
        ],
      }],
      max_tokens: 900,
      temperature: 0.4,
    };

    const attempts = [
      { ...baseBody, response_format: { type: "json_object" } },
      { ...baseBody },
    ];

    for (const body of attempts) {
      try {
        const resp = await axios.post(url, body, {
          headers,
          timeout: 30000,
          validateStatus: () => true,
          maxBodyLength: Infinity,
        });

        const { data, status } = resp;
        if (!data) throw new Error("Empty OpenRouter response");

        if (status < 200 || status >= 300) {
          const msg = data?.error?.message || `OpenRouter HTTP ${status}`;
          const err = new Error(`${msg} (model=${model}, status=${status})`);
          err._openrouter = { status, model, data };
          throw err;
        }

        if (data.error) {
          const err = new Error(`${data.error.message || "Vision model error"} (model=${model})`);
          err._openrouter = { status, model, data };
          throw err;
        }

        const content = data?.choices?.[0]?.message?.content;
        if (content) return content;

        throw new Error(`OpenRouter response missing message content (model=${model})`);
      } catch (err) {
        lastErr = err;
      }
    }
  }

  throw lastErr || new Error("Vision model error");
}

// ── MODERATION PROMPT ─────────────────────────────────────────────────────────
// ✅ UPDATED: AI-generated image detection added
const MODERATION_PROMPT = `You are a content moderation AI for a women's wellness app.

Examine this image carefully.

ALLOWED images:
- Real photographs of skin on: face, forehead, cheeks, chin, jaw, nose, around the mouth
- Neck, décolletage (clothed)
- Arms, hands, wrists, back of hand
- Scalp / hairline
- Back (clothed), shoulders (clothed)
- Chest area only if fully clothed
- The image must be a genuine real-life photograph taken by a camera or phone

NOT ALLOWED — block immediately if any of these are true:
- Nudity or partial nudity of any kind
- Private body parts (breasts exposed, genitals, buttocks)
- Sexually suggestive content
- Non-body images (food, objects, animals, landscapes, products)
- Screenshots of apps, websites, social media, or any UI
- Violent or graphic medical imagery (open wounds, surgery, blood)
- Faces of children who appear under 13 years old
- AI-generated images, digital illustrations, 3D renders, or CGI characters
- Cartoon or animated images of any kind
- Digitally painted or drawn artwork
- Images with heavy beauty filters or face-tuning that make skin look synthetic
- Stock photo watermarks or clearly professional studio photography with unnatural skin perfection
- Images that appear artificially created and do not look like real human skin photographed naturally

Look carefully for signs of AI generation:
- Unnaturally smooth or plastic-looking skin with no real pores or texture
- Perfect symmetry that does not occur naturally in real humans
- Background that looks dreamlike, blurred unnaturally, or digitally generated
- Lighting that looks rendered rather than photographed naturally
- Any visual artifacts typical of AI image generators (warped edges, melting features, extra fingers)
- Skin that looks painted or too perfect to be a real photograph

Respond with ONLY this JSON (no markdown, no extra text):
{
  "safe": true or false,
  "aiGenerated": true or false,
  "reason": "brief reason if not safe or if AI generated, else empty string",
  "bodyPart": "what body part is visible (e.g. face, arm, hand, neck)"
}`;

// ── SKIN ANALYSIS PROMPT ──────────────────────────────────────────────────────
const ANALYSIS_PROMPT = `You are a professional dermatologist AI assistant for a women's wellness app called HerSpace.

Analyze this skin image carefully and return your response in this EXACT JSON format (no extra text, no markdown):

{
  "condition": "Brief condition name (e.g. Mild Acne, Healthy Skin, Hyperpigmentation, Rash, Dryness)",
  "severity": "Low / Moderate / High",
  "severityScore": <number from 1 to 10>,
  "possibleCauses": ["cause 1", "cause 2", "cause 3"],
  "careTips": ["tip 1", "tip 2", "tip 3", "tip 4"],
  "doctorConsult": true or false,
  "hormonalLink": true or false,
  "hormonalNote": "Short note if condition may be related to PCOD/hormonal imbalance, else empty string",
  "aiNote": "2-3 sentence professional dermatologist-style explanation of what you see in the image and what the user should know."
}

Be empathetic, clear, and medically cautious. Always remind users this is not a medical diagnosis.`;

// ════════════════════════════════════════════════════════════════════════════
// POST /api/skin/analyze
// ════════════════════════════════════════════════════════════════════════════
const analyzeSkin = async (req, res) => {
  try {
    const missingEnv = getMissingSkinEnv();
    if (missingEnv.length) {
      console.error("Skin analyzer misconfigured. Missing env:", missingEnv.join(", "));
      return res.status(500).json({
        message: "Skin analyzer is not configured correctly on server.",
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded." });
    }

    const base64Image = req.file.buffer.toString("base64");
    const mimeType    = req.file.mimetype;
    const userId      = req.user.id;

    // ── Step 1: Upload to Cloudinary ──────────────────────────────────────
    console.log("☁️ Uploading to Cloudinary...");
    let cloudinaryResult;
    try {
      cloudinaryResult = await uploadToCloudinary(req.file.buffer, mimeType);
    } catch (uploadErr) {
      console.error("Cloudinary upload failed:", uploadErr.message);
      return res.status(500).json({ message: "Image upload failed. Please try again." });
    }

    const imageUrl = cloudinaryResult.secure_url;
    const publicId = cloudinaryResult.public_id;
    console.log("✅ Uploaded to Cloudinary:", imageUrl);

    // ── Step 2: Content Moderation (via Cloudinary URL to avoid base64 limits) ──
    console.log("🔍 Running content moderation...");
    let moderationResult;
    try {
      const modText = await callVisionAI({ imageUrl, mimeType, base64Image, promptText: MODERATION_PROMPT });
      moderationResult = extractFirstJsonObject(modText);
    } catch (modErr) {
      const details =
        modErr?._openrouter?.data?.error?.message ||
        modErr?.response?.data?.error?.message ||
        modErr?.message ||
        "Unknown error";
      console.error("Moderation check failed:", details);
      await cloudinary.uploader.destroy(publicId).catch(() => {});
      const detailText = String(details || "");
      const isAuthIssue =
        /user not found/i.test(detailText) ||
        /invalid api key/i.test(detailText) ||
        /unauthorized/i.test(detailText) ||
        /forbidden/i.test(detailText) ||
        modErr?._openrouter?.status === 401 ||
        modErr?._openrouter?.status === 403;

      if (isAuthIssue) {
        return res.status(500).json({
          message: "Skin analyzer AI service is not configured correctly on server.",
          code: process.env.NODE_ENV === "production" ? undefined : "OPENROUTER_AUTH_FAILED",
          debug: process.env.NODE_ENV === "production" ? undefined : detailText.slice(0, 300),
        });
      }

      return res.status(502).json({
        message: "Skin safety check service is temporarily unavailable. Please try again in a moment.",
        code: process.env.NODE_ENV === "production" ? undefined : "OPENROUTER_MODERATION_FAILED",
        debug: process.env.NODE_ENV === "production" ? undefined : detailText.slice(0, 300),
      });
    }

    // ✅ Block AI-generated images first — separate clear error message
    if (moderationResult.aiGenerated) {
      console.warn("🚫 AI-generated image blocked:", moderationResult.reason);
      await cloudinary.uploader.destroy(publicId).catch(() => {});
      return res.status(400).json({
        message: "AI-generated or digitally created images are not allowed. Please upload a real photo of your skin taken with your camera or phone.",
        blocked: true,
        reason:  "ai_generated",
      });
    }

    // ✅ Block unsafe content
    if (!moderationResult.safe) {
      console.warn("🚫 Image blocked by moderation:", moderationResult.reason);
      await cloudinary.uploader.destroy(publicId).catch(() => {});
      return res.status(400).json({
        message: `This image cannot be processed. ${moderationResult.reason || "Please upload a clear real photo of your face, arms, hands, or neck (clothed)."}`,
        blocked: true,
        reason:  "unsafe_content",
      });
    }

    console.log("✅ Moderation passed — body part:", moderationResult.bodyPart);

    // ── Step 3: AI Skin Analysis ──────────────────────────────────────────
    console.log("🤖 Running skin analysis...");
    let analysisResult;
    try {
      const rawText = await callVisionAI({ imageUrl, mimeType, base64Image, promptText: ANALYSIS_PROMPT });
      analysisResult = extractFirstJsonObject(rawText);
    } catch (analysisErr) {
      const details = analysisErr?.response?.data?.error?.message || analysisErr.message;
      console.error("Skin analysis failed:", details);
      // Image already uploaded — delete from Cloudinary to avoid orphan
      await cloudinary.uploader.destroy(publicId).catch(() => {});
      return res.status(500).json({ message: "Skin analysis failed. Please try again." });
    }

    // ── Step 4: Get Cycle Context ─────────────────────────────────────────
    let cycleDay   = null;
    let cyclePhase = "";
    try {
      const tracker = await PeriodTracker.findOne({ userId });
      if (tracker?.current?.lastPeriod) {
        const ctx = getCycleContext(
          tracker.current.lastPeriod,
          tracker.current.cycleLengthDays || 28
        );
        cycleDay   = ctx.cycleDay;
        cyclePhase = ctx.cyclePhase;
        console.log(`🌙 Cycle context: Day ${cycleDay} — ${cyclePhase}`);
      }
    } catch (cycleErr) {
      console.warn("Could not fetch cycle context:", cycleErr.message);
    }

    // ── Step 5: Save to MongoDB ───────────────────────────────────────────
    const skinEntry = await SkinEntry.create({
      userId,
      imageUrl,
      publicId,
      condition:        analysisResult.condition      || "",
      severity:         analysisResult.severity       || "",
      severityScore:    analysisResult.severityScore  || 0,
      possibleCauses:   analysisResult.possibleCauses || [],
      careTips:         analysisResult.careTips       || [],
      doctorConsult:    analysisResult.doctorConsult  ?? false,
      hormonalLink:     analysisResult.hormonalLink   ?? false,
      hormonalNote:     analysisResult.hormonalNote   || "",
      aiNote:           analysisResult.aiNote         || "",
      cycleDay,
      cyclePhase,
      moderationPassed: true,
    });

    console.log("✅ Skin entry saved:", skinEntry._id);

    // ── Step 6: Return response ───────────────────────────────────────────
    res.status(200).json({
      ...analysisResult,
      imageUrl,
      cycleDay,
      cyclePhase,
      entryId: skinEntry._id,
      savedWithCycleData: !!cyclePhase,
    });

  } catch (error) {
    console.error("analyzeSkin error:", error.message);
    res.status(500).json({ message: "Skin analysis failed. Please try again." });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// GET /api/skin/history
// ════════════════════════════════════════════════════════════════════════════
const getSkinHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const entries = await SkinEntry.find({ userId })
      .sort({ createdAt: -1 })
      .select("imageUrl condition severity severityScore cycleDay cyclePhase hormonalLink hormonalNote aiNote doctorConsult createdAt")
      .lean();

    let patternInsight = null;
    if (entries.length >= 3) {
      patternInsight = detectPattern(entries);
    }

    res.status(200).json({
      entries,
      totalEntries:        entries.length,
      patternInsight,
      hasEnoughForPattern: entries.length >= 3,
    });

  } catch (error) {
    console.error("getSkinHistory error:", error.message);
    res.status(500).json({ message: "Could not fetch skin history." });
  }
};

// ── Helper: detect skin-cycle pattern from history ────────────────────────────
function detectPattern(entries) {
  const phaseCounts = {};
  const phaseAcne   = {};

  for (const entry of entries) {
    if (!entry.cyclePhase) continue;
    phaseCounts[entry.cyclePhase] = (phaseCounts[entry.cyclePhase] || 0) + 1;

    const isAcne = entry.condition?.toLowerCase().includes("acne") ||
                   entry.condition?.toLowerCase().includes("breakout") ||
                   entry.severityScore >= 5;
    if (isAcne) {
      phaseAcne[entry.cyclePhase] = (phaseAcne[entry.cyclePhase] || 0) + 1;
    }
  }

  let worstPhase     = null;
  let worstAcneCount = 0;
  for (const [phase, count] of Object.entries(phaseAcne)) {
    if (count > worstAcneCount) {
      worstAcneCount = count;
      worstPhase     = phase;
    }
  }

  if (worstPhase && worstAcneCount >= 2) {
    const phaseEmoji = { Menstrual:"🩸", Follicular:"🌱", Ovulation:"🥚", Luteal:"🌙" };
    return {
      detected: true,
      message:  `Your skin tends to flare up during the ${worstPhase} phase ${phaseEmoji[worstPhase] || ""}`,
      phase:    worstPhase,
      tip:      worstPhase === "Luteal"
        ? "Spearmint tea and reducing dairy before your luteal phase may help reduce hormonal acne."
        : `Extra care during your ${worstPhase} phase can make a big difference.`,
    };
  }

  const clearEntries = entries.filter(e => e.severityScore <= 3).length;
  if (clearEntries >= Math.ceil(entries.length * 0.7)) {
    return {
      detected: true,
      message:  "Your skin has been consistently healthy — great work! 🌸",
      phase:    null,
      tip:      "Keep following your current skincare routine.",
    };
  }

  return {
    detected: false,
    message:  "Keep tracking to unlock your skin-cycle pattern insights.",
    phase:    null,
    tip:      "Patterns appear after 3+ entries across different cycle phases.",
  };
}

module.exports = { analyzeSkin, getSkinHistory };