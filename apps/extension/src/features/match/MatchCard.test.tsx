// @vitest-environment jsdom
import type { AnalyzeResult, JobData } from "@job-fit/shared";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
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

const WEB_APP_URL = "http://localhost:5173";

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe("MatchCard", () => {
  it("does not render RoleGauge as inline card branding", () => {
    render(
      <MatchCard
        state={INITIAL_ANALYSIS_STATE}
        job={JOB}
        jobId="4404"
        jobReason={null}
        webAppUrl={WEB_APP_URL}
        onCheck={() => {}}
      />,
    );
    expect(screen.queryByText("RoleGauge")).toBeNull();
  });

  it("idle: disables the button without a job and hides all metadata", () => {
    render(
      <MatchCard
        state={INITIAL_ANALYSIS_STATE}
        job={null}
        jobId={null}
        jobReason="missing_title"
        webAppUrl={WEB_APP_URL}
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
        webAppUrl={WEB_APP_URL}
        onCheck={() => {}}
      />,
    );
    const card = screen.getByTestId("rolegauge-match-card");
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
        webAppUrl={WEB_APP_URL}
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
      errorCode: null,
    };
    render(
      <MatchCard
        state={state}
        job={JOB}
        jobId="123"
        jobReason={null}
        webAppUrl={WEB_APP_URL}
        onCheck={() => {}}
      />,
    );
    expect(screen.getByText(/scoring senior backend engineer/i)).toBeDefined();
  });

  it("result: renders score, band pill, summary and unified badge strip without re-run", () => {
    const state: AnalysisState = {
      status: "result",
      jobKey: "k",
      result: RESULT,
      error: null,
      errorCode: null,
    };
    render(
      <MatchCard
        state={state}
        job={JOB}
        jobId="123"
        jobReason={null}
        webAppUrl={WEB_APP_URL}
        onCheck={() => {}}
      />,
    );
    expect(screen.getByRole("img", { name: /fit score 82 out of 100/i })).toBeDefined();
    expect(screen.getByText(/strong match/i)).toBeDefined();
    expect(screen.getByText(/strong fit overall/i)).toBeDefined();
    expect(screen.queryByRole("region", { name: /matches/i })).toBeNull();
    expect(screen.queryByRole("region", { name: /gaps/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /re-run/i })).toBeNull();
    expect(screen.getByRole("listitem", { name: "Node.js" })).toBeDefined();
    expect(screen.getByRole("listitem", { name: "On-call" })).toBeDefined();
  });

  it("result: shows tag detail in a floating tooltip shortly after hover", async () => {
    const state: AnalysisState = {
      status: "result",
      jobKey: "k",
      result: RESULT,
      error: null,
      errorCode: null,
    };
    render(
      <MatchCard
        state={state}
        job={JOB}
        jobId="123"
        jobReason={null}
        webAppUrl={WEB_APP_URL}
        onCheck={() => {}}
      />,
    );
    const user = userEvent.setup();
    await user.hover(screen.getByRole("listitem", { name: "Node.js" }));
    await waitFor(() => {
      expect(screen.getByText("Stack match")).toBeDefined();
    });
  });

  it("error: renders message and fires onCheck when retry clicked", async () => {
    const onCheck = vi.fn();
    const state: AnalysisState = {
      status: "error",
      jobKey: "k",
      result: null,
      error: "Backend unreachable",
      errorCode: "network",
    };
    render(
      <MatchCard
        state={state}
        job={JOB}
        jobId="123"
        jobReason={null}
        webAppUrl={WEB_APP_URL}
        onCheck={onCheck}
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Backend unreachable");
    await userEvent.click(screen.getByRole("button", { name: /retry match score/i }));
    expect(onCheck).toHaveBeenCalledTimes(1);
  });

  it("error: unauthenticated offers web app and try-again", () => {
    const state: AnalysisState = {
      status: "error",
      jobKey: "k",
      result: null,
      error: "Connect the RoleGauge extension to your account before scoring.",
      errorCode: "unauthenticated",
    };
    render(
      <MatchCard
        state={state}
        job={JOB}
        jobId="123"
        jobReason={null}
        webAppUrl="http://localhost:5173/prefs"
        onCheck={() => {}}
      />,
    );
    const link = screen.getByRole("link", { name: /open rolegauge/i });
    expect(link.getAttribute("href")).toBe("http://localhost:5173/prefs");
    expect(screen.getByText(/sign in to score jobs/i)).toBeDefined();
    expect(screen.getByRole("button", { name: "Try again after signing in" })).toBeDefined();
  });
});
