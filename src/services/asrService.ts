// =============================================================================
// ASR Service — Automatic Speech Recognition
// =============================================================================
// Responsible for converting doctor-patient audio conversations into text.
// Optimized for English-only conversations.
//
// Provider priority:
//   1. Groq (FREE) — runs Whisper large-v3-turbo, extremely fast
//
// Groq offers a generous free tier with no credit card required.
// Sign up at https://console.groq.com to get your free API key.
// =============================================================================

import axios from "axios";
import FormData from "form-data";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Groq Whisper endpoint (FREE tier) */
const GROQ_WHISPER_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

/** Sarvam AI STT endpoint (paid fallback) */
const SARVAM_API_URL = "https://api.sarvam.ai/speech-to-text-translate";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * transcribeAudio
 * ----------------
 * Accepts a Multer file object and returns the transcribed text.
 *
 * Strategy:
 *  1. Try Groq (FREE — runs Whisper large-v3-turbo).
 *
 * @param audioFile - The uploaded audio file from Multer
 * @returns The transcribed text as a plain string
 * @throws Error if the provider fails
 */
export async function transcribeAudio(
  audioFile: Express.Multer.File
): Promise<string> {
  // --- Attempt 1: Groq (FREE) ---
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && groqKey !== "your_groq_api_key") {
    try {
      console.log("[ASR] Attempting transcription via Groq (free Whisper)…");
      const transcript = await transcribeWithGroq(audioFile, groqKey);
      console.log("[ASR] Groq transcription succeeded.");
      return transcript;
    } catch (error) {
      console.warn(
        "[ASR] Groq failed, falling back to Sarvam AI:",
        error instanceof Error ? error.message : error
      );
    }
  }

  // --- Attempt 2: Sarvam AI ---
  const sarvamKey = process.env.SARVAM_API_KEY;
  if (sarvamKey && sarvamKey !== "your_sarvam_api_key") {
    try {
      console.log("[ASR] Attempting transcription via Sarvam AI…");
      const transcript = await transcribeWithSarvam(audioFile, sarvamKey);
      console.log("[ASR] Sarvam AI transcription succeeded.");
      return transcript;
    } catch (error) {
      console.error(
        "[ASR] Sarvam AI transcription failed:",
        error instanceof Error ? error.message : error
      );
      throw new Error("All ASR providers failed. Check API keys and audio format.");
    }
  }

  throw new Error(
    "No ASR provider configured. Set GROQ_API_KEY (free) or SARVAM_API_KEY in .env"
  );
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Send audio to Groq's Whisper endpoint.
 * Groq runs whisper-large-v3-turbo for FREE and is OpenAI-compatible.
 * Supports Hindi, Hinglish, English, and 50+ other languages.
 *
 * Free tier: https://console.groq.com (no credit card needed)
 */
async function transcribeWithGroq(
  audioFile: Express.Multer.File,
  apiKey: string
): Promise<string> {
  const form = new FormData();

  form.append("file", audioFile.buffer, {
    filename: audioFile.originalname || "audio.wav",
    contentType: audioFile.mimetype || "audio/wav",
  });

  // whisper-large-v3-turbo is the fastest and best quality on Groq
  form.append("model", "whisper-large-v3-turbo");

  // Hint for Hindi
  form.append("language", "hi");

  // Plain text response format for simplicity
  form.append("response_format", "json");

  const response = await axios.post(GROQ_WHISPER_URL, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${apiKey}`,
    },
    timeout: 60_000, // 60 s generous timeout for long recordings
  });

  const transcript: string = response.data?.text;
  if (!transcript) {
    throw new Error("Groq Whisper API returned an empty transcript.");
  }

  return transcript;
}

/**
 * Send audio to Sarvam AI speech-to-text-translate endpoint.
 * This endpoint natively supports Hindi, Hinglish, and English audio and
 * returns the transcript translated to English.
 */
async function transcribeWithSarvam(
  audioFile: Express.Multer.File,
  apiKey: string
): Promise<string> {
  const form = new FormData();

  // Sarvam expects the audio file under the "file" field
  form.append("file", audioFile.buffer, {
    filename: audioFile.originalname || "audio.wav",
    contentType: audioFile.mimetype || "audio/wav",
  });

  // Model selection — saaras:v2 supports Hindi/Hinglish natively
  form.append("model", "saaras:v2");

  // We want the transcript in English for downstream LLM processing
  form.append("with_timestamps", "false");

  const response = await axios.post(SARVAM_API_URL, form, {
    headers: {
      ...form.getHeaders(),
      "api-subscription-key": apiKey,
    },
    timeout: 60_000,
  });

  // Sarvam returns { transcript: "..." } on success
  const transcript: string = response.data?.transcript;
  if (!transcript) {
    throw new Error("Sarvam API returned an empty transcript.");
  }

  return transcript;
}
