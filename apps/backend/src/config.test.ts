import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";

const BASE_ENV = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  BACKEND_PORT: "4001",
  BACKEND_LOG_LEVEL: "warn",
  BACKEND_CORS_ORIGINS: "https://app.example.com, https://other.example.com",
};

describe("loadConfig", () => {
  it("parses a complete valid environment", () => {
    const config = loadConfig(BASE_ENV);

    expect(config.port).toBe(4001);
    expect(config.logLevel).toBe("warn");
    expect(config.corsAllowedOrigins).toEqual([
      "https://app.example.com",
      "https://other.example.com",
    ]);
    expect(config.supabase.url).toBe("https://example.supabase.co");
    expect(config.llm.temperature).toBe(0.2);
    expect(config.llm.maxOutputTokens).toBe(600);
  });

  it("throws a descriptive error when Supabase settings are missing", () => {
    expect(() => loadConfig({})).toThrow(/Invalid backend configuration/);
  });

  it("rejects invalid log levels", () => {
    expect(() =>
      loadConfig({
        ...BASE_ENV,
        BACKEND_LOG_LEVEL: "silly",
      }),
    ).toThrow(/logLevel/);
  });

  it("rejects malformed CORS origins", () => {
    expect(() =>
      loadConfig({
        ...BASE_ENV,
        BACKEND_CORS_ORIGINS: "not-a-url",
      }),
    ).toThrow(/corsAllowedOrigins/);
  });
});
