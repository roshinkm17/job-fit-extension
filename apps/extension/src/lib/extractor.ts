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

const LOCATION_SHAPE = /\b(remote|hybrid|on[-\s]?site)\b|[,，]/i;

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

/** SDUI stacks company + meta line (location · relative time); legacy selectors miss the paragraph. */
function locationNearCompanyBlock(scope: ParentNode): string | null {
  const company =
    scope.querySelector('main#workspace [aria-label^="Company,"]') ??
    scope.querySelector('[aria-label^="Company,"]');
  if (!(company instanceof Element)) return null;

  function scanParagraphs(holder: ParentNode): string | null {
    const paragraphs =
      holder instanceof HTMLParagraphElement ? [holder] : [...holder.querySelectorAll("p")];
    for (const p of paragraphs) {
      const raw = normalizeWhitespace(p.textContent);
      if (!raw.includes("·") && !raw.includes("•")) continue;
      const picked = pickLocation(raw);
      if (
        picked.includes(",") ||
        picked.includes("，") ||
        LOCATION_SHAPE.test(raw) ||
        LOCATION_SHAPE.test(picked)
      ) {
        return picked;
      }
    }
    return null;
  }

  for (
    let peer: Element | null = company.nextElementSibling;
    peer;
    peer = peer.nextElementSibling
  ) {
    const found = scanParagraphs(peer);
    if (found) return found;
  }

  const wrap = company.parentElement;
  if (!wrap) return null;
  for (const child of [...wrap.children]) {
    if (child === company) continue;
    const found = scanParagraphs(child);
    if (found) return found;
  }

  return null;
}

/** Main jobs workspace often exposes exactly one headline <h1> for the vacancy. */
function titleFromWorkspaceRoot(root: ParentNode): string {
  if (!(root instanceof Element)) return "";
  if (root.id !== "workspace") return "";

  const h1 = root.querySelector("h1");
  return normalizeWhitespace(h1?.textContent ?? "");
}

/**
 * Pure DOM → JobData. No side effects, no globals. Called from both the live
 * content script and fixture-based tests.
 */
export function extractJobData(document: Document): ExtractResult {
  const root = queryFirst(document, JOB_ROOT_SELECTORS);
  const scope = root ?? document.body;
  if (!scope) return { ok: false, reason: "missing-root" };

  const title = textFrom(scope, JOB_TITLE_SELECTORS) || titleFromWorkspaceRoot(scope);
  if (!title) return { ok: false, reason: "missing-title" };

  const company = textFrom(scope, JOB_COMPANY_SELECTORS);
  if (!company) return { ok: false, reason: "missing-company" };

  let location = pickLocation(textFrom(scope, JOB_LOCATION_SELECTORS));
  if (!location) {
    const near = locationNearCompanyBlock(scope);
    if (near) location = near;
  }

  const descriptionRoot = queryFirst(scope, JOB_DESCRIPTION_SELECTORS);
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
