import type { JobData } from "@job-fit/shared";
import { PrimaryButton } from "./PrimaryButton";
import { ID_PILL_STYLE, TOKENS } from "./theme";

export interface IdleViewProps {
  readonly job: JobData | null;
  readonly jobId: string | null;
  readonly jobReason: string | null;
  readonly onCheck: () => void;
}

/**
 * Default state, laid out as a single row: the job ID pill sits on the left
 * and the primary action sits on the right. The header, location, and any
 * supporting copy are intentionally omitted so the widget stays out of the
 * way until the user opts into scoring.
 */
export function IdleView({ job, jobId, onCheck }: IdleViewProps): JSX.Element {
  const canCheck = Boolean(job);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: TOKENS.space.m,
        padding: `${TOKENS.space.s}px ${TOKENS.space.l}px`,
      }}
    >
      {jobId ? <span style={ID_PILL_STYLE}>ID: {jobId}</span> : <span />}
      <PrimaryButton onClick={onCheck} disabled={!canCheck} aria-label="Check match score">
        Check match score
      </PrimaryButton>
    </div>
  );
}
