import type { JobData } from "@job-fit/shared";
import type { PlasmoCSConfig, PlasmoGetInlineAnchor, PlasmoGetStyle } from "plasmo";
import { useEffect, useState } from "react";
import { OverlayShell } from "../components/OverlayShell";
import { extractJobData } from "../lib/extractor";
import { logger } from "../lib/logger";
import { createJobContextWatcher, type JobContextChange } from "../lib/observer";

export const config: PlasmoCSConfig = {
  matches: ["https://www.linkedin.com/jobs/*", "https://linkedin.com/jobs/*"],
  run_at: "document_idle",
};

const ANCHOR_SELECTORS = [
  ".job-details-jobs-unified-top-card__container--two-pane",
  ".jobs-unified-top-card",
  ".jobs-search__job-details--container",
  ".jobs-details__main-content",
] as const;

function findAnchor(): Element | null {
  for (const selector of ANCHOR_SELECTORS) {
    const match = document.querySelector(selector);
    if (match) return match;
  }
  return null;
}

/**
 * Anchor above LinkedIn's job detail pane. LinkedIn renders the job column
 * asynchronously, so we resolve only once an anchor actually exists instead
 * of throwing (which surfaces as an unhandled rejection in the page console).
 * The returned promise is cheap: it disconnects the observer as soon as the
 * first matching element appears.
 */
interface InlineAnchor {
  readonly element: Element;
  readonly insertPosition: InsertPosition;
}

export const getInlineAnchor: PlasmoGetInlineAnchor = () =>
  new Promise<InlineAnchor>((resolve) => {
    const existing = findAnchor();
    if (existing) {
      resolve({ element: existing, insertPosition: "beforebegin" });
      return;
    }
    const observer = new MutationObserver(() => {
      const element = findAnchor();
      if (!element) return;
      observer.disconnect();
      resolve({ element, insertPosition: "beforebegin" });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  });

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style");
  style.textContent = ":host { all: initial; }";
  return style;
};

interface ContentState {
  readonly job: JobData | null;
  readonly jobId: string | null;
  readonly error: string | null;
}

const INITIAL_STATE: ContentState = { job: null, jobId: null, error: null };

export default function JobFitContent(): JSX.Element {
  const [state, setState] = useState<ContentState>(INITIAL_STATE);

  useEffect(() => {
    const watcher = createJobContextWatcher({
      onChange: (event) => handleChange(event, setState),
    });
    watcher.start();
    return () => watcher.stop();
  }, []);

  return <OverlayShell job={state.job} jobId={state.jobId} error={state.error} />;
}

function handleChange(
  event: JobContextChange,
  setState: (updater: (prev: ContentState) => ContentState) => void,
): void {
  const locator = event.locator;
  if (!locator) {
    setState(() => INITIAL_STATE);
    return;
  }
  const result = extractJobData(document);
  if (!result.ok) {
    logger.info("waiting for DOM", { reason: result.reason, trigger: event.trigger });
    setState((prev) => ({
      job: null,
      jobId: locator.jobId,
      error: event.trigger === "initial" ? null : prev.error,
    }));
    return;
  }
  logger.info("extracted job", {
    trigger: event.trigger,
    jobId: locator.jobId,
    title: result.job.title,
    company: result.job.company,
    location: result.job.location,
    descriptionLength: result.job.description.length,
  });
  setState(() => ({ job: result.job, jobId: locator.jobId, error: null }));
}
