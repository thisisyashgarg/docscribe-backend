// =============================================================================
// WhatsApp Service — WhatsApp Cloud API Integration
// =============================================================================
// Sends a formatted medical summary to a patient or doctor via WhatsApp
// using the official Meta WhatsApp Cloud API.
// =============================================================================

import axios from "axios";
import { MedicalSummary } from "../types";

// ---------------------------------------------------------------------------
// Message Formatting
// ---------------------------------------------------------------------------

/**
 * Format the MedicalSummary into a clean, readable WhatsApp message.
 * Uses simple emoji markers for quick scanning on a phone screen.
 */
export function formatSummaryMessage(summary: MedicalSummary): string {
  return [
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
 * official WhatsApp Cloud API.
 *
 * @param phoneNumber - Recipient's phone number in E.164 format (e.g. "+919876543210")
 * @param summary     - The structured MedicalSummary to send
 * @throws Error if WhatsApp credentials are missing or the message fails to send
 */
export async function sendWhatsAppSummary(
  phoneNumber: string,
  summary: string
): Promise<any> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (
    !phoneNumberId ||
    !accessToken
  ) {
    throw new Error(
      "WhatsApp credentials are not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in .env"
    );
  }

  // The Cloud API requires phone numbers without the '+' sign or 'whatsapp:' prefix
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, "");

  console.log(`[WhatsApp] Sending message to ${cleanNumber}…`);

  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

  const data = {
    messaging_product: "whatsapp",
    to: cleanNumber,
    type: "template",
    template: {
      name: "docscribe",
      language: {
        code: "en_US",
      },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: summary,
            },
          ],
        },
      ],
    },
  };

  try {
    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    console.log(`[WhatsApp] Message sent successfully.`, {response:response?.data});
    return response.data;
  } catch (error: any) {
    console.error(
      "[WhatsApp] Failed to send message:",
      error.response?.data || error.message
    );
    throw new Error("Failed to send WhatsApp message via Cloud API.");
  }
}
