/**
 * Stable, UI-friendly error codes the content script reasons about. We
 * translate every possible failure (backend-coded error, network, abort,
 * schema mismatch) into one of these so the UI never has to parse free text.
 */
export type AnalyzeErrorCode =
  | "unauthenticated"
  | "preferences_missing"
  | "invalid_request"
  | "llm_failure"
  | "network"
  | "server_error"
  | "invalid_response"
  | "aborted"
  | "unknown";

export class AnalyzeError extends Error {
  public readonly code: AnalyzeErrorCode;
  public readonly statusCode: number | null;

  constructor(code: AnalyzeErrorCode, message: string, statusCode: number | null = null) {
    super(message);
    this.name = "AnalyzeError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

/** User-facing one-liner for each error code; the UI can override when it wants. */
export const DEFAULT_MESSAGES: Record<AnalyzeErrorCode, string> = {
  unauthenticated: "Connect the RoleGauge extension to your account before scoring.",
  preferences_missing: "Save your job preferences before scoring.",
  invalid_request: "We couldn't read this job posting. Try scrolling to load it fully.",
  llm_failure: "Our scoring model hit an error. Try again in a moment.",
  network: "Couldn't reach the RoleGauge backend. Check your connection.",
  server_error: "The RoleGauge backend returned an error. Try again shortly.",
  invalid_response: "The backend returned an unexpected response.",
  aborted: "Scoring was cancelled.",
  unknown: "Something went wrong. Try again in a moment.",
};

/** Map the backend's `error.code` string onto our internal codes. */
export function mapBackendErrorCode(backendCode: string): AnalyzeErrorCode {
  switch (backendCode) {
    case "missing_auth":
    case "invalid_auth":
      return "unauthenticated";
    case "preferences_not_found":
      return "preferences_missing";
    case "invalid_request":
      return "invalid_request";
    case "llm_failure":
      return "llm_failure";
    default:
      return "server_error";
  }
}
