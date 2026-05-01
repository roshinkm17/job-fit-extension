import type { AnalyzeErrorCode } from "../../lib/api-errors";
import { PrimaryButton } from "./PrimaryButton";
import { TOKENS } from "./theme";

export interface ErrorViewProps {
  readonly message: string;
  readonly errorCode: AnalyzeErrorCode | null;
  readonly webAppUrl: string;
  readonly onRetry: () => void;
}

export function ErrorView({ message, errorCode, webAppUrl, onRetry }: ErrorViewProps): JSX.Element {
  const isAuth = errorCode === "unauthenticated";

  if (isAuth) {
    return (
      <div
        role="alert"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: TOKENS.space.m,
          padding: `${TOKENS.space.l}px ${TOKENS.space.l}px`,
        }}
      >
        <div
          style={{ display: "flex", alignItems: "flex-start", gap: TOKENS.space.m, width: "100%" }}
        >
          <span
            aria-hidden="true"
            style={{
              flex: "0 0 auto",
              width: 20,
              height: 20,
              borderRadius: TOKENS.radius.pill,
              background: TOKENS.color.primary,
              color: TOKENS.color.primaryFg,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: TOKENS.font.size.s,
              fontWeight: TOKENS.font.weight.bold,
              lineHeight: 1,
            }}
          >
            i
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p
              style={{
                margin: 0,
                fontSize: TOKENS.font.size.m,
                fontWeight: TOKENS.font.weight.semibold,
                color: TOKENS.color.fg,
              }}
            >
              Sign in to score jobs
            </p>
            <p
              style={{
                margin: 0,
                marginTop: TOKENS.space.xxs,
                fontSize: TOKENS.font.size.s,
                color: TOKENS.color.fgMuted,
                lineHeight: 1.5,
              }}
            >
              The web app and extension use separate storage. After you sign in on the RoleGauge
              site, the browser must be allowed to sync your session to this extension (matching
              origins in the extension manifest plus{" "}
              <code style={{ fontSize: "0.85em" }}>VITE_CHROME_EXTENSION_ID</code> on the web app).
              Open the site from the button below, refresh if needed, then try again.
            </p>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: TOKENS.space.s,
            width: "100%",
            marginLeft: 28,
            boxSizing: "border-box",
          }}
        >
          <a
            href={webAppUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 32,
              padding: `0 ${TOKENS.space.m}px`,
              borderRadius: 6,
              background: TOKENS.color.primary,
              color: TOKENS.color.primaryFg,
              fontSize: TOKENS.font.size.s,
              fontWeight: TOKENS.font.weight.semibold,
              textDecoration: "none",
            }}
          >
            Open RoleGauge
          </a>
          <PrimaryButton
            onClick={onRetry}
            aria-label="Try again after signing in"
            variant="secondary"
          >
            I signed in — try again
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: TOKENS.space.m,
        padding: `${TOKENS.space.l}px ${TOKENS.space.l}px`,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          flex: "0 0 auto",
          width: 20,
          height: 20,
          borderRadius: TOKENS.radius.pill,
          background: TOKENS.color.danger,
          color: TOKENS.color.primaryFg,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: TOKENS.font.size.s,
          fontWeight: TOKENS.font.weight.bold,
          lineHeight: 1,
        }}
      >
        !
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p
          style={{
            margin: 0,
            fontSize: TOKENS.font.size.m,
            fontWeight: TOKENS.font.weight.semibold,
            color: TOKENS.color.danger,
          }}
        >
          Could not score this job
        </p>
        <p
          style={{
            margin: 0,
            marginTop: TOKENS.space.xxs,
            fontSize: TOKENS.font.size.s,
            color: TOKENS.color.fgMuted,
          }}
        >
          {message}
        </p>
      </div>
      <PrimaryButton onClick={onRetry} aria-label="Retry match score">
        Retry
      </PrimaryButton>
    </div>
  );
}
