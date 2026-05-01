import type { CSSProperties } from "react";

/**
 * Design tokens for the RoleGauge overlay. Lives inside a Plasmo shadow DOM so
 * we can't rely on page styles cascading in. Everything the UI needs is
 * reachable from here, making style changes audit-friendly.
 */
export const TOKENS = {
  color: {
    bg: "#ffffff",
    surface: "#f8fafc",
    fg: "#0f172a",
    fgMuted: "#475569",
    fgSubtle: "#64748b",
    border: "#e2e8f0",
    borderSubtle: "#eef2f6",
    primary: "#0a66c2",
    primaryHover: "#004182",
    primaryFg: "#ffffff",
    success: "#15803d",
    successBg: "#dcfce7",
    warning: "#d97706",
    warningBg: "#fef3c7",
    danger: "#dc2626",
    dangerBg: "#fee2e2",
    pillBg: "#ffffff",
    pillBorder: "#e2e8f0",
  },
  space: { xxs: 2, xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 24 },
  radius: { s: 6, m: 10, l: 14, xl: 18, pill: 9999 },
  font: {
    family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    size: { xs: 11, s: 12, m: 13, l: 15, xl: 18, score: 22 },
    weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  },
} as const;

export const CARD_STYLE: CSSProperties = {
  fontFamily: TOKENS.font.family,
  background: TOKENS.color.bg,
  border: `1px solid ${TOKENS.color.border}`,
  borderRadius: 8,
  margin: `${TOKENS.space.m}px 0 2rem`,
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
  color: TOKENS.color.fg,
  fontSize: TOKENS.font.size.m,
  lineHeight: 1.5,
  width: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  position: "relative",
  zIndex: 1,
};

export const CARD_HEADER_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: TOKENS.space.m,
  padding: `${TOKENS.space.m}px ${TOKENS.space.l}px`,
  borderBottom: `1px solid ${TOKENS.color.borderSubtle}`,
  flexWrap: "wrap",
};

export const ID_PILL_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: TOKENS.space.xs,
  padding: `${TOKENS.space.xxs}px ${TOKENS.space.s}px`,
  borderRadius: TOKENS.radius.s,
  background: TOKENS.color.surface,
  color: TOKENS.color.fgMuted,
  fontSize: TOKENS.font.size.xs,
  fontWeight: TOKENS.font.weight.medium,
  fontFamily: TOKENS.font.family,
};

export const LOCATION_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: TOKENS.space.xs,
  color: TOKENS.color.fgSubtle,
  fontSize: TOKENS.font.size.s,
  minWidth: 0,
};

export function scoreColor(score: number): string {
  if (score >= 75) return TOKENS.color.success;
  if (score >= 50) return TOKENS.color.warning;
  return TOKENS.color.danger;
}

export function scoreBandLabel(score: number): string {
  if (score >= 75) return "Strong match";
  if (score >= 50) return "Mixed match";
  return "Low match";
}
