import type { AnalyzeTag } from "@job-fit/shared";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

const TOOLTIP_SHOW_MS = 120;
const TOOLTIP_ID = "rolegauge-badge-tooltip";
const TOOLTIP_MAX_WIDTH = 220;
const GAP = 6;
const EST_HEIGHT = 48;

/**
 * Colored match/gap badges. Detail text appears in a small floating tooltip
 * (portaled to `document.body` so the card’s overflow does not clip it), with
 * a short show delay.
 */
export function BadgeStrip({ matches, gaps }: BadgeStripProps): JSX.Element | null {
  const badges: readonly Badge[] = [
    ...matches.map((tag) => ({ kind: "match" as const, label: tag.label, detail: tag.detail })),
    ...gaps.map((tag) => ({ kind: "gap" as const, label: tag.label, detail: tag.detail })),
  ];

  if (badges.length === 0) return null;

  return <BadgeStripInner badges={badges} />;
}

interface TooltipState {
  readonly text: string;
  readonly top: number;
  readonly left: number;
  readonly transform: "translateY(-100%)" | "none";
  readonly targetIndex: number;
}

function BadgeStripInner({ badges }: { readonly badges: readonly Badge[] }): JSX.Element {
  const [tip, setTip] = useState<TooltipState | null>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearShowTimer() {
    if (showTimer.current) {
      clearTimeout(showTimer.current);
      showTimer.current = null;
    }
  }

  useEffect(() => {
    if (!tip) return;
    function hide() {
      setTip(null);
    }
    globalThis.addEventListener("scroll", hide, true);
    globalThis.addEventListener("resize", hide);
    return () => {
      globalThis.removeEventListener("scroll", hide, true);
      globalThis.removeEventListener("resize", hide);
    };
  }, [tip]);

  function onLeaveBadge() {
    clearShowTimer();
    setTip(null);
  }

  function onEnterBadge(detail: string | undefined, index: number, el: HTMLElement) {
    clearShowTimer();
    if (!detail) return;
    showTimer.current = setTimeout(() => {
      const r = el.getBoundingClientRect();
      const w = globalThis.innerWidth;
      const left = Math.max(4, Math.min(r.left, w - 4 - TOOLTIP_MAX_WIDTH));
      const spaceAbove = r.top;
      if (spaceAbove > EST_HEIGHT + GAP) {
        setTip({
          text: detail,
          top: r.top - GAP,
          left,
          transform: "translateY(-100%)",
          targetIndex: index,
        });
      } else {
        setTip({
          text: detail,
          top: r.bottom + GAP,
          left,
          transform: "none",
          targetIndex: index,
        });
      }
    }, TOOLTIP_SHOW_MS);
  }

  const portal =
    tip &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        id={TOOLTIP_ID}
        role="tooltip"
        style={{
          position: "fixed",
          top: tip.top,
          left: tip.left,
          transform: tip.transform,
          zIndex: 2147483647,
          maxWidth: TOOLTIP_MAX_WIDTH,
          padding: `${TOKENS.space.xs}px ${TOKENS.space.s}px`,
          borderRadius: TOKENS.radius.s,
          border: `1px solid ${TOKENS.color.border}`,
          background: TOKENS.color.bg,
          color: TOKENS.color.fgMuted,
          fontSize: TOKENS.font.size.s,
          lineHeight: 1.5,
          boxShadow: "0 4px 12px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.04)",
          fontFamily: TOKENS.font.family,
          pointerEvents: "none",
        }}
      >
        {tip.text}
      </div>,
      document.body,
    );

  return (
    <div>
      <ul
        aria-label="Match details"
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
            // biome-ignore lint/suspicious/noArrayIndexKey: stable list per render; labels can repeat across kinds
            key={`${badge.kind}:${badge.label}:${index}`}
            badge={badge}
            isDescribed={tip !== null && tip.targetIndex === index}
            onEnter={(el) => onEnterBadge(badge.detail, index, el)}
            onLeave={onLeaveBadge}
          />
        ))}
      </ul>
      {portal}
    </div>
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
  readonly isDescribed: boolean;
  readonly onEnter: (el: HTMLElement) => void;
  readonly onLeave: () => void;
}

function MatchBadge({ badge, isDescribed, onEnter, onLeave }: MatchBadgeProps): JSX.Element {
  const palette = PALETTES[badge.kind];
  const hasDetail = Boolean(badge.detail);

  return (
    <li
      aria-describedby={isDescribed ? TOOLTIP_ID : undefined}
      aria-label={badge.label}
      onPointerEnter={hasDetail ? (e) => onEnter(e.currentTarget) : undefined}
      onPointerLeave={hasDetail ? onLeave : undefined}
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
        cursor: hasDetail ? "help" : "default",
      }}
    >
      <Icon name={palette.icon} size={12} color={palette.iconColor} />
      {badge.label}
    </li>
  );
}
