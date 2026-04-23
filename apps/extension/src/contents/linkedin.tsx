import type { JobData } from "@job-fit/shared";
import type { PlasmoCSConfig, PlasmoGetInlineAnchor, PlasmoGetStyle } from "plasmo";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { MatchCard } from "../features/match/MatchCard";
import { analyzeForContent } from "../lib/analyze";
import { analysisReducer, buildJobKey, INITIAL_ANALYSIS_STATE } from "../lib/analyze-machine";
import { AnalyzeError } from "../lib/api-errors";
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

interface ExtractionState {
  readonly job: JobData | null;
  readonly jobId: string | null;
  readonly reason: string | null;
}

const INITIAL_EXTRACTION: ExtractionState = { job: null, jobId: null, reason: null };

export default function JobFitContent(): JSX.Element {
  const [extraction, setExtraction] = useState<ExtractionState>(INITIAL_EXTRACTION);
  const [analysis, dispatch] = useReducer(analysisReducer, INITIAL_ANALYSIS_STATE);
  const abortRef = useRef<AbortController | null>(null);
  const prevJobIdRef = useRef<string | null>(null);

  useEffect(() => {
    const watcher = createJobContextWatcher({
      onChange: (event) => handleChange(event, setExtraction),
    });
    watcher.start();
    return () => {
      watcher.stop();
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (prevJobIdRef.current === extraction.jobId) return;
    prevJobIdRef.current = extraction.jobId;
    dispatch({ type: "RESET" });
    abortRef.current?.abort();
    abortRef.current = null;
  }, [extraction.jobId]);

  const onCheck = useCallback(() => {
    const job = extraction.job;
    if (!job) return;
    const jobKey = buildJobKey(job);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    dispatch({ type: "CHECK", jobKey });
    analyzeForContent(job, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        dispatch({ type: "SUCCESS", jobKey, result });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof AnalyzeError) {
          logger.warn("analyze failed", { message: error.message, code: error.code, jobKey });
          dispatch({
            type: "FAILURE",
            jobKey,
            error: error.message,
            errorCode: error.code,
          });
          return;
        }
        const message = error instanceof Error ? error.message : "Unknown error";
        logger.warn("analyze failed", { message, jobKey });
        dispatch({ type: "FAILURE", jobKey, error: message, errorCode: "unknown" });
      });
  }, [extraction.job]);

  return (
    <MatchCard
      state={analysis}
      job={extraction.job}
      jobId={extraction.jobId}
      jobReason={extraction.reason}
      onCheck={onCheck}
    />
  );
}

function handleChange(
  event: JobContextChange,
  setExtraction: (updater: (prev: ExtractionState) => ExtractionState) => void,
): void {
  const locator = event.locator;
  if (!locator) {
    setExtraction(() => INITIAL_EXTRACTION);
    return;
  }
  const result = extractJobData(document);
  if (!result.ok) {
    logger.info("waiting for DOM", { reason: result.reason, trigger: event.trigger });
    setExtraction(() => ({
      job: null,
      jobId: locator.jobId,
      reason: result.reason,
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
    description: result.job.description,
  });
  setExtraction(() => ({ job: result.job, jobId: locator.jobId, reason: null }));
}
