import type { AnalyzeResult, JobData } from "@job-fit/shared";

export interface AnalyzeOptions {
  readonly signal?: AbortSignal;
}

/**
 * The contract every analyzer implementation (mock, HTTP) must follow.
 */
export type AnalyzeFn = (job: JobData, options?: AnalyzeOptions) => Promise<AnalyzeResult>;
