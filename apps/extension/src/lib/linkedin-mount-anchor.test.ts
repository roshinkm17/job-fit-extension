// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { LINKEDIN_LEGACY_FIXTURE } from "./fixtures/linkedin-legacy";
import {
  LINKEDIN_MODERN_CONTAINER_ONLY_FIXTURE,
  LINKEDIN_MODERN_FIXTURE,
} from "./fixtures/linkedin-modern";
import { LINKEDIN_SDUI_JOB_FIXTURE } from "./fixtures/linkedin-sdui";
import { findLinkedInMountAnchor } from "./linkedin-mount-anchor";

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

describe("findLinkedInMountAnchor", () => {
  it("matches two-pane top card container first", () => {
    const doc = parse(LINKEDIN_MODERN_FIXTURE);
    const el = findLinkedInMountAnchor(doc);
    expect(el?.classList.contains("job-details-jobs-unified-top-card__container--two-pane")).toBe(
      true,
    );
  });

  it("matches container variant without --two-pane suffix", () => {
    const doc = parse(LINKEDIN_MODERN_CONTAINER_ONLY_FIXTURE);
    const el = findLinkedInMountAnchor(doc);
    expect(el?.classList.contains("job-details-jobs-unified-top-card__container")).toBe(true);
    expect(el?.matches('[class*="job-details-jobs-unified-top-card__container"]')).toBe(true);
  });

  it("falls back to legacy unified top card", () => {
    const doc = parse(LINKEDIN_LEGACY_FIXTURE);
    const el = findLinkedInMountAnchor(doc);
    expect(el?.classList.contains("jobs-unified-top-card")).toBe(true);
  });

  it("prefers aboutTheJob SDUI host as mount anchor when present", () => {
    const doc = parse(LINKEDIN_SDUI_JOB_FIXTURE);
    const el = findLinkedInMountAnchor(doc);
    expect(el?.getAttribute("data-sdui-component")?.includes("aboutTheJob")).toBe(true);
  });
});
