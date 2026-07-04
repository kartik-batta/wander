import { isVibe, type JourneyStop, type Vibe } from "./types";

/**
 * Result of parsing an incoming API request body. Discriminated on `ok`.
 * A `false` result carries a user-safe error message and an HTTP status hint;
 * a `true` result carries the validated payload.
 */
export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; status: number };

export interface JourneyRequest {
  destination: string;
  vibe: Vibe;
}

export interface DeepenRequest {
  destination: string;
  vibe: Vibe;
  stop: JourneyStop;
}

const MAX_DESTINATION_LENGTH = 100;

/**
 * Validate a `/api/journey` request body. Returns either the trimmed
 * destination and validated vibe, or a user-safe error with HTTP status.
 */
export function parseJourneyRequest(body: unknown): ParseResult<JourneyRequest> {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body.", status: 400 };
  }
  const b = body as Record<string, unknown>;
  const destination = typeof b.destination === "string" ? b.destination.trim() : "";

  if (!destination) {
    return { ok: false, error: "We need somewhere to wander.", status: 400 };
  }
  if (destination.length > MAX_DESTINATION_LENGTH) {
    return { ok: false, error: "Destination is too long.", status: 400 };
  }
  if (!isVibe(b.vibe)) {
    return { ok: false, error: "Unknown vibe.", status: 400 };
  }
  return { ok: true, value: { destination, vibe: b.vibe } };
}

/**
 * Validate a `/api/deepen` request body. The `stop` field is checked
 * structurally — every field that the deepen prompt uses must be present
 * so the LLM has enough context to extend the story coherently.
 */
export function parseDeepenRequest(body: unknown): ParseResult<DeepenRequest> {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body.", status: 400 };
  }
  const b = body as Record<string, unknown>;
  const destination = typeof b.destination === "string" ? b.destination.trim() : "";
  if (!destination) {
    return { ok: false, error: "Missing destination.", status: 400 };
  }
  if (!isVibe(b.vibe)) {
    return { ok: false, error: "Unknown vibe.", status: 400 };
  }
  const stop = b.stop;
  if (!isJourneyStop(stop)) {
    return { ok: false, error: "Missing or malformed stop.", status: 400 };
  }
  return { ok: true, value: { destination, vibe: b.vibe, stop } };
}

function isJourneyStop(value: unknown): value is JourneyStop {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.id === "string" &&
    typeof s.name === "string" &&
    s.name.length > 0 &&
    typeof s.hook === "string" &&
    typeof s.narrative === "string" &&
    typeof s.heritage_note === "string" &&
    typeof s.hidden_gem_score === "number" &&
    typeof s.nearby_experience === "string"
  );
}
