import type { AnalyzeResult } from "@job-fit/shared";
import { BadgeStrip } from "./BadgeStrip";
import { ScoreRing } from "./ScoreRing";
import { scoreBandLabel, scoreColor, TOKENS } from "./theme";

export interface ResultViewProps {
  readonly result: AnalyzeResult;
}

export function ResultView({ result }: ResultViewProps): JSX.Element {
  const bandColor = scoreColor(result.fitScore);
  const hasBadges = result.matches.length + result.mismatches.length > 0;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: TOKENS.space.l,
          padding: `${TOKENS.space.m}px ${TOKENS.space.l}px`,
        }}
      >
        <ScoreRing score={result.fitScore} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <BandPill color={bandColor} label={scoreBandLabel(result.fitScore)} />
          <p
            style={{
              margin: 0,
              marginTop: TOKENS.space.s,
              fontSize: TOKENS.font.size.m,
              color: TOKENS.color.fgMuted,
              lineHeight: 1.5,
            }}
          >
            {result.summary}
          </p>
        </div>
      </div>
      {hasBadges ? (
        <div
          style={{
            padding: `${TOKENS.space.m}px ${TOKENS.space.l}px`,
            borderTop: `1px solid ${TOKENS.color.borderSubtle}`,
          }}
        >
          <BadgeStrip matches={result.matches} gaps={result.mismatches} />
        </div>
      ) : null}
    </div>
  );
}

interface BandPillProps {
  readonly color: string;
  readonly label: string;
}

/**
 * Subtle tinted badge: a soft tint of the score's accent color for the
 * surface, full accent for the text, plus a solid accent dot. Matches the
 * Mixed Match / Strong Match / Low Match look in the mockup.
 */
function BandPill({ color, label }: BandPillProps): JSX.Element {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: TOKENS.space.xs,
        padding: `${TOKENS.space.xxs}px ${TOKENS.space.s}px`,
        borderRadius: TOKENS.radius.pill,
        background: `${color}14`,
        color,
        fontSize: TOKENS.font.size.xs,
        fontWeight: TOKENS.font.weight.bold,
        letterSpacing: 0.8,
        textTransform: "uppercase",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
        }}
      />
      {label}
    </span>
  );
}
