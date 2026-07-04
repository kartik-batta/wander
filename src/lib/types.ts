/**
 * The four narrator personas Wander supports. A vibe is not a filter — it
 * is a system-prompt persona swap that reshapes narrative voice across
 * every stop of the generated journey.
 */
export type Vibe = "heritage" | "food" | "arts" | "spiritual";

/**
 * One stop in a Wander journey. `deep_*` fields are populated lazily by the
 * `/api/deepen` route when the user taps a card to expand it.
 */
export interface JourneyStop {
  /** Server-assigned id, stable within a journey (e.g. `s0`, `s1`). */
  id: string;
  /** Real, specific place name (e.g. "Hawa Mahal"). */
  name: string;
  /** One-line teaser, ≤ 90 characters. */
  hook: string;
  /** ~40 words, first-person present tense, sensory narrative. */
  narrative: string;
  /** ~20 words on historical or cultural significance. */
  heritage_note: string;
  /** 1 (famous) to 5 (truly off-the-beaten-path). Enforced via prompt. */
  hidden_gem_score: number;
  /** One local event, market, ritual, workshop, or authentic experience. */
  nearby_experience: string;
  /** Populated after a successful `/api/deepen` call. ~120 words. */
  deep_narrative?: string;
  /** Populated after a successful `/api/deepen` call. ~60 words. */
  deep_heritage?: string;
}

/**
 * A generated cultural journey. Stateless — journeys are never persisted;
 * they live only in the client's React state until the tab is closed.
 */
export interface Journey {
  destination: string;
  vibe: Vibe;
  stops: JourneyStop[];
}

/** The vibes Wander supports, in canonical UI order. */
export const VIBE_KEYS: Vibe[] = ["heritage", "food", "arts", "spiritual"];

/**
 * Type guard for arbitrary input from an untrusted source (request body,
 * URL param, form field). Case-sensitive; only exact matches to
 * {@link VIBE_KEYS} pass.
 */
export function isVibe(v: unknown): v is Vibe {
  return typeof v === "string" && (VIBE_KEYS as string[]).includes(v);
}
