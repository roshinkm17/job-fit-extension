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

export function findLinkedInMountAnchor(root: ParentNode = document): Element | null {
  for (const selector of LINKEDIN_INLINE_ANCHOR_SELECTORS) {
    const match = root.querySelector(selector);
    if (match) return match;
  }
  return null;
}
