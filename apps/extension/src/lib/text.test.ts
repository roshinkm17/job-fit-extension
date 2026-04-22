// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { extractVisibleText, normalizeWhitespace, pickLocation } from "./text";

describe("normalizeWhitespace", () => {
  it("collapses whitespace and strips nbsp", () => {
    expect(normalizeWhitespace("  Acme\u00a0Corp   \n Inc. ")).toBe("Acme Corp Inc.");
  });

  it("returns empty string for null/undefined", () => {
    expect(normalizeWhitespace(null)).toBe("");
    expect(normalizeWhitespace(undefined)).toBe("");
    expect(normalizeWhitespace("   ")).toBe("");
  });
});

describe("pickLocation", () => {
  it("prefers segments with a comma", () => {
    expect(pickLocation("Acme Inc · San Francisco, CA · 3 days ago · 200 applicants")).toBe(
      "San Francisco, CA",
    );
  });

  it("falls back to remote/hybrid/onsite hints", () => {
    expect(pickLocation("Acme Inc · Remote · 3 days ago")).toBe("Remote");
  });

  it("returns first segment when no hints match", () => {
    expect(pickLocation("Tokyo · 3 days ago")).toBe("Tokyo");
  });

  it("handles empty input", () => {
    expect(pickLocation("")).toBe("");
  });
});

describe("extractVisibleText", () => {
  it("preserves paragraph breaks across block elements", () => {
    const doc = new DOMParser().parseFromString(
      "<div><p>First paragraph.</p><p>Second paragraph <strong>with emphasis</strong>.</p><ul><li>One</li><li>Two</li></ul></div>",
      "text/html",
    );
    const root = doc.body.firstElementChild;
    if (!root) throw new Error("fixture parse failed");
    const text = extractVisibleText(root);
    expect(text).toBe("First paragraph.\nSecond paragraph with emphasis.\nOne\nTwo");
  });
});
