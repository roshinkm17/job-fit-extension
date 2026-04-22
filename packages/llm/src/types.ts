import type { z } from "zod";

/**
 * Identifier for a supported LLM provider. Extending this requires adding a
 * corresponding client implementation and factory branch.
 */
export type LlmProvider = "openai" | "anthropic" | "groq";

export interface CompleteOptions<T> {
  readonly system: string;
  readonly user: string;
  /** Zod schema used to validate and type the parsed response. */
  readonly schema: z.ZodSchema<T>;
  /** Human-readable name for the schema; used by some providers (e.g. OpenAI structured outputs). */
  readonly schemaName?: string;
  readonly temperature?: number;
  readonly maxOutputTokens?: number;
  /**
   * Abort signal forwarded to the underlying HTTP call. Always preferred over
   * ad-hoc timeout handling inside the adapter.
   */
  readonly signal?: AbortSignal;
}

export interface LlmClient {
  readonly provider: LlmProvider;
  readonly model: string;
  complete<T>(opts: CompleteOptions<T>): Promise<T>;
}

/** Base class so callers can distinguish "our" errors from runtime crashes. */
export class LlmError extends Error {
  public readonly provider: LlmProvider;

  constructor(message: string, provider: LlmProvider, cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = "LlmError";
    this.provider = provider;
  }
}

/** Raised when the provider call fails (network, 4xx/5xx, timeout, abort). */
export class LlmInvocationError extends LlmError {
  public readonly status?: number;

  constructor(message: string, provider: LlmProvider, status?: number, cause?: unknown) {
    super(message, provider, cause);
    this.name = "LlmInvocationError";
    if (status !== undefined) this.status = status;
  }
}

/** Raised when the provider returns content that fails Zod validation. */
export class LlmValidationError extends LlmError {
  public readonly raw: unknown;

  constructor(message: string, provider: LlmProvider, raw: unknown, cause?: unknown) {
    super(message, provider, cause);
    this.name = "LlmValidationError";
    this.raw = raw;
  }
}
