import type { JobData } from "@job-fit/shared";

export interface OverlayShellProps {
  readonly job: JobData | null;
  readonly jobId: string | null;
  readonly error: string | null;
}

/**
 * Visible proof-of-life overlay for Phase 6. Phase 7 replaces the body with
 * the "Check Match Score" button + result card.
 */
export function OverlayShell({ job, jobId, error }: OverlayShellProps): JSX.Element {
  return (
    <section
      aria-label="Job Fit status"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        background: "#ffffff",
        border: "1px solid #d0d7de",
        borderRadius: 12,
        padding: "12px 16px",
        margin: "12px 0",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
        color: "#0f172a",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 6,
        }}
      >
        <strong style={{ fontSize: 13, letterSpacing: 0.2 }}>Job Fit</strong>
        <span style={{ fontSize: 11, color: "#64748b" }}>
          {jobId ? `Job #${jobId}` : "Waiting for a job"}
        </span>
      </header>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "#334155" }}>
        {renderStatus({ job, error })}
      </p>
    </section>
  );
}

function renderStatus({ job, error }: Pick<OverlayShellProps, "job" | "error">): string {
  if (error) return `Could not read this job yet: ${error}`;
  if (!job) return "Open a job to see a fit score. We'll wire up scoring in the next step.";
  return `Detected: ${job.title} · ${job.company}${job.location ? ` · ${job.location}` : ""}.`;
}
