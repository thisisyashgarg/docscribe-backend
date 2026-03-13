// =============================================================================
// Consultation Controller
// =============================================================================
// Handlers for the consultation endpoints. Each handler orchestrates the
// relevant services and returns a standardised JSON response.
// =============================================================================

import { Request, Response, NextFunction } from "express";
import { transcribeAudio } from "../services/asrService";
import { generateMedicalSummary } from "../services/llmService";
import { sendWhatsAppSummary } from "../services/whatsappService";
import { SendSummaryRequest, ApiSuccessResponse, MedicalSummary } from "../types";

// ---------------------------------------------------------------------------
// POST /api/consultation/process
// ---------------------------------------------------------------------------

/**
 * processConsultation
 * --------------------
 * Accepts an audio file upload (field name: "audioBlob"), chains:
 *   1. ASR  → transcribe audio to text
 *   2. LLM  → extract structured MedicalSummary from transcript
 *
 * Returns the transcript and summary to the client.
 */
export async function processConsultation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // --- Validate that an audio file was uploaded ---
    const audioFile = req.file;
    if (!audioFile) {
      res.status(400).json({
        success: false,
        error: "No audio file provided. Upload a file under the field 'audioBlob'.",
      });
      return;
    }

    console.log(
      `[Controller] Received audio: ${audioFile.originalname} ` +
        `(${(audioFile.size / 1024).toFixed(1)} KB, ${audioFile.mimetype})`
    );

    // --- Step 1: Transcribe audio → text ---
    const transcript = await transcribeAudio(audioFile);
    console.log(
      `[Controller] Transcript (${transcript.length} chars): "${transcript.substring(0, 100)}…"`
    );

    // --- Step 2: Extract structured summary from transcript ---
    const summary = await generateMedicalSummary(transcript);

    // --- Return both transcript and summary ---
    const response: ApiSuccessResponse<{
      actualTranscript: string;
      summary: MedicalSummary;
    }> = {
      success: true,
      data: { actualTranscript: transcript, summary },
    };

    res.status(200).json(response);
  } catch (error) {
    // Delegate to the centralised error handler
    next(error);
  }
}

// ---------------------------------------------------------------------------
// POST /api/consultation/send
// ---------------------------------------------------------------------------

/**
 * sendSummary
 * ------------
 * Accepts a JSON body with { phoneNumber, summary } and triggers a WhatsApp
 * message via Twilio.
 */
export async function sendSummary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { phoneNumber, summary } = req.body as SendSummaryRequest;

    // --- Input validation ---
    if (!phoneNumber || typeof phoneNumber !== "string") {
      res.status(400).json({
        success: false,
        error: "Missing or invalid 'phoneNumber'. Provide an E.164 formatted number.",
      });
      return;
    }

    if (
      !summary ||
      typeof summary.symptoms !== "string" ||
      typeof summary.diagnosis !== "string" ||
      typeof summary.prescription !== "string"
    ) {
      res.status(400).json({
        success: false,
        error:
          "Missing or invalid 'summary'. Provide an object with symptoms, diagnosis, and prescription strings.",
      });
      return;
    }

    console.log(`[Controller] Sending summary to ${phoneNumber}…`);

    // --- Dispatch the WhatsApp message ---
    const twilioLog = await sendWhatsAppSummary(phoneNumber, summary);

    res.status(200).json({
      success: true,
      data: { 
        message: "WhatsApp message sent successfully.",
        twilioLog
      },
    });
  } catch (error) {
    next(error);
  }
}
