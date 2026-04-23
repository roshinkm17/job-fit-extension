import { AnalyzeResultSchema, type JobData } from "@job-fit/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createHttpAnalyze } from "./api";

const JOB: JobData = {
  title: "Backend Engineer",
  company: "Acme",
  location: "Remote",
  description: "Build APIs.",
};

const OK = {
  fitScore: 70,
  matches: [{ label: "Remote" }],
  mismatches: [{ label: "Gap" }],
  summary: "Okay fit.",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createHttpAnalyze", () => {
  it("POSTs JSON and returns a parsed AnalyzeResult on 200", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => OK,
    });
    const analyze = createHttpAnalyze({
      endpoint: "http://localhost:3000",
      getAccessToken: async () => "token-1",
      fetchImpl,
    });
    const result = await analyze(JOB);
    expect(() => AnalyzeResultSchema.parse(result)).not.toThrow();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    expect(init).toBeDefined();
    expect(init.headers).toMatchObject({
      Authorization: "Bearer token-1",
    });
  });

  it("throws AnalyzeError with preferences_missing on 422", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        error: { code: "preferences_not_found", message: "no row" },
      }),
    });
    const analyze = createHttpAnalyze({
      endpoint: "http://localhost:3000",
      getAccessToken: async () => "token-1",
      fetchImpl,
    });
    await expect(analyze(JOB)).rejects.toMatchObject({
      name: "AnalyzeError",
      code: "preferences_missing",
    });
  });

  it("throws unauthenticated when there is no access token", async () => {
    const analyze = createHttpAnalyze({
      endpoint: "http://localhost:3000",
      getAccessToken: async () => null,
    });
    await expect(analyze(JOB)).rejects.toMatchObject({
      name: "AnalyzeError",
      code: "unauthenticated",
    });
  });
});
