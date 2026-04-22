import type { LlmClient } from "@job-fit/llm";
import type { AnalyzeRequest, AnalyzeResult, UserPreferences } from "@job-fit/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import type { AuthenticatedSession, SessionFactory } from "./auth/session.js";
import type { AppConfig } from "./config.js";
import { PreferencesMissingError, UnauthenticatedError } from "./errors.js";
import { createAnalyzeService } from "./services/analyze.js";

const TEST_CONFIG: AppConfig = {
  nodeEnv: "test",
  port: 0,
  host: "127.0.0.1",
  logLevel: "error",
  corsAllowedOrigins: [],
  supabase: {
    url: "https://example.supabase.co",
    publishableKey: "sb_publishable_test",
  },
  llm: { temperature: 0.2, maxOutputTokens: 600 },
};

const SAMPLE_PREFS: UserPreferences = {
  experienceYears: 5,
  roles: ["backend"],
  techStack: ["typescript", "node.js"],
  locations: ["remote"],
  workType: ["remote"],
  minSalary: "",
  dealBreakers: [],
};

const SAMPLE_RESULT: AnalyzeResult = {
  fitScore: 82,
  matches: [{ label: "Remote" }, { label: "TypeScript" }],
  mismatches: [],
  summary: "Strong fit based on stack alignment and remote work preference.",
};

function buildSampleRequest(): AnalyzeRequest {
  return {
    job: {
      title: "Senior Backend Engineer",
      company: "Acme",
      location: "Remote",
      description: "Build distributed services in Node.js and TypeScript...",
    },
  };
}

interface FakeSessionOptions {
  readonly userId?: string;
  readonly prefsError?: Error;
  readonly prefs?: UserPreferences;
}

function createFakeSessionFactory(options: FakeSessionOptions = {}): SessionFactory {
  return {
    async fromAuthHeader(header) {
      if (!header?.startsWith("Bearer ")) {
        throw new UnauthenticatedError("Authorization header is required");
      }
      const session: AuthenticatedSession = {
        userId: options.userId ?? "user-1",
        async fetchPreferences() {
          if (options.prefsError) throw options.prefsError;
          return options.prefs ?? SAMPLE_PREFS;
        },
      };
      return session;
    },
  };
}

interface FakeLlmOptions {
  readonly result?: AnalyzeResult;
  readonly error?: Error;
}

function createFakeLlmClient(options: FakeLlmOptions = {}): LlmClient {
  return {
    provider: "openai",
    model: "fake-model",
    async complete() {
      if (options.error) throw options.error;
      return (options.result ?? SAMPLE_RESULT) as never;
    },
  };
}

async function buildTestApp(
  sessionFactory: SessionFactory,
  llmClient: LlmClient = createFakeLlmClient(),
) {
  const analyzeService = createAnalyzeService(llmClient, {
    temperature: TEST_CONFIG.llm.temperature,
    maxOutputTokens: TEST_CONFIG.llm.maxOutputTokens,
  });
  return buildApp({ config: TEST_CONFIG, sessionFactory, analyzeService });
}

describe("POST /analyze", () => {
  let request: AnalyzeRequest;
  beforeEach(() => {
    request = buildSampleRequest();
  });

  it("returns 200 with a validated result when auth + prefs are valid", async () => {
    const app = await buildTestApp(createFakeSessionFactory());
    const response = await app.inject({
      method: "POST",
      url: "/analyze",
      headers: { authorization: "Bearer valid-jwt", "content-type": "application/json" },
      payload: request,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(SAMPLE_RESULT);
    await app.close();
  });

  it("returns 401 when the Authorization header is missing", async () => {
    const app = await buildTestApp(createFakeSessionFactory());
    const response = await app.inject({
      method: "POST",
      url: "/analyze",
      headers: { "content-type": "application/json" },
      payload: request,
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe("missing_auth");
    await app.close();
  });

  it("returns 422 when preferences are missing for the user", async () => {
    const app = await buildTestApp(
      createFakeSessionFactory({ prefsError: new PreferencesMissingError() }),
    );
    const response = await app.inject({
      method: "POST",
      url: "/analyze",
      headers: { authorization: "Bearer valid-jwt", "content-type": "application/json" },
      payload: request,
    });

    expect(response.statusCode).toBe(422);
    expect(response.json().error.code).toBe("preferences_not_found");
    await app.close();
  });

  it("returns 400 with Zod issues for malformed payloads", async () => {
    const app = await buildTestApp(createFakeSessionFactory());
    const response = await app.inject({
      method: "POST",
      url: "/analyze",
      headers: { authorization: "Bearer valid-jwt", "content-type": "application/json" },
      payload: { job: { title: "", company: "", description: "" } },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("invalid_request");
    expect(Array.isArray(response.json().error.issues)).toBe(true);
    await app.close();
  });
});

describe("GET /health", () => {
  it("responds with status ok", async () => {
    const app = await buildTestApp(createFakeSessionFactory());
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
    await app.close();
  });
});
