import type { z } from "zod";
import { type LlmProvider, LlmValidationError } from "./types.js";

/**
 * Parse a raw string (expected to be JSON) against a Zod schema.
 *
 * Tolerant to:
 *  - Leading/trailing whitespace
 *  - Accidental code fences (``` or ```json) that some providers emit despite
 *    being asked for raw JSON.
 */
export function parseJsonWithSchema<T>(
  raw: string,
  schema: z.ZodSchema<T>,
  provider: LlmProvider,
): T {
  const cleaned = stripCodeFences(raw.trim());

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    throw new LlmValidationError(
      `Provider response was not valid JSON: ${(error as Error).message}`,
      provider,
      raw,
      error,
    );
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new LlmValidationError(
      `Provider response did not match schema: ${result.error.message}`,
      provider,
      parsed,
      result.error,
    );
  }

  return result.data;
}

const FENCE_REGEX = /^```(?:json)?\n?([\s\S]*?)\n?```$/i;

function stripCodeFences(value: string): string {
  const match = value.match(FENCE_REGEX);
  return match?.[1] ?? value;
}
