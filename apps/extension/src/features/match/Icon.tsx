import type { CSSProperties } from "react";

export type IconName = "check" | "cross" | "pin";

export interface IconProps {
  readonly name: IconName;
  readonly size?: number;
  readonly color?: string;
  readonly title?: string;
  readonly style?: CSSProperties;
}

/**
 * Tiny inline-SVG icon set. Inline so the extension stays self-contained
 * (no asset bundling, no font loads), and so the shadow-DOM overlay doesn't
 * inherit icon fonts from the host page.
 */
export function Icon({
  name,
  size = 16,
  color = "currentColor",
  title,
  style,
}: IconProps): JSX.Element {
  return (
    <svg
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: "0 0 auto", ...style }}
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name]}
    </svg>
  );
}

const PATHS: Record<IconName, JSX.Element> = {
  check: (
    <>
      <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" stroke="#ffffff" />
    </>
  ),
  cross: (
    <>
      <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" />
      <path d="M9 9l6 6M15 9l-6 6" stroke="#ffffff" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
};
