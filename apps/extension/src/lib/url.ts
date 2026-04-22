const LINKEDIN_HOST = "linkedin.com";

export interface LinkedInJobLocator {
  readonly jobId: string;
  readonly kind: "view" | "collection";
}

export function isLinkedInJobUrl(href: string): boolean {
  try {
    const url = new URL(href);
    if (!url.hostname.endsWith(LINKEDIN_HOST)) return false;
    return parseLinkedInJobUrl(url) !== null;
  } catch {
    return false;
  }
}

export function parseLinkedInJobUrl(input: string | URL): LinkedInJobLocator | null {
  let url: URL;
  try {
    url = typeof input === "string" ? new URL(input) : input;
  } catch {
    return null;
  }
  if (!url.hostname.endsWith(LINKEDIN_HOST)) return null;

  const viewMatch = url.pathname.match(/\/jobs\/view\/(\d+)/);
  if (viewMatch?.[1]) {
    return { jobId: viewMatch[1], kind: "view" };
  }

  if (url.pathname.startsWith("/jobs/")) {
    const currentJobId = url.searchParams.get("currentJobId");
    if (currentJobId && /^\d+$/.test(currentJobId)) {
      return { jobId: currentJobId, kind: "collection" };
    }
  }

  return null;
}
