import { AnthropicLlmClient } from "./providers/anthropic.js";
import { GroqLlmClient } from "./providers/groq.js";
import { OpenAiLlmClient } from "./providers/openai.js";
import { type LlmClient, LlmInvocationError, type LlmProvider } from "./types.js";

export interface LlmEnv {
  readonly LLM_PROVIDER?: string;
  readonly LLM_MODEL?: string;
  readonly OPENAI_API_KEY?: string;
  readonly OPENAI_BASE_URL?: string;
  readonly ANTHROPIC_API_KEY?: string;
  readonly ANTHROPIC_BASE_URL?: string;
  readonly GROQ_API_KEY?: string;
  readonly GROQ_BASE_URL?: string;
}

const DEFAULT_MODELS: Record<LlmProvider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-latest",
  groq: "llama-3.3-70b-versatile",
};

const SUPPORTED_PROVIDERS: readonly LlmProvider[] = ["openai", "anthropic", "groq"];

/**
 * Construct an `LlmClient` from environment variables. Centralising this in a
 * single factory keeps provider selection logic out of call sites and makes
 * the whole app dependency-free on any specific SDK.
 */
export function createLlmClient(env: LlmEnv = process.env as LlmEnv): LlmClient {
  const provider = assertProvider(env.LLM_PROVIDER ?? "openai");
  const model = env.LLM_MODEL ?? DEFAULT_MODELS[provider];

  switch (provider) {
    case "openai": {
      const apiKey = requireEnv(env.OPENAI_API_KEY, "OPENAI_API_KEY");
      return new OpenAiLlmClient({
        apiKey,
        model,
        ...(env.OPENAI_BASE_URL ? { baseURL: env.OPENAI_BASE_URL } : {}),
      });
    }
    case "anthropic": {
      const apiKey = requireEnv(env.ANTHROPIC_API_KEY, "ANTHROPIC_API_KEY");
      return new AnthropicLlmClient({
        apiKey,
        model,
        ...(env.ANTHROPIC_BASE_URL ? { baseURL: env.ANTHROPIC_BASE_URL } : {}),
      });
    }
    case "groq": {
      const apiKey = requireEnv(env.GROQ_API_KEY, "GROQ_API_KEY");
      return new GroqLlmClient({
        apiKey,
        model,
        ...(env.GROQ_BASE_URL ? { baseURL: env.GROQ_BASE_URL } : {}),
      });
    }
  }
}

function assertProvider(value: string): LlmProvider {
  const normalized = value.toLowerCase() as LlmProvider;
  if (!SUPPORTED_PROVIDERS.includes(normalized)) {
    throw new LlmInvocationError(
      `Unsupported LLM_PROVIDER "${value}". Expected one of: ${SUPPORTED_PROVIDERS.join(", ")}`,
      "openai",
    );
  }
  return normalized;
}

function requireEnv(value: string | undefined, name: string): string {
  if (!value || value.trim().length === 0) {
    throw new LlmInvocationError(`${name} is required but was empty`, "openai");
  }
  return value;
}
