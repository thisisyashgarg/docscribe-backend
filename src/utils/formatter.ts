import { MedicalSummary } from "../types";

/**
 * formatMedicalSummary
 * --------------------
 * Formats a structured MedicalSummary object into a human-readable text block.
 * Uses Markdown-style formatting for emphasis.
 */
export function formatMedicalSummary(summary: MedicalSummary): string {
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
