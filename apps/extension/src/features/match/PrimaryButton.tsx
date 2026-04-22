import type { ButtonHTMLAttributes, CSSProperties } from "react";
import { TOKENS } from "./theme";

export type PrimaryButtonVariant = "primary" | "secondary";

export interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: PrimaryButtonVariant;
}

const BASE_STYLE: CSSProperties = {
  fontFamily: TOKENS.font.family,
  fontSize: TOKENS.font.size.m,
  fontWeight: TOKENS.font.weight.semibold,
  padding: `${TOKENS.space.s}px ${TOKENS.space.l}px`,
  borderRadius: TOKENS.radius.pill,
  cursor: "pointer",
  border: "1px solid transparent",
  lineHeight: 1.2,
  transition: "background 120ms ease, color 120ms ease, border-color 120ms ease",
};

const VARIANT_STYLE: Record<PrimaryButtonVariant, CSSProperties> = {
  primary: {
    background: TOKENS.color.primary,
    color: TOKENS.color.primaryFg,
  },
  secondary: {
    background: TOKENS.color.bg,
    color: TOKENS.color.primary,
    borderColor: TOKENS.color.primary,
  },
};

/**
 * Plasmo shadow DOM swallows LinkedIn's own button styles, so we ship a
 * simple, self-contained button instead of trying to inherit. Disabled state
 * dims instead of using native `:disabled` pseudo-classes (shadow DOM makes
 * those fiddly) so the visuals stay predictable.
 */
export function PrimaryButton({
  variant = "primary",
  disabled,
  style,
  ...rest
}: PrimaryButtonProps): JSX.Element {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled}
      style={{
        ...BASE_STYLE,
        ...VARIANT_STYLE[variant],
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : BASE_STYLE.cursor,
        ...style,
      }}
    />
  );
}
