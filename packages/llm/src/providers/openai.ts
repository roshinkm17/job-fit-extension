import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { z } from "zod";
import { parseJsonWithSchema } from "../parse.js";
import {
  type CompleteOptions,
  type LlmClient,
  LlmInvocationError,
  LlmValidationError,
} from "../types.js";

export interface OpenAiClientConfig {
  readonly apiKey: string;
  readonly model: string;
  /** Base URL override (used for OpenAI-compatible gateways like Groq). */
  readonly baseURL?: string;
}

/**
 * OpenAI adapter using the SDK's `beta.chat.completions.parse` helper, which
 * enforces a JSON Schema (derived from Zod) on the server side. Falls back to
 * permissive JSON parsing if the SDK's strict parse is not available for a
 * given model (e.g. when pointed at a Groq-compatible endpoint).
 */
export class OpenAiLlmClient implements LlmClient {
  public readonly provider = "openai" as const;
  public readonly model: string;
  private readonly client: OpenAI;

  constructor(config: OpenAiClientConfig) {
    this.model = config.model;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      ...(config.baseURL ? { baseURL: config.baseURL } : {}),
    });
  }

  async complete<T>(opts: CompleteOptions<T>): Promise<T> {
    try {
      return await this.parsedCompletion(opts);
    } catch (error) {
      if (error instanceof LlmValidationError || error instanceof LlmInvocationError) {
        throw error;
      }
      throw new LlmInvocationError(
        `OpenAI request failed: ${(error as Error).message}`,
        this.provider,
        (error as { status?: number }).status,
        error,
      );
    }
  }

  private async parsedCompletion<T>(opts: CompleteOptions<T>): Promise<T> {
    const completion = await this.client.beta.chat.completions.parse(
      {
        model: this.model,
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
        response_format: zodResponseFormat(
          opts.schema as unknown as z.ZodObject<z.ZodRawShape>,
          opts.schemaName ?? "result",
        ),
        temperature: opts.temperature ?? 0.2,
        ...(opts.maxOutputTokens ? { max_completion_tokens: opts.maxOutputTokens } : {}),
      },
      opts.signal ? { signal: opts.signal } : undefined,
    );

    const message = completion.choices[0]?.message;
    if (message?.refusal) {
      throw new LlmInvocationError(`OpenAI refused the request: ${message.refusal}`, this.provider);
    }

    if (message?.parsed) {
      const result = opts.schema.safeParse(message.parsed);
      if (!result.success) {
        throw new LlmValidationError(
          `OpenAI parsed payload did not match schema: ${result.error.message}`,
          this.provider,
          message.parsed,
          result.error,
        );
      }
      return result.data;
    }

    const raw = message?.content ?? "";
    return parseJsonWithSchema(raw, opts.schema, this.provider);
  }
}
