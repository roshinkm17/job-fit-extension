import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AnalyzeRequestSchema,
  AnalyzeResultSchema,
  UserPreferencesSchema,
} from "./schemas.js";
import { buildPrompt, truncateDescription } from "./prompt.js";

test("UserPreferencesSchema applies defaults", () => {
  const parsed = UserPreferencesSchema.parse({ experienceYears: 5 });
  assert.equal(parsed.experienceYears, 5);
  assert.deepEqual(parsed.roles, []);
  assert.deepEqual(parsed.techStack, []);
  assert.deepEqual(parsed.workType, []);
});

test("UserPreferencesSchema rejects invalid work mode", () => {
  assert.throws(() =>
    UserPreferencesSchema.parse({ experienceYears: 3, workType: ["on-the-moon"] as unknown as [] }),
  );
});

test("AnalyzeRequestSchema requires job title and description", () => {
  assert.throws(() =>
    AnalyzeRequestSchema.parse({ job: { title: "", company: "x", description: "y" } }),
  );
  assert.throws(() =>
    AnalyzeRequestSchema.parse({ job: { title: "x", company: "x", description: "" } }),
  );
  const ok = AnalyzeRequestSchema.parse({
    job: { title: "SWE", company: "Acme", description: "Build stuff" },
  });
  assert.equal(ok.job.title, "SWE");
});

test("AnalyzeResultSchema clamps score range", () => {
  assert.throws(() =>
    AnalyzeResultSchema.parse({ fitScore: 101, matches: [], mismatches: [], summary: "x" }),
  );
  assert.throws(() =>
    AnalyzeResultSchema.parse({ fitScore: -1, matches: [], mismatches: [], summary: "x" }),
  );
  const ok = AnalyzeResultSchema.parse({
    fitScore: 73,
    matches: ["good"],
    mismatches: ["bad"],
    summary: "ok",
  });
  assert.equal(ok.fitScore, 73);
});

test("truncateDescription leaves short input untouched", () => {
  assert.equal(truncateDescription("short"), "short");
});

test("truncateDescription trims very long input", () => {
  const long = "a".repeat(20_000);
  const out = truncateDescription(long, 1000);
  assert.ok(out.length < long.length);
  assert.ok(out.endsWith("[...truncated for length]"));
});

test("buildPrompt includes job title and preferences", () => {
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
  assert.match(system, /job-fit evaluation engine/);
  assert.match(user, /Senior Backend Engineer/);
  assert.match(user, /node\.js/);
  assert.match(user, /Respond with JSON only\./);
});
