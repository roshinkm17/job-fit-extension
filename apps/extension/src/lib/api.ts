import {
  AnalyzeRequestSchema,
  type AnalyzeResult,
  AnalyzeResultSchema,
  type JobData,
} from "@job-fit/shared";
import { z } from "zod";
import type { AnalyzeFn, AnalyzeOptions } from "./analyze-types";
import { AnalyzeError, DEFAULT_MESSAGES, mapBackendErrorCode } from "./api-errors";
import { getExtensionSupabase } from "./supabase";

const BackendErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string().optional(),
  }),
});

export interface HttpAnalyzeConfig {
  readonly endpoint: string;
  /** Resolves the current access token, returning null when the user is signed out. */
  readonly getAccessToken: () => Promise<string | null>;
  /** Injectable for tests. Defaults to `globalThis.fetch`. */
  readonly fetchImpl?: typeof fetch;
}

/**
 * Builds an `AnalyzeFn` that POSTs to the Fastify `/analyze` endpoint with a
 * Supabase bearer token. All failure paths (no session, network down,
 * 4xx/5xx with structured body, malformed response, abort) funnel through
 * `AnalyzeError` so the UI layer never has to parse ad-hoc strings.
 */
export function createHttpAnalyze(config: HttpAnalyzeConfig): AnalyzeFn {
  const fetchImpl = config.fetchImpl ?? fetch;
  const url = joinUrl(config.endpoint, "/analyze");

  return (job, options) =>
    runAnalyzeWithHttp({ fetchImpl, url, getAccessToken: config.getAccessToken, job, options });
}

async function runAnalyzeWithHttp(ctx: {
  readonly fetchImpl: typeof fetch;
  readonly url: string;
  readonly getAccessToken: () => Promise<string | null>;
  readonly job: JobData;
  readonly options: AnalyzeOptions | undefined;
}): Promise<AnalyzeResult> {
  const token = await ctx.getAccessToken();
  if (!token) {
    throw new AnalyzeError("unauthenticated", DEFAULT_MESSAGES.unauthenticated);
  }
  const body = JSON.stringify(AnalyzeRequestSchema.parse({ job: ctx.job }));
  const doFetch = buildDoFetch(ctx.fetchImpl, ctx.url, body, ctx.options);
  const first = await doFetchWithCatch(doFetch, token);
  const response = first.status === 401 ? await refreshAndRefetch(doFetch) : first;
  if (!response.ok) {
    throw await readBackendError(response);
  }
  const resultJson = await safeJson(response);
  const parsed = AnalyzeResultSchema.safeParse(resultJson);
  if (!parsed.success) {
    throw new AnalyzeError("invalid_response", DEFAULT_MESSAGES.invalid_response, response.status);
  }
  return parsed.data;
}

function buildDoFetch(
  fetchImpl: typeof fetch,
  url: string,
  body: string,
  options: AnalyzeOptions | undefined,
) {
  return (accessToken: string) => {
    const init: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body,
    };
    if (options?.signal) {
      init.signal = options.signal;
    }
    return fetchImpl(url, init);
  };
}

async function doFetchWithCatch(
  doFetch: (accessToken: string) => Promise<Response>,
  accessToken: string,
): Promise<Response> {
  try {
    return await doFetch(accessToken);
  } catch (cause) {
    throw mapFetchError(cause);
  }
}

function mapFetchError(cause: unknown): AnalyzeError {
  if (isAbortError(cause)) {
    return new AnalyzeError("aborted", DEFAULT_MESSAGES.aborted);
  }
  return new AnalyzeError("network", DEFAULT_MESSAGES.network);
}

async function refreshAndRefetch(
  doFetch: (accessToken: string) => Promise<Response>,
): Promise<Response> {
  const { data, error } = await getExtensionSupabase().auth.refreshSession();
  if (error || !data.session) {
    throw new AnalyzeError("unauthenticated", DEFAULT_MESSAGES.unauthenticated, 401);
  }
  try {
    return await doFetch(data.session.access_token);
  } catch (cause) {
    throw mapFetchError(cause);
  }
}

async function readBackendError(response: Response): Promise<AnalyzeError> {
  const body = await safeJson(response);
  const parsed = BackendErrorSchema.safeParse(body);
  if (!parsed.success) {
    return new AnalyzeError(
      response.status >= 500 ? "server_error" : "unknown",
      DEFAULT_MESSAGES.server_error,
      response.status,
    );
  }
  const code = mapBackendErrorCode(parsed.data.error.code);
  const message = parsed.data.error.message?.trim() || DEFAULT_MESSAGES[code];
  return new AnalyzeError(code, message, response.status);
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.message.toLowerCase().includes("abort"))
  );
}

function joinUrl(base: string, path: string): string {
  const trimmedBase = base.replace(/\/+$/, "");
  const trimmedPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimmedBase}${trimmedPath}`;
}
