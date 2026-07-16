import "dotenv/config";
import express from "express";
import cors from "cors";
import { StudySetSchema, semanticIssues } from "./schema.js";
import { SYSTEM_PROMPT, buildUserPrompt, buildRetryPrompt, extractJsonBlock } from "./prompt.js";
import { callAnthropic } from "./providers/anthropic.js";
import { callOpenAICompatible } from "./providers/openaiCompatible.js";

const app = express();
const PORT = process.env.PORT || 8787;
const PROVIDER = process.env.AI_PROVIDER || "anthropic"; // "anthropic" | "openai"
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 3; // 1 initial try + 2 corrective retries

app.use(cors());
app.use(express.json({ limit: "1mb" }));

function callProvider(args) {
  return PROVIDER === "openai" ? callOpenAICompatible(args) : callAnthropic(args);
}

/**
 * Parses and validates one model reply against the study-set schema.
 * Returns { ok: true, data } or { ok: false, error } - never throws.
 */
function validateReply(rawText) {
  const jsonSlice = extractJsonBlock(rawText);
  let parsed;
  try {
    parsed = JSON.parse(jsonSlice);
  } catch (err) {
    return { ok: false, error: `Response was not valid JSON (${err.message}).` };
  }

  const result = StudySetSchema.safeParse(parsed);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const path = firstIssue.path.join(".") || "(root)";
    return { ok: false, error: `Schema mismatch at "${path}": ${firstIssue.message}` };
  }

  const semantic = semanticIssues(result.data);
  if (semantic.length > 0) {
    return { ok: false, error: semantic[0] };
  }

  return { ok: true, data: result.data };
}

app.post("/api/generate", async (req, res) => {
  const { input } = req.body || {};

  if (typeof input !== "string" || input.trim().length < 3) {
    return res.status(400).json({
      error: "Please provide at least a few words of notes or a topic.",
    });
  }
  if (input.length > 8000) {
    return res.status(400).json({
      error: "That input is too long (max 8000 characters). Try trimming your notes.",
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    let lastRawText = "";
    let lastError = "";

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const userPrompt =
        attempt === 1
          ? buildUserPrompt(input)
          : buildRetryPrompt(input, lastRawText, lastError);

      let rawText;
      try {
        rawText = await callProvider({
          systemPrompt: SYSTEM_PROMPT,
          userPrompt,
          signal: controller.signal,
        });
      } catch (err) {
        if (err.name === "AbortError") {
          clearTimeout(timeout);
          return res.status(504).json({
            error: "The AI took too long to respond. Please try again.",
          });
        }
        // Provider/network error - not worth retrying with the same prompt.
        clearTimeout(timeout);
        console.error("[provider error]", err.message);
        return res.status(502).json({
          error: `Could not reach the AI provider: ${err.message}`,
        });
      }

      lastRawText = rawText;
      const validation = validateReply(rawText);

      if (validation.ok) {
        clearTimeout(timeout);
        return res.json({ data: validation.data, attempts: attempt });
      }

      lastError = validation.error;
      console.warn(`[attempt ${attempt}] validation failed: ${lastError}`);
    }

    clearTimeout(timeout);
    return res.status(502).json({
      error: `The AI's response didn't match the expected format after ${MAX_ATTEMPTS} attempts (${lastError}). Please try rephrasing your input.`,
    });
  } catch (err) {
    clearTimeout(timeout);
    console.error("[unexpected error]", err);
    return res.status(500).json({ error: "Something went wrong on the server." });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, provider: PROVIDER });
});

app.listen(PORT, () => {
  console.log(`Study AI server running on http://localhost:${PORT} (provider: ${PROVIDER})`);
});
