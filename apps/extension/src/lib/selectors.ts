/**
 * LinkedIn ships multiple experiments concurrently, so any single selector will
 * silently break in production. We keep ordered candidate lists and fall back
 * to the first match that produces usable text. Fixture tests lock in coverage
 * for each variant.
 *
 * Naming convention:
 *  - `top-card` variants = current "job-details-jobs-unified-top-card" shell
 *  - `legacy` variants   = older "jobs-unified-top-card" shell still A/B tested
 *  - aria fallbacks catch renames by relying on page structure rather than
 *    class names.
 */
export const JOB_ROOT_SELECTORS = [
  ".jobs-details__main-content",
  ".jobs-search__job-details--container",
  ".job-view-layout",
  "main",
] as const;

export const JOB_TITLE_SELECTORS = [
  ".job-details-jobs-unified-top-card__job-title h1",
  ".job-details-jobs-unified-top-card__job-title",
  ".jobs-unified-top-card__job-title",
  "h1.t-24",
  'h1[class*="job-title"]',
] as const;

export const JOB_COMPANY_SELECTORS = [
  ".job-details-jobs-unified-top-card__company-name a",
  ".job-details-jobs-unified-top-card__company-name",
  ".jobs-unified-top-card__company-name a",
  ".jobs-unified-top-card__company-name",
  'a[data-test-app-aware-link][href*="/company/"]',
] as const;

export const JOB_LOCATION_SELECTORS = [
  ".jobs-unified-top-card__bullet",
  ".job-details-jobs-unified-top-card__primary-description-container",
  ".job-details-jobs-unified-top-card__primary-description",
  ".jobs-unified-top-card__primary-description",
] as const;

export const JOB_DESCRIPTION_SELECTORS = [
  "#job-details",
  ".jobs-description-content__text",
  ".jobs-description__content .jobs-box__html-content",
  ".jobs-description__content",
  "article.jobs-description__container",
] as const;
