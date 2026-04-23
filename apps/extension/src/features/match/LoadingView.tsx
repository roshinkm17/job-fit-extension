import type { JobData } from "@job-fit/shared";
import { TOKENS } from "./theme";

export interface LoadingViewProps {
  readonly job: JobData;
}

const SPINNER_SIZE = 18;

/**
 * Loading state. CSS keyframes live here because we're inside a shadow DOM
 * and can't rely on a global stylesheet. A single `<style>` tag per render
 * is cheap and keeps the animation self-contained.
 */
export function LoadingView({ job }: LoadingViewProps): JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: TOKENS.space.m,
        padding: `${TOKENS.space.l}px ${TOKENS.space.l}px`,
      }}
    >
      <style>{SPINNER_CSS}</style>
      <span
        aria-hidden="true"
        style={{
          width: SPINNER_SIZE,
          height: SPINNER_SIZE,
          borderRadius: "50%",
          border: `2px solid ${TOKENS.color.borderSubtle}`,
          borderTopColor: TOKENS.color.primary,
          animation: "rolegauge-spin 720ms linear infinite",
          flex: `0 0 ${SPINNER_SIZE}px`,
        }}
      />
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: TOKENS.font.size.m,
            fontWeight: TOKENS.font.weight.semibold,
            color: TOKENS.color.fg,
          }}
        >
          Scoring {job.title}…
        </p>
        <p
          style={{
            margin: 0,
            marginTop: TOKENS.space.xxs,
            fontSize: TOKENS.font.size.s,
            color: TOKENS.color.fgSubtle,
          }}
        >
          Comparing this posting against your saved preferences.
        </p>
      </div>
    </div>
  );
}

const SPINNER_CSS = `
  @keyframes rolegauge-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
