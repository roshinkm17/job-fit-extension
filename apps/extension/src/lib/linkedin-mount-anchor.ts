import { logger } from "./logger";

/** Dev / explicit flag only — keep store builds quiet unless you opt in. */
export function shouldLogMountAnchorDiagnostics(): boolean {
  return (
    process.env.PLASMO_PUBLIC_DEBUG_MOUNT_ANCHOR === "true" || process.env.NODE_ENV !== "production"
  );
}

export type AnchorInsertPosition = "beforebegin" | "afterbegin" | "beforeend" | "afterend";

/**
 * Plasmo can invoke `getInlineAnchor` repeatedly when the subtree mutates.
 * Diagnostics would spam the console; log at most once per URL + selector phase.
 */
let lastMountDiagnosticFingerprint = "";

/** Test hook: clears dedupe state between specs when needed. */
export function __resetMountDiagnosticFingerprintForTests(): void {
  lastMountDiagnosticFingerprint = "";
}

export function logMountDiagOnce(
  phase: "immediate" | "after-dom",
  selector: string,
  insertPosition: AnchorInsertPosition,
): void {
  if (!shouldLogMountAnchorDiagnostics()) return;

  let hrefPart = "";
  if (typeof globalThis.window !== "undefined" && globalThis.window.location) {
    hrefPart = `${globalThis.window.location.pathname}${globalThis.window.location.search}`;
  }
  const fingerprint = `${hrefPart}|${phase}|${selector}|${insertPosition}`;
  if (fingerprint === lastMountDiagnosticFingerprint) return;
  lastMountDiagnosticFingerprint = fingerprint;

  const when = phase === "immediate" ? "immediate" : "after DOM update";
  logger.info(`[anchor] mounting inline UI (${when}): ${selector} (${insertPosition})`);
}

/**
 * Stable hooks first — LinkedIn hashed classes are unreliable. `insertPosition`
 * defaults to `beforebegin`; `afterbegin` on `#workspace` keeps UI inside SPA shell.
 */
export const LINKEDIN_INLINE_ANCHOR_CANDIDATES: ReadonlyArray<{
  readonly selector: string;
  readonly insertPosition?: AnchorInsertPosition;
}> = [
  /**
   * NEVER anchor on `aboutTheJob` alongside `Company`: LinkedIn renders the
   * company/header row first — Plasmo mounts there — then `aboutTheJob` mounts
   * later while `aboutTheJob` ranks first in the candidate list → Plasmo
   * attaches a *second* inline host. Prefer `Company` only for a single anchor.
   */
  { selector: 'main#workspace [aria-label^="Company,"]' },
  { selector: '[aria-label^="Company,"]' },
  { selector: ".job-details-jobs-unified-top-card__container--two-pane" },
  { selector: ".job-details-jobs-unified-top-card__container" },
  { selector: '[class*="job-details-jobs-unified-top-card__container"]' },
  { selector: ".jobs-unified-top-card" },
  { selector: ".jobs-search__job-details--container" },
  { selector: ".job-view-layout" },
  { selector: ".jobs-details__main-content" },
  /**
   * Deliberately no `#workspace`/full-shell anchor — `afterbegin` there injects a
   * full-width stripe and can stack with anchors in the detail column.
   */
] as const;

/**
 * LinkedIn often wraps the company block in `<a href=".../company/.../life/">`
 * and places that link inside an action row with a "More options" button. Mount
 * before that whole row so `<plasmo-csui>` is a direct sibling above it.
 */
export function hoistMountAboveLinkedInCompanyActionRow(hit: Element): Element {
  let companyHrefWrapper: Element | null = null;
  for (let el = hit.parentElement; el; el = el.parentElement) {
    if (el.tagName === "DIV" && hasDirectMoreOptionsButton(el)) return el;
    if (el.tagName === "A" && isLinkedInCompanyProfileHref(el)) {
      companyHrefWrapper ??= el;
    }
  }
  return companyHrefWrapper ?? hit;
}

function hasDirectMoreOptionsButton(element: Element): boolean {
  for (const child of element.children) {
    if (child.matches('button[aria-label="More options"]')) return true;
  }
  return false;
}

function isLinkedInCompanyProfileHref(anchor: Element): boolean {
  const raw = anchor.getAttribute("href")?.trim();
  if (!raw) return false;
  try {
    const url = new URL(raw, "https://www.linkedin.com/");
    return url.pathname.includes("/company/");
  } catch {
    return false;
  }
}

export function resolveLinkedInMountAnchor(root: ParentNode = document): {
  readonly element: Element;
  readonly selector: string;
  readonly insertPosition: AnchorInsertPosition;
} | null {
  for (const candidate of LINKEDIN_INLINE_ANCHOR_CANDIDATES) {
    const match = root.querySelector(candidate.selector);
    if (match) {
      const insertPosition = candidate.insertPosition ?? "beforebegin";
      const element =
        insertPosition === "beforebegin" ? hoistMountAboveLinkedInCompanyActionRow(match) : match;
      return {
        element,
        selector: candidate.selector,
        insertPosition,
      };
    }
  }
  return null;
}

export function findLinkedInMountAnchor(root: ParentNode = document): Element | null {
  return resolveLinkedInMountAnchor(root)?.element ?? null;
}

/** One-shot diagnostic: confirms whether mount failure is due to selector mismatch. */
export function logLinkedInMountAnchorProbe(root: ParentNode = document): void {
  if (!shouldLogMountAnchorDiagnostics()) return;
  logger.info("[anchor] probing mount selectors (see × = no match, ✓ = match)");
  for (const candidate of LINKEDIN_INLINE_ANCHOR_CANDIDATES) {
    const match = root.querySelector(candidate.selector);
    const suffix = candidate.insertPosition ? ` [${candidate.insertPosition}]` : "";
    logger.info(`[anchor]   ${match ? "✓" : "×"} ${candidate.selector}${suffix}`);
  }
  const resolved = resolveLinkedInMountAnchor(root);
  if (resolved) {
    logger.info(`[anchor] first winner: ${resolved.selector} (${resolved.insertPosition})`);
  } else {
    logger.warn(
      "[anchor] no element matched — widget will not mount until DOM matches a selector (or LinkedIn uses closed shadow DOM).",
    );
  }
}
