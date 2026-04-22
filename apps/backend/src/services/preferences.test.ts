import { describe, expect, it } from "vitest";
import { mapDbRowToPreferences } from "./preferences.js";

describe("mapDbRowToPreferences", () => {
  it("maps a fully populated row to the shared preferences shape", () => {
    const result = mapDbRowToPreferences({
      user_id: "00000000-0000-0000-0000-000000000000",
      experience_years: 7,
      roles: ["backend", "platform"],
      tech_stack: ["typescript", "node.js"],
      locations: ["remote"],
      work_type: ["remote", "hybrid"],
      min_salary: "150k",
      deal_breakers: ["on-call > 1 week/month"],
    });

    expect(result).toEqual({
      experienceYears: 7,
      roles: ["backend", "platform"],
      techStack: ["typescript", "node.js"],
      locations: ["remote"],
      workType: ["remote", "hybrid"],
      minSalary: "150k",
      dealBreakers: ["on-call > 1 week/month"],
    });
  });

  it("fills in defaults for nullable columns", () => {
    const result = mapDbRowToPreferences({
      user_id: "00000000-0000-0000-0000-000000000000",
      experience_years: null,
      roles: null,
      tech_stack: null,
      locations: null,
      work_type: null,
      min_salary: null,
      deal_breakers: null,
    });

    expect(result.experienceYears).toBe(0);
    expect(result.roles).toEqual([]);
    expect(result.techStack).toEqual([]);
    expect(result.workType).toEqual([]);
    expect(result.minSalary).toBe("");
  });
});
