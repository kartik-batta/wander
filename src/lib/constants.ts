import type { Vibe } from "./types";

/**
 * The four narrator personas the UI exposes as vibe chips. Order controls
 * the on-screen order of the chips. Adding a fifth vibe is one entry here
 * plus a matching entry in {@link VIBE_PERSONAS} and the {@link Vibe} type.
 */
export const VIBES: ReadonlyArray<{ key: Vibe; label: string }> = [
  { key: "heritage", label: "Heritage" },
  { key: "food", label: "Food" },
  { key: "arts", label: "Arts" },
  { key: "spiritual", label: "Spiritual" },
];

/** Look up the human-readable label for a vibe key, with a safe fallback. */
export function vibeLabel(v: Vibe): string {
  return VIBES.find((x) => x.key === v)?.label ?? v;
}

/**
 * Focus-visible ring applied to every interactive element in the UI. Kept
 * in one constant so a single edit updates keyboard-focus styling everywhere
 * and keeps the visual contract auditable in one place.
 */
export const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg";
