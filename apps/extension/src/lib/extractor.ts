import { type JobData, JobDataSchema } from "@job-fit/shared";
import {
  JOB_COMPANY_SELECTORS,
  JOB_DESCRIPTION_SELECTORS,
  JOB_LOCATION_SELECTORS,
  JOB_ROOT_SELECTORS,
  JOB_TITLE_SELECTORS,
} from "./selectors";
import { extractVisibleText, normalizeWhitespace, pickLocation } from "./text";

export type ExtractReason =
  | "missing-root"
  | "missing-title"
  | "missing-company"
  | "missing-description";

export type ExtractResult =
  | { readonly ok: true; readonly job: JobData }
  | { readonly ok: false; readonly reason: ExtractReason };

function queryFirst(root: ParentNode, selectors: readonly string[]): Element | null {
  for (const selector of selectors) {
    const match = root.querySelector(selector);
    if (match) return match;
  }
  return null;
}

function textFrom(root: ParentNode, selectors: readonly string[]): string {
  const element = queryFirst(root, selectors);
  if (!element) return "";
  return normalizeWhitespace(element.textContent);
}

/**
 * Pure DOM → JobData. No side effects, no globals. Called from both the live
 * content script and fixture-based tests.
 */
export function extractJobData(document: Document): ExtractResult {
  const root = queryFirst(document, JOB_ROOT_SELECTORS) ?? document.body;
  if (!root) return { ok: false, reason: "missing-root" };

  const title = textFrom(root, JOB_TITLE_SELECTORS);
  if (!title) return { ok: false, reason: "missing-title" };

  const company = textFrom(root, JOB_COMPANY_SELECTORS);
  if (!company) return { ok: false, reason: "missing-company" };

  const location = pickLocation(textFrom(root, JOB_LOCATION_SELECTORS));

  const descriptionRoot = queryFirst(root, JOB_DESCRIPTION_SELECTORS);
  const description = descriptionRoot ? extractVisibleText(descriptionRoot) : "";
  if (!description || description.length < 40) {
    return { ok: false, reason: "missing-description" };
  }

  const parsed = JobDataSchema.safeParse({ title, company, location, description });
  if (!parsed.success) {
    return { ok: false, reason: "missing-description" };
  }
  return { ok: true, job: parsed.data };
}
