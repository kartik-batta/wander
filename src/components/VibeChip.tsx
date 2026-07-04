"use client";

import clsx from "clsx";
import { FOCUS_RING } from "@/lib/constants";

/**
 * A single vibe toggle button.
 *
 * Uses `aria-pressed` so screen readers announce the pressed/unpressed
 * state; uses `aria-disabled` (rather than the native `disabled` attribute)
 * during loading so the button remains focusable and its state is announced
 * as unavailable, instead of vanishing from the tab order entirely.
 */
export function VibeChip(props: {
  label: string;
  pressed: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const { label, pressed, disabled, onClick } = props;
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={clsx(
        "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
        pressed
          ? "border-accent bg-accent text-surface"
          : "border-accent-hover/60 bg-transparent text-accent-hover hover:border-accent-hover",
        disabled && "opacity-60 cursor-not-allowed",
        FOCUS_RING
      )}
    >
      {label}
    </button>
  );
}
