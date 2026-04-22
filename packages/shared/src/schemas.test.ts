import { describe, expect, it } from "vitest";
import { buildPrompt, truncateDescription } from "./prompt.js";
import { AnalyzeRequestSchema, AnalyzeResultSchema, UserPreferencesSchema } from "./schemas.js";

describe("UserPreferencesSchema", () => {
  it("applies defaults for optional array fields", () => {
    const parsed = UserPreferencesSchema.parse({ experienceYears: 5 });

    expect(parsed.experienceYears).toBe(5);
    expect(parsed.roles).toEqual([]);
    expect(parsed.techStack).toEqual([]);
    expect(parsed.workType).toEqual([]);
  });

  it("rejects invalid work mode values", () => {
    expect(() =>
      UserPreferencesSchema.parse({
        experienceYears: 3,
        workType: ["on-the-moon"],
      }),
    ).toThrow();
  });
});

describe("AnalyzeRequestSchema", () => {
  it("requires a non-empty title and description", () => {
    expect(() =>
      AnalyzeRequestSchema.parse({
        job: { title: "", company: "x", description: "y" },
      }),
    ).toThrow();

    expect(() =>
      AnalyzeRequestSchema.parse({
        job: { title: "x", company: "x", description: "" },
      }),
    ).toThrow();

    const ok = AnalyzeRequestSchema.parse({
      job: { title: "SWE", company: "Acme", description: "Build stuff" },
    });

    expect(ok.job.title).toBe("SWE");
  });
});

describe("AnalyzeResultSchema", () => {
  it("clamps fit score to 0-100", () => {
    expect(() =>
      AnalyzeResultSchema.parse({
        fitScore: 101,
        matches: [],
        mismatches: [],
        summary: "x",
      }),
    ).toThrow();

    expect(() =>
      AnalyzeResultSchema.parse({
        fitScore: -1,
        matches: [],
        mismatches: [],
        summary: "x",
      }),
    ).toThrow();

    const ok = AnalyzeResultSchema.parse({
      fitScore: 73,
      matches: [{ label: "Node.js" }],
      mismatches: [{ label: "Experience gap", detail: "Requires 6+ years, candidate has 5" }],
      summary: "ok",
    });

    expect(ok.fitScore).toBe(73);
  });

  it("requires non-empty short labels and allows optional detail", () => {
    expect(() =>
      AnalyzeResultSchema.parse({
        fitScore: 73,
        matches: [{ label: "" }],
        mismatches: [],
        summary: "ok",
      }),
    ).toThrow();

    const ok = AnalyzeResultSchema.parse({
      fitScore: 60,
      matches: [{ label: "Remote" }],
      mismatches: [{ label: "On-call expectation" }],
      summary: "Good fit with one concern.",
    });

    expect(ok.matches[0]?.label).toBe("Remote");
    expect(ok.matches[0]?.detail).toBeUndefined();
  });
});

describe("truncateDescription", () => {
  it("leaves short input untouched", () => {
    expect(truncateDescription("short")).toBe("short");
  });

  it("trims very long input and appends marker", () => {
    const long = "a".repeat(20_000);
    const out = truncateDescription(long, 1000);

    expect(out.length).toBeLessThan(long.length);
    expect(out.endsWith("[...truncated for length]")).toBe(true);
  });
});

describe("buildPrompt", () => {
  it("embeds job details and candidate preferences", () => {
    const prefs = UserPreferencesSchema.parse({
      experienceYears: 5,
      roles: ["backend"],
      techStack: ["node.js", "typescript"],
      locations: ["remote"],
      workType: ["remote"],
    });

    const { system, user } = buildPrompt({
      job: {
        title: "Senior Backend Engineer",
        company: "Acme",
        location: "Remote",
        description: "Build distributed systems in Node.js and TypeScript.",
      },
      userPreferences: prefs,
    });

    expect(system).toMatch(/job-fit evaluation engine/);
    expect(user).toMatch(/Senior Backend Engineer/);
    expect(user).toMatch(/node\.js/);
    expect(user).toMatch(/Respond with JSON only\./);
  });
});
