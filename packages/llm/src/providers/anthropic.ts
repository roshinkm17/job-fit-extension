import Anthropic from "@anthropic-ai/sdk";
import { parseJsonWithSchema } from "../parse.js";
import {
  type CompleteOptions,
  type LlmClient,
  LlmInvocationError,
  LlmValidationError,
} from "../types.js";

export interface AnthropicClientConfig {
  readonly apiKey: string;
  readonly model: string;
  readonly baseURL?: string;
}

const DEFAULT_MAX_TOKENS = 1024;
const JSON_GUARDRAIL = "\n\nRespond with a single JSON object only. No prose, no code fences.";

/**
 * Anthropic lacks native schema-enforced JSON output, so we harden the prompt
 * to require raw JSON and then validate with Zod. Tool use could enforce a
 * stricter shape, but introduces per-schema boilerplate that is overkill for
 * this workload's uniform output shape.
 */
export class AnthropicLlmClient implements LlmClient {
  public readonly provider = "anthropic" as const;
  public readonly model: string;
  private readonly client: Anthropic;

  constructor(config: AnthropicClientConfig) {
    this.model = config.model;
    this.client = new Anthropic({
      apiKey: config.apiKey,
      ...(config.baseURL ? { baseURL: config.baseURL } : {}),
    });
  }

  async complete<T>(opts: CompleteOptions<T>): Promise<T> {
    try {
      const response = await this.client.messages.create(
        {
          model: this.model,
          max_tokens: opts.maxOutputTokens ?? DEFAULT_MAX_TOKENS,
          temperature: opts.temperature ?? 0.2,
          system: opts.system + JSON_GUARDRAIL,
          messages: [{ role: "user", content: opts.user }],
        },
        opts.signal ? { signal: opts.signal } : undefined,
      );

      const text = response.content
        .filter((block): block is Extract<typeof block, { type: "text" }> => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim();

      if (!text) {
        throw new LlmValidationError(
          "Anthropic response contained no text content",
          this.provider,
          response,
        );
      }

      return parseJsonWithSchema(text, opts.schema, this.provider);
    } catch (error) {
      if (error instanceof LlmValidationError) throw error;
      throw new LlmInvocationError(
        `Anthropic request failed: ${(error as Error).message}`,
        this.provider,
        (error as { status?: number }).status,
        error,
      );
    }
  }
}
