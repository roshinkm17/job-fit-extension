import { scoreColor, TOKENS } from "./theme";

export interface ScoreRingProps {
  readonly score: number;
  readonly size?: number;
}

const STROKE = 5;

/**
 * Compact circular score indicator. Pure SVG so it renders correctly inside
 * the Plasmo shadow DOM with no external style or font dependency. Shows the
 * integer score with a small "/ 100" denominator underneath.
 */
export function ScoreRing({ score, size = 64 }: ScoreRingProps): JSX.Element {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference * (1 - clamped / 100);
  const color = scoreColor(clamped);

  return (
    <div
      role="img"
      aria-label={`Fit score ${clamped} out of 100`}
      style={{
        position: "relative",
        width: size,
        height: size,
        flex: `0 0 ${size}px`,
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <title>Fit score</title>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={TOKENS.color.borderSubtle}
          strokeWidth={STROKE}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: TOKENS.font.family,
          color,
          lineHeight: 1,
        }}
      >
        <span
          style={{
            fontSize: TOKENS.font.size.score,
            fontWeight: TOKENS.font.weight.bold,
          }}
        >
          {clamped}
        </span>
        <span
          style={{
            marginTop: TOKENS.space.xxs,
            fontSize: TOKENS.font.size.xs,
            fontWeight: TOKENS.font.weight.medium,
            color: TOKENS.color.fgSubtle,
            letterSpacing: 0.4,
          }}
        >
          / 100
        </span>
      </div>
    </div>
  );
}
