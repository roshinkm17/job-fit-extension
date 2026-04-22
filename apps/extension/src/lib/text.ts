/**
 * Normalize text pulled from the DOM: collapse internal whitespace, strip
 * non-breaking spaces, and trim. Returns an empty string for null/blank input.
 */
export function normalizeWhitespace(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Pull visible text from an element while preserving paragraph structure.
 * `innerText` would be ideal, but jsdom does not implement it reliably, so we
 * walk the tree and insert newlines at block boundaries.
 */
const BLOCK_TAGS = new Set([
  "P",
  "DIV",
  "LI",
  "UL",
  "OL",
  "SECTION",
  "ARTICLE",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "BR",
]);

export function extractVisibleText(root: Element): string {
  const parts: string[] = [];
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ALL, null);
  let node: Node | null = walker.currentNode;
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text.trim().length > 0) parts.push(text);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as Element).tagName;
      if (BLOCK_TAGS.has(tag)) parts.push("\n");
    }
    node = walker.nextNode();
  }
  return parts
    .join("")
    .split("\n")
    .map((line) =>
      line
        .replace(/\u00a0/g, " ")
        .replace(/[\t\r\f\v ]+/g, " ")
        .trim(),
    )
    .filter((line) => line.length > 0)
    .join("\n");
}

/**
 * LinkedIn's location line is typically formatted like
 * "Acme Inc · San Francisco, CA · 3 days ago · 200 applicants". We want only
 * the location portion, which tends to be the segment containing a comma or
 * the word "Remote/Hybrid/On-site".
 */
const LOCATION_HINT = /^(remote|hybrid|on-?site)$/i;

export function pickLocation(raw: string): string {
  const normalized = normalizeWhitespace(raw);
  if (!normalized) return "";
  const segments = normalized
    .split(/\s+[·•|]\s+/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
  if (segments.length === 0) return normalized;
  const withComma = segments.find((segment) => segment.includes(","));
  if (withComma) return withComma;
  const hinted = segments.find((segment) => LOCATION_HINT.test(segment));
  if (hinted) return hinted;
  return segments[0] ?? normalized;
}
