import { AnalyzeResultSchema, type JobData } from "@job-fit/shared";
import { describe, expect, it } from "vitest";
import { buildDeterministicResult, createMockAnalyze } from "./analyze";

const JOB: JobData = {
  title: "Senior Backend Engineer",
  company: "Acme",
  location: "Remote",
  description: "Node.js + TypeScript + Postgres. Remote friendly. No on-call rotations.",
};

describe("buildDeterministicResult", () => {
  it("produces an AnalyzeResult that satisfies the shared schema", () => {
    const result = buildDeterministicResult(JOB);
    expect(() => AnalyzeResultSchema.parse(result)).not.toThrow();
    expect(result.fitScore).toBeGreaterThanOrEqual(0);
    expect(result.fitScore).toBeLessThanOrEqual(100);
  });

  it("is deterministic for the same input", () => {
    const a = buildDeterministicResult(JOB);
    const b = buildDeterministicResult({ ...JOB });
    expect(a).toEqual(b);
  });

  it("varies the score between different postings", () => {
    const a = buildDeterministicResult(JOB);
    const b = buildDeterministicResult({
      ...JOB,
      title: "Java Lead",
      description: "Java, on-call rotations, relocation required, 10+ years.",
    });
    expect(a.fitScore).not.toBe(b.fitScore);
  });

  it("falls back to generic signals when no tokens match", () => {
    const blank = buildDeterministicResult({
      title: "Gardener",
      company: "GreenThumb",
      location: "",
      description: "Plant flowers, mow lawns.",
    });
    expect(blank.matches.length).toBeGreaterThan(0);
    expect(blank.mismatches.length).toBeGreaterThan(0);
  });
});

describe("createMockAnalyze", () => {
  it("resolves with the deterministic result after the configured delay", async () => {
    const analyze = createMockAnalyze({ latencyMs: 0, failureRate: 0 });
    const result = await analyze(JOB);
    expect(result).toEqual(buildDeterministicResult(JOB));
  });

  it("rejects with AbortError when the signal is already aborted", async () => {
    const analyze = createMockAnalyze({ latencyMs: 0 });
    const controller = new AbortController();
    controller.abort();
    await expect(analyze(JOB, { signal: controller.signal })).rejects.toMatchObject({
      name: "AbortError",
    });
  });

  it("rejects with AbortError when aborted mid-flight", async () => {
    const analyze = createMockAnalyze({ latencyMs: 50 });
    const controller = new AbortController();
    const promise = analyze(JOB, { signal: controller.signal });
    controller.abort();
    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
  });
});
