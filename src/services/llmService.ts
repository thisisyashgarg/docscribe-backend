// =============================================================================
// LLM Service — Medical Summary Generation
// =============================================================================
// Uses OpenAI GPT-4o to extract structured medical information from a
// doctor-patient conversation transcript.
//
// Key constraints:
//  • temperature: 0.0  — deterministic, no creative embellishment
//  • Strict system prompt — only outputs MedicalSummary JSON
//  • "Not discussed" for anything not explicitly stated
// =============================================================================

import OpenAI from "openai";
import { MedicalSummary } from "../types";

// ---------------------------------------------------------------------------
// OpenAI Client (initialised lazily on first call)
// ---------------------------------------------------------------------------

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "your_openai_or_anthropic_key") {
      throw new Error(
        "OPENAI_API_KEY is not configured. Set it in your .env file."
      );
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// ---------------------------------------------------------------------------
// System Prompt (exact wording from requirements)
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a strict, factual medical scribe. You only output structured JSON matching the MedicalSummary interface. You will receive a transcript of a doctor-patient conversation in Hindi/English. Extract exactly three things: Symptoms, Diagnosis, and Prescription. If something is not explicitly stated, output "Not discussed". Do not infer or hallucinate.`;

/**
 * User prompt template.
 * We wrap the transcript in XML-style delimiters so the model can clearly
 * distinguish instructions from content (prevents prompt injection).
 */
function buildUserPrompt(transcript: string): string {
  return `Here is the doctor-patient conversation transcript:

<transcript>
${transcript}
</transcript>

Extract the medical summary and return ONLY valid JSON in this exact format:
{
  "symptoms": "...",
  "diagnosis": "...",
  "prescription": "..."
}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * generateMedicalSummary
 * -----------------------
 * Takes a plain-text transcript of a doctor-patient conversation and returns
 * a structured MedicalSummary object.
 *
 * @param transcript - The conversation transcript (may be in Hindi, English, or mixed)
 * @returns A validated MedicalSummary object
 * @throws Error if the LLM fails or returns unparseable output
 */
export async function generateMedicalSummary(
  transcript: string
): Promise<MedicalSummary> {
  const client = getOpenAIClient();

  console.log("[LLM] Sending transcript to GPT-4o for summary extraction…");

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.0, // Deterministic — no creativity allowed
    response_format: { type: "json_object" }, // Enforce JSON output
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(transcript) },
    ],
    max_tokens: 1024,
  });

  // -----------------------------------------------------------------------
  // Parse and validate the model's response
  // -----------------------------------------------------------------------

  const rawContent = completion.choices[0]?.message?.content;
  if (!rawContent) {
    throw new Error("LLM returned an empty response.");
  }

  console.log("[LLM] Raw response received, parsing JSON…");

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    throw new Error(
      `LLM returned invalid JSON. Raw output: ${rawContent.substring(0, 200)}`
    );
  }

  // Validate that all required fields are present and are strings
  const summary: MedicalSummary = {
    symptoms: typeof parsed.symptoms === "string" ? parsed.symptoms : "Not discussed",
    diagnosis: typeof parsed.diagnosis === "string" ? parsed.diagnosis : "Not discussed",
    prescription:
      typeof parsed.prescription === "string" ? parsed.prescription : "Not discussed",
  };

  console.log("[LLM] Medical summary extracted successfully.");
  return summary;
}
