import OpenAI from "openai";
import { parseJsonWithSchema } from "../parse.js";
import {
  type CompleteOptions,
  type LlmClient,
  LlmInvocationError,
  LlmValidationError,
} from "../types.js";

export interface GroqClientConfig {
  readonly apiKey: string;
  readonly model: string;
  readonly baseURL?: string;
}

const DEFAULT_GROQ_BASE_URL = "https://api.groq.com/openai/v1";

/**
 * Groq exposes an OpenAI-compatible Chat Completions API, so we reuse the
 * OpenAI SDK with an overridden baseURL. Groq supports JSON mode
 * (`response_format: { type: "json_object" }`) but not strict schema
 * enforcement, so we always validate with Zod after parsing.
 */
export class GroqLlmClient implements LlmClient {
  public readonly provider = "groq" as const;
  public readonly model: string;
  private readonly client: OpenAI;

  constructor(config: GroqClientConfig) {
    this.model = config.model;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL ?? DEFAULT_GROQ_BASE_URL,
    });
  }

  async complete<T>(opts: CompleteOptions<T>): Promise<T> {
    try {
      const completion = await this.client.chat.completions.create(
        {
          model: this.model,
          messages: [
            { role: "system", content: opts.system },
            { role: "user", content: opts.user },
          ],
          response_format: { type: "json_object" },
          temperature: opts.temperature ?? 0.2,
          ...(opts.maxOutputTokens ? { max_tokens: opts.maxOutputTokens } : {}),
        },
        opts.signal ? { signal: opts.signal } : undefined,
      );

      const raw = completion.choices[0]?.message.content ?? "";
      return parseJsonWithSchema(raw, opts.schema, this.provider);
    } catch (error) {
      if (error instanceof LlmValidationError) throw error;
      throw new LlmInvocationError(
        `Groq request failed: ${(error as Error).message}`,
        this.provider,
        (error as { status?: number }).status,
        error,
      );
    }
  }
}
