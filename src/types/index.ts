// =============================================================================
// Types & Interfaces
// =============================================================================
// Central type definitions for the healthcare medical scribe application.
// All shared interfaces live here to ensure a single source of truth.
// =============================================================================

/**
 * MedicalSummary
 * ---------------
 * Represents the structured output extracted from a doctor-patient consultation.
 * Each field is a plain string — if a piece of information was not explicitly
 * discussed in the transcript, the LLM is instructed to return "Not discussed".
 */
export interface MedicalSummary {
  /** Patient-reported symptoms extracted from the conversation */
  symptoms: string;

  /** Doctor's diagnosis as stated in the conversation */
  diagnosis: string;

  /** Prescribed medications or treatments mentioned in the conversation */
  prescription: string;
}

/**
 * SendSummaryRequest
 * -------------------
 * Shape of the JSON body expected by the POST /api/consultation/send endpoint.
 */
export interface SendSummaryRequest {
  /** Recipient's email address */
  email: string;

  /** The summary text to deliver via Email (already formatted) */
  summary: string;
}

/**
 * ApiErrorResponse
 * -----------------
 * Standardised error payload returned to the client when something goes wrong.
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: string;
}

/**
 * ApiSuccessResponse<T>
 * ----------------------
 * Generic wrapper for all successful API responses.
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}
