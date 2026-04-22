export type ErrorCode =
  | "invalid_auth"
  | "missing_auth"
  | "preferences_not_found"
  | "invalid_request"
  | "llm_failure"
  | "internal_error";

/** Base class carrying HTTP status + machine-readable error code. */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;

  constructor(message: string, code: ErrorCode, statusCode: number, cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = "Authentication required", code: ErrorCode = "missing_auth") {
    super(message, code, 401);
    this.name = "UnauthenticatedError";
  }
}

export class PreferencesMissingError extends AppError {
  constructor() {
    super(
      "User preferences not found. Set preferences before running an analysis.",
      "preferences_not_found",
      422,
    );
    this.name = "PreferencesMissingError";
  }
}

export class InvalidRequestError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, "invalid_request", 400, cause);
    this.name = "InvalidRequestError";
  }
}

export class LlmFailureError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, "llm_failure", 502, cause);
    this.name = "LlmFailureError";
  }
}
