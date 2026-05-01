import { logger } from "./logger";

/** Dev / explicit flag only — keep store builds quiet unless you opt in. */
export function shouldLogMountAnchorDiagnostics(): boolean {
  return (
    process.env.PLASMO_PUBLIC_DEBUG_MOUNT_ANCHOR === "true" || process.env.NODE_ENV !== "production"
  );
}

/**
 * Plasmo's inline UI must anchor to an existing DOM node. LinkedIn A/B-tests
 * class names constantly; ordered fallbacks minimize "widget never appears".
 */
export const LINKEDIN_INLINE_ANCHOR_SELECTORS = [
  ".job-details-jobs-unified-top-card__container--two-pane",
  ".job-details-jobs-unified-top-card__container",
  '[class*="job-details-jobs-unified-top-card__container"]',
  ".jobs-unified-top-card",
  ".jobs-search__job-details--container",
  ".job-view-layout",
  ".jobs-details__main-content",
] as const;

export function resolveLinkedInMountAnchor(root: ParentNode = document): {
  readonly element: Element;
  readonly selector: string;
} | null {
  for (const selector of LINKEDIN_INLINE_ANCHOR_SELECTORS) {
    const match = root.querySelector(selector);
    if (match) return { element: match, selector };
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
  for (const selector of LINKEDIN_INLINE_ANCHOR_SELECTORS) {
    const match = root.querySelector(selector);
    logger.info(`[anchor]   ${match ? "✓" : "×"} ${selector}`);
  }
  const resolved = resolveLinkedInMountAnchor(root);
  if (resolved) {
    logger.info(`[anchor] first winning selector: ${resolved.selector}`);
  } else {
    logger.warn(
      "[anchor] no element matched — widget will not mount until DOM matches a selector (or LinkedIn uses shadow DOM).",
    );
  }
}
