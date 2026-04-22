import type { AnalyzeResult, JobData } from "@job-fit/shared";

export type AnalysisStatus = "idle" | "loading" | "result" | "error";

export interface AnalysisState {
  readonly status: AnalysisStatus;
  /** The job the current result / error was produced for. Null while idle. */
  readonly jobKey: string | null;
  readonly result: AnalyzeResult | null;
  readonly error: string | null;
}

export const INITIAL_ANALYSIS_STATE: AnalysisState = {
  status: "idle",
  jobKey: null,
  result: null,
  error: null,
};

export type AnalysisEvent =
  | { readonly type: "CHECK"; readonly jobKey: string }
  | { readonly type: "SUCCESS"; readonly jobKey: string; readonly result: AnalyzeResult }
  | { readonly type: "FAILURE"; readonly jobKey: string; readonly error: string }
  | { readonly type: "RESET" };

/**
 * Pure reducer for the "Check Match Score" flow. Kept as a plain function so
 * we can exhaustively test the state transitions without mounting React.
 *
 * Late-arriving async results are guarded by `jobKey`: if the user switches
 * jobs mid-flight, the SUCCESS/FAILURE for the old job is dropped instead of
 * replacing the newer state.
 */
export function analysisReducer(state: AnalysisState, event: AnalysisEvent): AnalysisState {
  switch (event.type) {
    case "CHECK":
      return {
        status: "loading",
        jobKey: event.jobKey,
        result: null,
        error: null,
      };
    case "SUCCESS":
      if (state.status !== "loading" || state.jobKey !== event.jobKey) return state;
      return {
        status: "result",
        jobKey: event.jobKey,
        result: event.result,
        error: null,
      };
    case "FAILURE":
      if (state.status !== "loading" || state.jobKey !== event.jobKey) return state;
      return {
        status: "error",
        jobKey: event.jobKey,
        result: null,
        error: event.error,
      };
    case "RESET":
      return INITIAL_ANALYSIS_STATE;
    default: {
      const never: never = event;
      return never;
    }
  }
}

/**
 * Stable identity for a `JobData`. LinkedIn reuses job IDs across reloads,
 * but we also want the identity to shift if the extractor picks up a
 * materially different description (e.g. translation toggled). Hashing the
 * full description would be overkill for an in-memory guard; the first 200
 * characters are a good trade-off between uniqueness and stability.
 */
export function buildJobKey(job: JobData): string {
  const descriptionFingerprint = job.description.slice(0, 200);
  return `${job.title}|${job.company}|${job.location}|${descriptionFingerprint}`;
}
