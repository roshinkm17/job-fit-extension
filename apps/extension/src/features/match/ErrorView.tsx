import { PrimaryButton } from "./PrimaryButton";
import { TOKENS } from "./theme";

export interface ErrorViewProps {
  readonly message: string;
  readonly onRetry: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps): JSX.Element {
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
