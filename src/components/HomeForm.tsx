"use client";

import type React from "react";
import clsx from "clsx";
import type { Vibe } from "@/lib/types";
import { FOCUS_RING, VIBES } from "@/lib/constants";
import { VibeChip } from "./VibeChip";

/**
 * The initial destination + vibe form. Presentational; the parent owns all
 * state and passes an `onSubmit` callback. `destinationRef` is forwarded so
 * the parent can move focus into the input on validation errors and on
 * reset (WCAG 2.4.3).
 */
export function HomeForm(props: {
  destination: string;
  onDestinationChange: (v: string) => void;
  vibe: Vibe;
  onVibeChange: (v: Vibe) => void;
  loading: boolean;
  onSubmit: () => void;
  destinationRef: React.RefObject<HTMLInputElement>;
}) {
  const {
    destination,
    onDestinationChange,
    vibe,
    onVibeChange,
    loading,
    onSubmit,
    destinationRef,
  } = props;
  return (
    <>
      <h1 className="font-serif text-4xl leading-tight md:text-5xl">
        Wander through a city&rsquo;s story.
      </h1>
      <p className="mt-4 font-serif text-lg leading-relaxed text-muted">
        Tell us where you&rsquo;re going. We&rsquo;ll write your journey.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="mt-10 rounded-lg border border-border bg-surface p-6 shadow-card"
        aria-label="Generate a new journey"
      >
        <label
          className="block text-sm font-semibold text-ink"
          htmlFor="destination"
        >
          Destination
        </label>
        <input
          id="destination"
          name="destination"
          type="text"
          ref={destinationRef}
          value={destination}
          onChange={(e) => onDestinationChange(e.target.value)}
          placeholder="Try Jaipur, Kyoto, Lisbon…"
          className={clsx(
            "mt-2 w-full rounded-lg border border-border bg-bg px-4 py-3 font-serif text-lg text-ink placeholder:text-muted",
            "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
            "disabled:opacity-60"
          )}
          disabled={loading}
          maxLength={100}
          autoComplete="off"
          spellCheck="false"
          aria-required="true"
          aria-describedby="destination-hint"
        />
        <p id="destination-hint" className="mt-1 text-xs text-muted">
          Any city with a story. Max 100 characters.
        </p>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-ink">Vibe</legend>
          <p className="mt-1 text-xs text-muted">
            Pick a narrator. Same city, different soul.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {VIBES.map((v) => (
              <VibeChip
                key={v.key}
                label={v.label}
                pressed={vibe === v.key}
                onClick={() => onVibeChange(v.key)}
                disabled={loading}
              />
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={loading}
          className={clsx(
            "mt-8 w-full rounded-lg bg-accent px-6 py-3 text-base font-semibold text-surface transition-colors",
            "hover:bg-accent-hover disabled:opacity-60",
            FOCUS_RING
          )}
        >
          {loading ? "Weaving your journey…" : "Generate Journey"}
        </button>
      </form>
    </>
  );
}
