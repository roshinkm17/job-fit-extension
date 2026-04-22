// @vitest-environment jsdom
import type { AnalyzeResult, JobData } from "@job-fit/shared";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type AnalysisState, INITIAL_ANALYSIS_STATE } from "../../lib/analyze-machine";
import { MatchCard } from "./MatchCard";

const JOB: JobData = {
  title: "Senior Backend Engineer",
  company: "Acme",
  location: "Bengaluru, India",
  description: "Node.js services at scale.",
};

const RESULT: AnalyzeResult = {
  fitScore: 82,
  matches: [{ label: "Node.js", detail: "Stack match" }, { label: "Remote" }],
  mismatches: [{ label: "On-call", detail: "On-call rotations mentioned" }],
  summary: "Strong fit overall with minor concerns.",
};

afterEach(() => {
  cleanup();
});

describe("MatchCard", () => {
  it("does not render any Job Fit branding", () => {
    render(
      <MatchCard
        state={INITIAL_ANALYSIS_STATE}
        job={JOB}
        jobId="4404"
        jobReason={null}
        onCheck={() => {}}
      />,
    );
    expect(screen.queryByText("Job Fit")).toBeNull();
  });

  it("idle: disables the button without a job and hides all metadata", () => {
    render(
      <MatchCard
        state={INITIAL_ANALYSIS_STATE}
        job={null}
        jobId={null}
        jobReason="missing_title"
        onCheck={() => {}}
      />,
    );
    const button = screen.getByRole("button", { name: /check match score/i });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByText(/ID:/i)).toBeNull();
  });

  it("idle: renders only the ID pill and the primary button in a single row", () => {
    render(
      <MatchCard
        state={INITIAL_ANALYSIS_STATE}
        job={JOB}
        jobId="4404"
        jobReason={null}
        onCheck={() => {}}
      />,
    );
    const card = screen.getByTestId("job-fit-match-card");
    expect(card.dataset.status).toBe("idle");
    // Idle has no separate header; only the row itself.
    expect(card.children.length).toBe(1);
    expect(screen.getByText(/ID: 4404/i)).toBeDefined();
    expect(screen.queryByText(JOB.location)).toBeNull();
    expect(screen.queryByText(/score this job/i)).toBeNull();
    expect(screen.getByRole("button", { name: /check match score/i })).toBeDefined();
  });

  it("idle: fires onCheck when the primary button is clicked", async () => {
    const onCheck = vi.fn();
    render(
      <MatchCard
        state={INITIAL_ANALYSIS_STATE}
        job={JOB}
        jobId="4404"
        jobReason={null}
        onCheck={onCheck}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /check match score/i }));
    expect(onCheck).toHaveBeenCalledTimes(1);
  });

  it("loading: shows scoring message", () => {
    const state: AnalysisState = {
      status: "loading",
      jobKey: "k",
      result: null,
      error: null,
    };
    render(<MatchCard state={state} job={JOB} jobId="123" jobReason={null} onCheck={() => {}} />);
    expect(screen.getByText(/scoring senior backend engineer/i)).toBeDefined();
  });

  it("result: renders score, band pill, summary and unified badge strip without re-run", () => {
    const state: AnalysisState = {
      status: "result",
      jobKey: "k",
      result: RESULT,
      error: null,
    };
    render(<MatchCard state={state} job={JOB} jobId="123" jobReason={null} onCheck={() => {}} />);
    expect(screen.getByRole("img", { name: /fit score 82 out of 100/i })).toBeDefined();
    expect(screen.getByText(/strong match/i)).toBeDefined();
    expect(screen.getByText(/strong fit overall/i)).toBeDefined();
    expect(screen.queryByRole("region", { name: /matches/i })).toBeNull();
    expect(screen.queryByRole("region", { name: /gaps/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /re-run/i })).toBeNull();
    expect(screen.getByRole("listitem", { name: /match:\s*Node\.js/i })).toBeDefined();
    expect(screen.getByRole("listitem", { name: /gap:\s*On-call/i })).toBeDefined();
  });

  it("result: surfaces tag detail via tooltip title", () => {
    const state: AnalysisState = {
      status: "result",
      jobKey: "k",
      result: RESULT,
      error: null,
    };
    render(<MatchCard state={state} job={JOB} jobId="123" jobReason={null} onCheck={() => {}} />);
    const badge = screen.getByRole("listitem", { name: /match:\s*Node\.js/i });
    expect(badge.getAttribute("title")).toBe("Stack match");
  });

  it("error: renders message and fires onCheck when retry clicked", async () => {
    const onCheck = vi.fn();
    const state: AnalysisState = {
      status: "error",
      jobKey: "k",
      result: null,
      error: "Backend unreachable",
    };
    render(<MatchCard state={state} job={JOB} jobId="123" jobReason={null} onCheck={onCheck} />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Backend unreachable");
    await userEvent.click(screen.getByRole("button", { name: /retry match score/i }));
    expect(onCheck).toHaveBeenCalledTimes(1);
  });
});
