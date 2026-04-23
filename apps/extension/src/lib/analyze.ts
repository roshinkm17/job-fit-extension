import type { AnalyzeResult, JobData } from "@job-fit/shared";
import type { AnalyzeFn, AnalyzeOptions } from "./analyze-types";
import { createHttpAnalyze } from "./api";
import { readEnv } from "./env";
import { getValidAccessToken } from "./supabase";

export type { AnalyzeFn, AnalyzeOptions } from "./analyze-types";
export { createHttpAnalyze } from "./api";

/** @deprecated Use `analyzeForContent` (respects env + test overrides). */
export const analyzeJob: AnalyzeFn = (job, options) => analyzeForContent(job, options);

export function getAnalyze(): AnalyzeFn {
  if (cached) return cached;
  if (isMockMode()) {
    cached = createMockAnalyze();
  } else {
    const env = readEnv();
    cached = createHttpAnalyze({
      endpoint: env.backendUrl,
      getAccessToken: getValidAccessToken,
    });
  }
  return cached;
}

let testOverride: AnalyzeFn | null = null;
let cached: AnalyzeFn | null = null;

/**
 * The live entry for the content script. Tests can inject a stub with
 * `__setAnalyzeForTests` without importing Plasmo env.
 */
export const analyzeForContent: AnalyzeFn = (job, options) =>
  (testOverride ?? getAnalyze())(job, options);

export function __setAnalyzeForTests(next: AnalyzeFn | null): void {
  testOverride = next;
  cached = null;
}

function isMockMode(): boolean {
  if (typeof process === "undefined" || !process?.env) return false;
  if ((process.env.NODE_ENV as string | undefined) === "test") return true;
  const v = process.env.PLASMO_PUBLIC_USE_MOCK_ANALYZE;
  return v === "1" || v === "true" || v === "yes";
}

/** Tunables kept at module scope so tests can shorten the fake latency. */
interface MockConfig {
  readonly latencyMs: number;
  readonly failureRate: number;
}

const DEFAULT_CONFIG: MockConfig = { latencyMs: 900, failureRate: 0 };

export function createMockAnalyze(overrides: Partial<MockConfig> = {}): AnalyzeFn {
  const config: MockConfig = { ...DEFAULT_CONFIG, ...overrides };
  return (job, options) => runMockAnalyze(job, config, options);
}

function runMockAnalyze(
  job: JobData,
  config: MockConfig,
  options: AnalyzeOptions | undefined,
): Promise<AnalyzeResult> {
  return new Promise<AnalyzeResult>((resolve, reject) => {
    if (options?.signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const timer = setTimeout(() => {
      options?.signal?.removeEventListener("abort", onAbort);
      if (Math.random() < config.failureRate) {
        reject(new Error("Mock analyze failed"));
        return;
      }
      resolve(buildDeterministicResult(job));
    }, config.latencyMs);

    function onAbort() {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    }

    options?.signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * The mock should feel real: the score and tags should vary based on the job
 * so toggling between LinkedIn postings produces visibly different output.
 * Everything here is deterministic given the job text.
 */
export function buildDeterministicResult(job: JobData): AnalyzeResult {
  const haystack = `${job.title} ${job.description}`.toLowerCase();

  const matches = pickTags(POSITIVE_SIGNALS, haystack, 4, [
    { label: "Engineering role", detail: "Title looks aligned" },
  ]);
  const mismatches = pickTags(NEGATIVE_SIGNALS, haystack, 3, [
    { label: "Details to confirm", detail: "Compensation not specified" },
  ]);

  const seed = hash(`${job.title}|${job.company}|${job.location}`);
  const base = 55 + (seed % 35); // 55 - 89
  const adjustment = matches.length * 2 - mismatches.length * 3;
  const fitScore = clamp(base + adjustment, 5, 97);

  const summary = buildSummary(job, fitScore);

  return { fitScore, matches, mismatches, summary };
}

interface SignalDef {
  readonly token: string;
  readonly label: string;
  readonly detail: string;
}

const POSITIVE_SIGNALS: readonly SignalDef[] = [
  { token: "remote", label: "Remote", detail: "Posting supports remote work" },
  { token: "typescript", label: "TypeScript", detail: "Core stack match" },
  { token: "node", label: "Node.js", detail: "Backend stack match" },
  { token: "react", label: "React", detail: "Frontend stack match" },
  { token: "postgres", label: "Postgres", detail: "Database stack match" },
  { token: "senior", label: "Seniority", detail: "Seniority level looks aligned" },
  { token: "staff", label: "Seniority", detail: "Staff-level scope" },
  { token: "platform", label: "Platform work", detail: "Platform-oriented role" },
];

const NEGATIVE_SIGNALS: readonly SignalDef[] = [
  { token: "on-call", label: "On-call", detail: "On-call rotations mentioned" },
  { token: "on call", label: "On-call", detail: "On-call rotations mentioned" },
  { token: "java", label: "Java", detail: "Primary stack is Java" },
  { token: "c#", label: "C#", detail: "Primary stack is C#" },
  { token: "relocation", label: "Relocation", detail: "Relocation expected" },
  { token: "clearance", label: "Clearance", detail: "Security clearance required" },
  { token: "10+ years", label: "Experience bar", detail: "10+ years required" },
];

function pickTags(
  signals: readonly SignalDef[],
  haystack: string,
  max: number,
  fallback: readonly { label: string; detail?: string }[],
): { label: string; detail?: string }[] {
  const seen = new Set<string>();
  const hits: { label: string; detail?: string }[] = [];
  for (const signal of signals) {
    if (hits.length >= max) break;
    if (!haystack.includes(signal.token) || seen.has(signal.label)) continue;
    seen.add(signal.label);
    hits.push({ label: signal.label, detail: signal.detail });
  }
  if (hits.length === 0) return [...fallback];
  return hits;
}

function buildSummary(job: JobData, fitScore: number): string {
  if (fitScore >= 80) {
    return `Strong overall fit for ${job.title} at ${job.company}. Most preferences align with the posting.`;
  }
  if (fitScore >= 60) {
    return `Decent match for ${job.title} at ${job.company}. A few gaps to double-check before applying.`;
  }
  if (fitScore >= 40) {
    return `Mixed signal on ${job.title} at ${job.company}. Worth reviewing the mismatches carefully.`;
  }
  return `Low alignment on ${job.title} at ${job.company}. Consider whether the mismatches are deal breakers.`;
}

function hash(input: string): number {
  let value = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return Math.abs(value | 0);
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
