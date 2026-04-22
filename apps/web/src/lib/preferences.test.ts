import { describe, expect, it } from "vitest";
import { EMPTY_PREFERENCES, mapPreferencesToRow, mapRowToPreferences } from "./preferences";

describe("mapRowToPreferences", () => {
  it("fills defaults for partial rows", () => {
    expect(mapRowToPreferences({ user_id: "u1" })).toEqual(EMPTY_PREFERENCES);
  });

  it("maps a fully populated row", () => {
    const result = mapRowToPreferences({
      user_id: "u1",
      experience_years: 5,
      roles: ["backend"],
      tech_stack: ["typescript"],
      locations: ["remote"],
      work_type: ["remote", "hybrid"],
      min_salary: "180k",
      deal_breakers: ["on-call"],
    });

    expect(result).toEqual({
      experienceYears: 5,
      roles: ["backend"],
      techStack: ["typescript"],
      locations: ["remote"],
      workType: ["remote", "hybrid"],
      minSalary: "180k",
      dealBreakers: ["on-call"],
    });
  });
});

describe("mapPreferencesToRow", () => {
  it("converts camelCase fields back to snake_case columns", () => {
    const row = mapPreferencesToRow("user-1", {
      experienceYears: 7,
      roles: ["platform"],
      techStack: ["node.js", "postgres"],
      locations: ["remote", "berlin"],
      workType: ["remote"],
      minSalary: "",
      dealBreakers: [],
    });

    expect(row).toEqual({
      user_id: "user-1",
      experience_years: 7,
      roles: ["platform"],
      tech_stack: ["node.js", "postgres"],
      locations: ["remote", "berlin"],
      work_type: ["remote"],
      min_salary: "",
      deal_breakers: [],
    });
  });
});
