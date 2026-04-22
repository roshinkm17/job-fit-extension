import { describe, expect, it } from "vitest";
import { createLlmClient } from "./factory.js";
import { AnthropicLlmClient } from "./providers/anthropic.js";
import { GroqLlmClient } from "./providers/groq.js";
import { OpenAiLlmClient } from "./providers/openai.js";
import { LlmInvocationError } from "./types.js";

describe("createLlmClient", () => {
  it("defaults to OpenAI with gpt-4o-mini", () => {
    const client = createLlmClient({ OPENAI_API_KEY: "sk-test" });
    expect(client).toBeInstanceOf(OpenAiLlmClient);
    expect(client.provider).toBe("openai");
    expect(client.model).toBe("gpt-4o-mini");
  });

  it("honours LLM_MODEL override", () => {
    const client = createLlmClient({
      LLM_PROVIDER: "openai",
      LLM_MODEL: "gpt-4.1-nano",
      OPENAI_API_KEY: "sk-test",
    });
    expect(client.model).toBe("gpt-4.1-nano");
  });

  it("constructs an Anthropic client with the default Haiku model", () => {
    const client = createLlmClient({
      LLM_PROVIDER: "anthropic",
      ANTHROPIC_API_KEY: "ant-test",
    });
    expect(client).toBeInstanceOf(AnthropicLlmClient);
    expect(client.provider).toBe("anthropic");
    expect(client.model).toBe("claude-3-5-haiku-latest");
  });

  it("constructs a Groq client with the default Llama model", () => {
    const client = createLlmClient({
      LLM_PROVIDER: "groq",
      GROQ_API_KEY: "gsk-test",
    });
    expect(client).toBeInstanceOf(GroqLlmClient);
    expect(client.provider).toBe("groq");
    expect(client.model).toBe("llama-3.3-70b-versatile");
  });

  it("throws when the API key for the selected provider is missing", () => {
    expect(() => createLlmClient({ LLM_PROVIDER: "openai" })).toThrow(LlmInvocationError);
    expect(() => createLlmClient({ LLM_PROVIDER: "anthropic" })).toThrow(LlmInvocationError);
    expect(() => createLlmClient({ LLM_PROVIDER: "groq" })).toThrow(LlmInvocationError);
  });

  it("rejects unsupported providers", () => {
    expect(() => createLlmClient({ LLM_PROVIDER: "cohere", OPENAI_API_KEY: "sk-test" })).toThrow(
      LlmInvocationError,
    );
  });
});
