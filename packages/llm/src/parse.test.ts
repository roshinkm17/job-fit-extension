import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parseJsonWithSchema } from "./parse.js";
import { LlmValidationError } from "./types.js";

const SampleSchema = z.object({
  score: z.number().int().min(0).max(100),
  summary: z.string(),
});

describe("parseJsonWithSchema", () => {
  it("parses plain JSON and validates against the schema", () => {
    const result = parseJsonWithSchema('{"score":42,"summary":"ok"}', SampleSchema, "openai");
    expect(result).toEqual({ score: 42, summary: "ok" });
  });

  it("strips ```json code fences when providers include them", () => {
    const raw = '```json\n{"score":99,"summary":"fenced"}\n```';
    const result = parseJsonWithSchema(raw, SampleSchema, "openai");
    expect(result.score).toBe(99);
  });

  it("strips bare ``` code fences", () => {
    const raw = '```\n{"score":5,"summary":"bare"}\n```';
    const result = parseJsonWithSchema(raw, SampleSchema, "openai");
    expect(result.summary).toBe("bare");
  });

  it("throws LlmValidationError on invalid JSON", () => {
    expect(() => parseJsonWithSchema("not-json", SampleSchema, "groq")).toThrow(LlmValidationError);
  });

  it("throws LlmValidationError when payload fails schema", () => {
    expect(() =>
      parseJsonWithSchema('{"score":200,"summary":"out of range"}', SampleSchema, "anthropic"),
    ).toThrow(LlmValidationError);
  });
});
