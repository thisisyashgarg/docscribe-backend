// =============================================================================
// WhatsApp Service — Twilio Integration
// =============================================================================
// Sends a formatted medical summary to a patient or doctor via WhatsApp
// using the official Twilio Node.js SDK.
// =============================================================================

import twilio from "twilio";
import { MedicalSummary } from "../types";

// ---------------------------------------------------------------------------
// Twilio Client (initialised lazily on first call)
// ---------------------------------------------------------------------------

let twilioClient: twilio.Twilio | null = null;

function getTwilioClient(): twilio.Twilio {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (
      !accountSid ||
      !authToken ||
      accountSid === "your_twilio_sid" ||
      authToken === "your_twilio_token"
    ) {
      throw new Error(
        "Twilio credentials are not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env"
      );
    }

    twilioClient = twilio(accountSid, authToken);
  }

  return twilioClient;
}

// ---------------------------------------------------------------------------
// Message Formatting
// ---------------------------------------------------------------------------

/**
 * Format the MedicalSummary into a clean, readable WhatsApp message.
 * Uses simple emoji markers for quick scanning on a phone screen.
 */
export function formatSummaryMessage(summary: MedicalSummary): string {
  return [
    "🏥 *Medical Consultation Summary*",
    "",
    "🔹 *Symptoms:*",
    summary.symptoms,
    "",
    "🔹 *Diagnosis:*",
    summary.diagnosis,
    "",
    "🔹 *Prescription:*",
    summary.prescription,
    "",
    "---",
    "_This summary was generated automatically. Please consult your doctor for any clarifications._",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * sendWhatsAppSummary
 * --------------------
 * Sends a formatted medical summary to the specified phone number via
 * WhatsApp using Twilio's Messaging API.
 *
 * @param phoneNumber - Recipient's phone number in E.164 format (e.g. "+919876543210")
 * @param summary     - The structured MedicalSummary to send
 * @throws Error if Twilio credentials are missing or the message fails to send
 */
export async function sendWhatsAppSummary(
  phoneNumber: string,
  summary: string
): Promise<any> {
  const client = getTwilioClient();

  // The "from" number must be a Twilio WhatsApp-enabled number
  const fromNumber =
    process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

  // Ensure the recipient number has the whatsapp: prefix
  const toNumber = phoneNumber.startsWith("whatsapp:")
    ? phoneNumber
    : `whatsapp:${phoneNumber}`;

  console.log(`[WhatsApp] Sending message to ${toNumber}…`);

  const message = await client.messages.create({
    from: fromNumber,
    to: toNumber,
    body: summary,
  });

  console.log(`[WhatsApp] Message sent successfully. SID: ${message.sid}`);
  return message;
}
