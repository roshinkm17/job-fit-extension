import OpenAI from "openai";
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
 * OpenAI adapter using JSON mode + local Zod validation.
 *
 * We intentionally avoid `beta.chat.completions.parse` because OpenAI's strict
 * schema validator currently requires all object properties to be marked
 * required. Our output shape allows optional `detail`, so strict schema mode
 * rejects the request before generation.
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
      return await this.jsonModeCompletion(opts);
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

  private async jsonModeCompletion<T>(opts: CompleteOptions<T>): Promise<T> {
    const completion = await this.client.chat.completions.create(
      {
        model: this.model,
        messages: [
          {
            role: "system",
            content: `${opts.system}\n\nRespond with a single JSON object only. No prose or code fences.`,
          },
          { role: "user", content: opts.user },
        ],
        response_format: { type: "json_object" },
        temperature: opts.temperature ?? 0.2,
        ...(opts.maxOutputTokens ? { max_tokens: opts.maxOutputTokens } : {}),
      },
      opts.signal ? { signal: opts.signal } : undefined,
    );

    const message = completion.choices[0]?.message;
    if (message?.refusal) {
      throw new LlmInvocationError(`OpenAI refused the request: ${message.refusal}`, this.provider);
    }
    const raw = message?.content ?? "";
    return parseJsonWithSchema(raw, opts.schema, this.provider);
  }
}
