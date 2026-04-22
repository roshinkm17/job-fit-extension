import type { AnalyzeTag } from "@job-fit/shared";
import { Icon, type IconName } from "./Icon";
import { TOKENS } from "./theme";

export type BadgeKind = "match" | "gap";

interface Badge {
  readonly kind: BadgeKind;
  readonly label: string;
  readonly detail?: string | undefined;
}

export interface BadgeStripProps {
  readonly matches: readonly AnalyzeTag[];
  readonly gaps: readonly AnalyzeTag[];
}

/**
 * Single wrapping list of colored match/gap badges. Matches render green with
 * a check icon, gaps render red with a cross. Order is stable (matches first,
 * then gaps) so the visual hierarchy leads with the positive signal.
 */
export function BadgeStrip({ matches, gaps }: BadgeStripProps): JSX.Element | null {
  const badges: readonly Badge[] = [
    ...matches.map((tag) => ({ kind: "match" as const, label: tag.label, detail: tag.detail })),
    ...gaps.map((tag) => ({ kind: "gap" as const, label: tag.label, detail: tag.detail })),
  ];

  if (badges.length === 0) return null;

  return (
    <ul
      aria-label="Match signals"
      style={{
        margin: 0,
        padding: 0,
        listStyle: "none",
        display: "flex",
        flexWrap: "wrap",
        gap: TOKENS.space.xs,
      }}
    >
      {badges.map((badge, index) => (
        <MatchBadge
          badge={badge}
          // Static list per render; content + index is the most stable key we
          // can synthesise without mutating the backend response.
          // biome-ignore lint/suspicious/noArrayIndexKey: stable list; see comment above
          key={`${badge.kind}:${badge.label}:${index}`}
        />
      ))}
    </ul>
  );
}

interface Palette {
  readonly background: string;
  readonly border: string;
  readonly text: string;
  readonly icon: IconName;
  readonly iconColor: string;
}

const PALETTES: Record<BadgeKind, Palette> = {
  match: {
    background: TOKENS.color.successBg,
    border: `${TOKENS.color.success}33`,
    text: TOKENS.color.success,
    icon: "check",
    iconColor: TOKENS.color.success,
  },
  gap: {
    background: TOKENS.color.dangerBg,
    border: `${TOKENS.color.danger}33`,
    text: TOKENS.color.danger,
    icon: "cross",
    iconColor: TOKENS.color.danger,
  },
};

interface MatchBadgeProps {
  readonly badge: Badge;
}

function MatchBadge({ badge }: MatchBadgeProps): JSX.Element {
  const palette = PALETTES[badge.kind];
  const ariaLabel = `${badge.kind === "match" ? "Match" : "Gap"}: ${badge.label}`;

  return (
    <li
      aria-label={ariaLabel}
      title={badge.detail}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: TOKENS.space.xs,
        padding: `${TOKENS.space.xxs}px ${TOKENS.space.s}px`,
        borderRadius: TOKENS.radius.pill,
        border: `1px solid ${palette.border}`,
        background: palette.background,
        color: palette.text,
        fontSize: TOKENS.font.size.s,
        fontWeight: TOKENS.font.weight.semibold,
        lineHeight: 1.6,
        cursor: badge.detail ? "help" : "default",
      }}
    >
      <Icon name={palette.icon} size={12} color={palette.iconColor} />
      {badge.label}
    </li>
  );
}
