import type { JobData } from "@job-fit/shared";
import type { AnalysisState } from "../../lib/analyze-machine";
import { ErrorView } from "./ErrorView";
import { Icon } from "./Icon";
import { IdleView } from "./IdleView";
import { LoadingView } from "./LoadingView";
import { ResultView } from "./ResultView";
import { CARD_HEADER_STYLE, CARD_STYLE, ID_PILL_STYLE, LOCATION_STYLE, TOKENS } from "./theme";

export interface MatchCardProps {
  readonly state: AnalysisState;
  readonly job: JobData | null;
  readonly jobId: string | null;
  readonly jobReason: string | null;
  readonly onCheck: () => void;
}

/**
 * Thin router over the analysis state machine. Keeping this dumb means every
 * visual state has a dedicated, standalone component that can be rendered
 * and tested in isolation. The card always fills the width of its container
 * so it feels native on LinkedIn's job pane.
 */
export function MatchCard({ state, job, jobId, jobReason, onCheck }: MatchCardProps): JSX.Element {
  // Idle collapses to a single row (ID, location, caption, button) so the
  // widget stays unobtrusive until the user opts into scoring. Every other
  // state renders the full header + body.
  const showHeader = state.status !== "idle" && (Boolean(jobId) || Boolean(job?.location));

  return (
    <section
      aria-label="Job match summary"
      data-testid="job-fit-match-card"
      data-status={state.status}
      style={CARD_STYLE}
    >
      {showHeader ? <CardHeader jobId={jobId} location={job?.location ?? ""} /> : null}
      {renderBody({ state, job, jobId, jobReason, onCheck })}
    </section>
  );
}

interface CardHeaderProps {
  readonly jobId: string | null;
  readonly location: string;
}

function CardHeader({ jobId, location }: CardHeaderProps): JSX.Element {
  return (
    <header style={CARD_HEADER_STYLE}>
      {jobId ? <span style={ID_PILL_STYLE}>ID: {jobId}</span> : <span />}
      {location ? (
        <span style={LOCATION_STYLE} title={location}>
          <Icon name="pin" size={14} color={TOKENS.color.fgSubtle} />
          <span
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 280,
            }}
          >
            {location}
          </span>
        </span>
      ) : null}
    </header>
  );
}

function renderBody({
  state,
  job,
  jobId,
  jobReason,
  onCheck,
}: Pick<MatchCardProps, "state" | "job" | "jobId" | "jobReason" | "onCheck">): JSX.Element {
  switch (state.status) {
    case "idle":
      return <IdleView job={job} jobId={jobId} jobReason={jobReason} onCheck={onCheck} />;
    case "loading":
      return job ? (
        <LoadingView job={job} />
      ) : (
        <IdleView job={null} jobId={jobId} jobReason={jobReason} onCheck={onCheck} />
      );
    case "result":
      return state.result ? (
        <ResultView result={state.result} />
      ) : (
        <IdleView job={job} jobId={jobId} jobReason={jobReason} onCheck={onCheck} />
      );
    case "error":
      return <ErrorView message={state.error ?? "Unknown error"} onRetry={onCheck} />;
    default: {
      const never: never = state.status;
      return never;
    }
  }
}
