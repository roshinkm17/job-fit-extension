import { logger } from "./logger";

/** Dev / explicit flag only — keep store builds quiet unless you opt in. */
export function shouldLogMountAnchorDiagnostics(): boolean {
  return (
    process.env.PLASMO_PUBLIC_DEBUG_MOUNT_ANCHOR === "true" || process.env.NODE_ENV !== "production"
  );
}

export type AnchorInsertPosition = "beforebegin" | "afterbegin" | "beforeend" | "afterend";

/**
 * Stable hooks first — LinkedIn hashed classes are unreliable. `insertPosition`
 * defaults to `beforebegin`; `afterbegin` on `#workspace` keeps UI inside SPA shell.
 */
export const LINKEDIN_INLINE_ANCHOR_CANDIDATES: ReadonlyArray<{
  readonly selector: string;
  readonly insertPosition?: AnchorInsertPosition;
}> = [
  /** Prefer the job-detail column; stray cards in the rail can reuse the Company aria pattern. */
  { selector: 'main#workspace [aria-label^="Company,"]' },
  { selector: '[aria-label^="Company,"]' },
  { selector: 'main#workspace [data-sdui-component*="aboutTheJob"]' },
  { selector: '[data-sdui-component*="aboutTheJob"]' },
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

export function resolveLinkedInMountAnchor(root: ParentNode = document): {
  readonly element: Element;
  readonly selector: string;
  readonly insertPosition: AnchorInsertPosition;
} | null {
  for (const candidate of LINKEDIN_INLINE_ANCHOR_CANDIDATES) {
    const match = root.querySelector(candidate.selector);
    if (match) {
      return {
        element: match,
        selector: candidate.selector,
        insertPosition: candidate.insertPosition ?? "beforebegin",
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
