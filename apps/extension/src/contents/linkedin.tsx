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

/**
 * Anchor above LinkedIn's job detail pane. We fall back to the main content
 * region if the top card shell isn't present yet; Plasmo retries automatically.
 */
export const getInlineAnchor: PlasmoGetInlineAnchor = async () => {
  const candidate =
    document.querySelector(".job-details-jobs-unified-top-card__container--two-pane") ??
    document.querySelector(".jobs-unified-top-card") ??
    document.querySelector(".jobs-search__job-details--container") ??
    document.querySelector(".jobs-details__main-content");
  if (!candidate) throw new Error("anchor not ready");
  return {
    element: candidate,
    insertPosition: "beforebegin",
  };
};

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
