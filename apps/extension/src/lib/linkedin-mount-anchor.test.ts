// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { LINKEDIN_LEGACY_FIXTURE } from "./fixtures/linkedin-legacy";
import {
  LINKEDIN_MODERN_CONTAINER_ONLY_FIXTURE,
  LINKEDIN_MODERN_FIXTURE,
} from "./fixtures/linkedin-modern";
import { LINKEDIN_SDUI_JOB_FIXTURE } from "./fixtures/linkedin-sdui";
import {
  findLinkedInMountAnchor,
  hoistMountAboveLinkedInCompanyActionRow,
  resolveLinkedInMountAnchor,
} from "./linkedin-mount-anchor";

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

  it("uses company aria as the single stable mount anchor for SDUI (not about-the-job)", () => {
    const doc = parse(LINKEDIN_SDUI_JOB_FIXTURE);
    const el = findLinkedInMountAnchor(doc);
    expect(el?.getAttribute("aria-label")?.startsWith("Company,")).toBe(true);
    expect(el?.closest("#workspace")).toBeTruthy();
  });

  it("hoists resolve target to wrapping company link so inline UI is sibling before entire row", () => {
    const doc = parse(`
      <main id="workspace">
        <a class="row-wrap" href="https://www.linkedin.com/company/accenture/life/">
          <div aria-label="Company, Accenture in India."></div>
        </a>
      </main>
    `);
    const resolved = resolveLinkedInMountAnchor(doc);
    expect(resolved?.element.tagName).toBe("A");
    expect(resolved?.element.classList.contains("row-wrap")).toBe(true);
    expect(resolved?.insertPosition).toBe("beforebegin");
  });

  it("hoists resolve target above the company action row with More options", () => {
    const doc = parse(`
      <main id="workspace">
        <div class="company-action-row">
          <a href="https://www.linkedin.com/company/accenture/life/">
            <div aria-label="Company, Accenture in India."></div>
          </a>
          <button aria-label="More options" type="button"></button>
        </div>
      </main>
    `);
    const resolved = resolveLinkedInMountAnchor(doc);
    expect(resolved?.element.tagName).toBe("DIV");
    expect(resolved?.element.classList.contains("company-action-row")).toBe(true);
    expect(resolved?.insertPosition).toBe("beforebegin");
  });
});

describe("hoistMountAboveLinkedInCompanyActionRow", () => {
  it("returns ancestor action row when the company link sits beside More options", () => {
    const doc = parse(`
      <main id="workspace">
        <div class="company-action-row">
          <a href="/company/demo/life/"><div aria-label="Company, Demo."></div></a>
          <button aria-label="More options" type="button"></button>
        </div>
      </main>
    `);
    const inner = doc.querySelector('[aria-label^="Company,"]');
    expect(inner).toBeTruthy();
    expect(hoistMountAboveLinkedInCompanyActionRow(inner as Element).className).toBe(
      "company-action-row",
    );
  });

  it("returns ancestor company profile anchor wrapping the semantic company node", () => {
    const doc = parse(`
      <main id="workspace">
        <a href="/company/demo/life/"><div aria-label="Company, Demo."></div></a>
      </main>
    `);
    const inner = doc.querySelector('[aria-label^="Company,"]');
    expect(inner).toBeTruthy();
    expect(hoistMountAboveLinkedInCompanyActionRow(inner as Element).getAttribute("href")).toBe(
      "/company/demo/life/",
    );
  });

  it("leaves anchor unchanged when parent chain has no LinkedIn company href", () => {
    const doc = parse(LINKEDIN_SDUI_JOB_FIXTURE);
    const inner = doc.querySelector('[aria-label^="Company,"]');
    expect(inner).toBeTruthy();
    expect(hoistMountAboveLinkedInCompanyActionRow(inner as Element)).toBe(inner);
  });
});
