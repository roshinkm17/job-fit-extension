import type { AnalyzeResult, JobData } from "@job-fit/shared";
import { describe, expect, it } from "vitest";
import {
  type AnalysisState,
  analysisReducer,
  buildJobKey,
  INITIAL_ANALYSIS_STATE,
} from "./analyze-machine";

const JOB_A: JobData = {
  title: "Senior Backend Engineer",
  company: "Acme",
  location: "Remote",
  description: "Own Node.js services at scale.",
};

const JOB_B: JobData = {
  title: "Staff Platform Engineer",
  company: "Initech",
  location: "Austin, TX",
  description: "Own developer tooling across the org.",
};

const RESULT: AnalyzeResult = {
  fitScore: 72,
  matches: [{ label: "Node.js" }],
  mismatches: [{ label: "On-call" }],
  summary: "Strong stack match, some concerns on on-call.",
};

const LOADING_STATE: AnalysisState = {
  status: "loading",
  jobKey: buildJobKey(JOB_A),
  result: null,
  error: null,
  errorCode: null,
};

describe("analysisReducer", () => {
  it("CHECK moves to loading and stamps the jobKey", () => {
    const next = analysisReducer(INITIAL_ANALYSIS_STATE, {
      type: "CHECK",
      jobKey: buildJobKey(JOB_A),
    });
    expect(next.status).toBe("loading");
    expect(next.jobKey).toBe(buildJobKey(JOB_A));
    expect(next.result).toBeNull();
    expect(next.error).toBeNull();
    expect(next.errorCode).toBeNull();
  });

  it("SUCCESS moves to result when jobKey matches the in-flight request", () => {
    const next = analysisReducer(LOADING_STATE, {
      type: "SUCCESS",
      jobKey: buildJobKey(JOB_A),
      result: RESULT,
    });
    expect(next.status).toBe("result");
    expect(next.result).toEqual(RESULT);
  });

  it("FAILURE moves to error when jobKey matches", () => {
    const next = analysisReducer(LOADING_STATE, {
      type: "FAILURE",
      jobKey: buildJobKey(JOB_A),
      error: "boom",
      errorCode: "network",
    });
    expect(next.status).toBe("error");
    expect(next.error).toBe("boom");
    expect(next.errorCode).toBe("network");
  });

  it("drops late SUCCESS for a superseded job", () => {
    const next = analysisReducer(LOADING_STATE, {
      type: "SUCCESS",
      jobKey: buildJobKey(JOB_B),
      result: RESULT,
    });
    expect(next).toBe(LOADING_STATE);
  });

  it("drops late FAILURE for a superseded job", () => {
    const next = analysisReducer(LOADING_STATE, {
      type: "FAILURE",
      jobKey: buildJobKey(JOB_B),
      error: "boom",
    });
    expect(next).toBe(LOADING_STATE);
  });

  it("ignores SUCCESS when already settled", () => {
    const settled: AnalysisState = {
      status: "result",
      jobKey: buildJobKey(JOB_A),
      result: RESULT,
      error: null,
      errorCode: null,
    };
    const next = analysisReducer(settled, {
      type: "SUCCESS",
      jobKey: buildJobKey(JOB_A),
      result: { ...RESULT, fitScore: 9 },
    });
    expect(next).toBe(settled);
  });

  it("RESET returns to the initial idle state", () => {
    const settled: AnalysisState = {
      status: "error",
      jobKey: buildJobKey(JOB_A),
      result: null,
      error: "nope",
      errorCode: "unknown",
    };
    expect(analysisReducer(settled, { type: "RESET" })).toEqual(INITIAL_ANALYSIS_STATE);
  });
});

describe("buildJobKey", () => {
  it("is stable for identical inputs", () => {
    expect(buildJobKey(JOB_A)).toBe(buildJobKey({ ...JOB_A }));
  });

  it("changes when the title or company differs", () => {
    expect(buildJobKey(JOB_A)).not.toBe(buildJobKey(JOB_B));
  });

  it("only hashes the first 200 description characters", () => {
    const short: JobData = { ...JOB_A, description: "short" };
    const long: JobData = { ...JOB_A, description: `short${"x".repeat(2000)}` };
    expect(buildJobKey(short)).not.toBe(buildJobKey(long));
    const longA: JobData = { ...JOB_A, description: `a${"x".repeat(300)}b` };
    const longB: JobData = { ...JOB_A, description: `a${"x".repeat(300)}c` };
    expect(buildJobKey(longA)).toBe(buildJobKey(longB));
  });
});
