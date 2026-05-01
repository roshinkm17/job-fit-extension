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

const TITLE_NOISE = /^(linkedin|jobs)$/i;

function isHeadingLike(el: Element): boolean {
  const tag = el.tagName;
  if (tag === "H1" || tag === "H2" || tag === "H3") return true;
  return el.getAttribute("role") === "heading";
}

function pickHeadingFromSubtree(sib: Element): string | null {
  if (isHeadingLike(sib)) {
    const t = normalizeWhitespace(sib.textContent);
    if (t.length >= 2 && !TITLE_NOISE.test(t)) return t;
  }
  const inner = sib.querySelector("h1, h2, h3, [role='heading']");
  if (!inner) return null;
  const t = normalizeWhitespace(inner.textContent);
  return t.length >= 2 && !TITLE_NOISE.test(t) ? t : null;
}

/** Walk upward from `[aria-label^="Company,"]` — SDUI titles are often siblings (h2) before logo row. */
function titleAdjacentToCompany(workspace: Element): string {
  const company = workspace.querySelector('[aria-label^="Company,"]');
  if (!(company instanceof Element)) return "";

  let depth = 0;
  let node: Element | null = company;
  while (node && depth < 30) {
    for (let sib = node.previousElementSibling; sib; sib = sib.previousElementSibling) {
      const picked = pickHeadingFromSubtree(sib);
      if (picked) return picked;
    }
    node = node.parentElement;
    depth += 1;
  }
  return "";
}

/** Pick the richest heading under workspace when markup no longer exposes job-title-specific classes. */
function fallbackHeadingInWorkspace(workspace: Element): string {
  let best = "";
  const nodes = workspace.querySelectorAll("h1, h2, h3, [role='heading']");
  for (const el of nodes) {
    if (!isHeadingLike(el)) continue;
    const t = normalizeWhitespace(el.textContent);
    if (t.length < 3 || t.length > 200) continue;
    const lower = t.toLowerCase();
    if (
      TITLE_NOISE.test(t) ||
      lower === "linkedin" ||
      lower.startsWith("sign in") ||
      lower.includes("cookie")
    )
      continue;
    if (t.length > best.length) best = t;
  }
  return best;
}

function queryFirst(root: ParentNode, selectors: readonly string[]): Element | null {
  for (const selector of selectors) {
    const match = root.querySelector(selector);
    if (match) return match;
  }
  return null;
}

/**
 * Prefer `#workspace` when SDUI markers live there. LinkedIn may still emit an
 * empty `.jobs-details__main-content` earlier in the tree; `queryFirst` would
 * latch onto it and extraction would never see the real job column.
 */
function resolveJobExtractScope(document: Document): Element {
  const workspace =
    document.querySelector("main#workspace") ?? document.querySelector("#workspace");
  if (workspace?.querySelector('[data-sdui-component*="aboutTheJob"], [aria-label^="Company,"]')) {
    return workspace;
  }
  return queryFirst(document, JOB_ROOT_SELECTORS) ?? document.body;
}

/** Job column often lives inside `main#workspace` even when `scope` is a narrower subtree root. */
function resolveWorkspaceAncestor(scope: Element): Element | null {
  return scope.id === "workspace" ? scope : scope.closest("#workspace");
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

/** First `h1` on the workspace `<main>` (often absent on hashed SDUI — see fallbacks). */
function titleFromWorkspaceRoot(root: ParentNode): string {
  if (!(root instanceof Element)) return "";
  if (root.id !== "workspace") return "";

  const h1 = root.querySelector("h1");
  const t = normalizeWhitespace(h1?.textContent ?? "");
  return TITLE_NOISE.test(t) ? "" : t;
}

/**
 * Pure DOM → JobData. No side effects, no globals. Called from both the live
 * content script and fixture-based tests.
 */
export function extractJobData(document: Document): ExtractResult {
  const scope = resolveJobExtractScope(document);
  if (!scope) return { ok: false, reason: "missing-root" };

  const wk = scope instanceof Element ? resolveWorkspaceAncestor(scope) : null;
  const titleRoot = wk ?? scope;
  const title =
    textFrom(scope, JOB_TITLE_SELECTORS) ||
    (wk ? titleAdjacentToCompany(wk) : "") ||
    titleFromWorkspaceRoot(titleRoot) ||
    (wk ? fallbackHeadingInWorkspace(wk) : "");
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
