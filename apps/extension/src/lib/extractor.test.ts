// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { extractJobData } from "./extractor";
import { LINKEDIN_LEGACY_FIXTURE, LINKEDIN_PENDING_FIXTURE } from "./fixtures/linkedin-legacy";
import {
  LINKEDIN_MODERN_CONTAINER_ONLY_FIXTURE,
  LINKEDIN_MODERN_FIXTURE,
} from "./fixtures/linkedin-modern";
import { LINKEDIN_SDUI_JOB_FIXTURE } from "./fixtures/linkedin-sdui";

function parseFixture(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

describe("extractJobData", () => {
  it("extracts from modern top card without --two-pane container suffix", () => {
    const result = extractJobData(parseFixture(LINKEDIN_MODERN_CONTAINER_ONLY_FIXTURE));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.job.title).toBe("Senior Backend Engineer");
    expect(result.job.company).toBe("Acme Corp");
  });

  it("extracts from the modern two-pane top card", () => {
    const result = extractJobData(parseFixture(LINKEDIN_MODERN_FIXTURE));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.job.title).toBe("Senior Backend Engineer");
    expect(result.job.company).toBe("Acme Corp");
    expect(result.job.location).toBe("San Francisco, CA");
    expect(result.job.description).toContain("Senior Backend Engineer");
    expect(result.job.description).toContain("6+ years of production experience");
    expect(result.job.description).toContain("Remote-first, US time zones");
  });

  it("extracts from hashed SDUI job shell via aria/data-sdui/componentkey hints", () => {
    const result = extractJobData(parseFixture(LINKEDIN_SDUI_JOB_FIXTURE));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.job.title).toBe("Software Engineer II");
    expect(result.job.company).toBe("Honeywell");
    expect(result.job.location).toBe("Bengaluru, Karnataka, India");
    expect(result.job.description).toContain("Honeywell helps organizations");
    expect(result.job.description.toLowerCase()).toContain("about us");
  });

  it("extracts from the legacy unified top card", () => {
    const result = extractJobData(parseFixture(LINKEDIN_LEGACY_FIXTURE));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.job.title).toBe("Staff Platform Engineer");
    expect(result.job.company).toBe("Initech");
    expect(result.job.location).toBe("Austin, TX");
    expect(result.job.description).toContain("Initech seeks a Staff Platform Engineer");
    expect(result.job.description).toContain("8+ years");
  });

  it("reports missing-description when LinkedIn hasn't finished rendering", () => {
    const result = extractJobData(parseFixture(LINKEDIN_PENDING_FIXTURE));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("missing-description");
  });

  it("reports missing-title when nothing matches", () => {
    const doc = parseFixture("<!doctype html><html><body><main></main></body></html>");
    const result = extractJobData(doc);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("missing-title");
  });
});
