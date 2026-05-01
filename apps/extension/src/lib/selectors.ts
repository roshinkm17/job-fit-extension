/**
 * LinkedIn ships multiple experiments concurrently — semantic hooks (aria,
 * data-sdui-component, componentkey prefixes, test ids) outperform hashed class
 * names. We probe ordered buckets: stable attributes first, then legacy BEM
 * shells commonly still served in parallel variants.
 */

export const JOB_ROOT_SELECTORS = [
  ".jobs-details__main-content",
  ".jobs-search__job-details--container",
  ".job-view-layout",
  "#workspace",
  "main",
] as const;

export const JOB_TITLE_SELECTORS = [
  ".job-details-jobs-unified-top-card__job-title h1",
  ".job-details-jobs-unified-top-card__job-title",
  ".jobs-unified-top-card__job-title",
  "h1.t-24",
  'h1[class*="job-title"]',
  /** Detail column headings when the vacancy title is emitted as plain <h1> */
  "article h1",
] as const;

export const JOB_COMPANY_SELECTORS = [
  '[aria-label^="Company,"] a[href*="/company/"]',
  '[aria-label^="Company,"]',
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
  '[data-sdui-component*="aboutTheJob"] [data-testid="expandable-text-box"]',
  '[data-sdui-component*="aboutTheJob"]',
  '[componentkey^="JobDetails_AboutTheCompany"] [data-testid="expandable-text-box"]',
  '[componentkey^="JobDetails_AboutTheCompany"]',
  "#job-details",
  ".jobs-description-content__text",
  ".jobs-description__content .jobs-box__html-content",
  ".jobs-description__content",
  "article.jobs-description__container",
] as const;
