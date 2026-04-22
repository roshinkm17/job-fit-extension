import { describe, expect, it } from "vitest";
import { isLinkedInJobUrl, parseLinkedInJobUrl } from "./url";

describe("parseLinkedInJobUrl", () => {
  it("reads job id from /jobs/view/:id pages", () => {
    expect(parseLinkedInJobUrl("https://www.linkedin.com/jobs/view/3987654321/")).toEqual({
      jobId: "3987654321",
      kind: "view",
    });
  });

  it("reads job id from collection pages via currentJobId", () => {
    expect(
      parseLinkedInJobUrl(
        "https://www.linkedin.com/jobs/search/?currentJobId=3987654321&origin=JOBS_HOME_SEARCH_BUTTON",
      ),
    ).toEqual({ jobId: "3987654321", kind: "collection" });
  });

  it("ignores non-jobs pages", () => {
    expect(parseLinkedInJobUrl("https://www.linkedin.com/feed/")).toBeNull();
  });

  it("ignores non-linkedin domains", () => {
    expect(parseLinkedInJobUrl("https://example.com/jobs/view/123/")).toBeNull();
  });

  it("returns null on invalid urls", () => {
    expect(parseLinkedInJobUrl("not a url")).toBeNull();
  });
});

describe("isLinkedInJobUrl", () => {
  it("is true for job view urls", () => {
    expect(isLinkedInJobUrl("https://www.linkedin.com/jobs/view/123/")).toBe(true);
  });

  it("is false for non-job urls", () => {
    expect(isLinkedInJobUrl("https://www.linkedin.com/feed/")).toBe(false);
  });
});
