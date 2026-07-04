"use client";

import type React from "react";
import clsx from "clsx";
import type { Journey, JourneyStop, Vibe } from "@/lib/types";
import { FOCUS_RING, VIBES, vibeLabel } from "@/lib/constants";
import { StopCard } from "./StopCard";
import { VibeChip } from "./VibeChip";

/**
 * The rendered journey — a stack of {@link StopCard}s wrapped in an ordered
 * list, plus a "regenerate with a different vibe" panel below. Presentational;
 * the parent owns all state and passes callbacks. `headingRef` is forwarded
 * so the parent can move focus to the heading when a journey renders.
 */
export function JourneyView(props: {
  journey: Journey;
  loading: boolean;
  expandedId: string | null;
  deepeningId: string | null;
  onToggleExpand: (stop: JourneyStop) => void;
  onRegenerate: (v: Vibe) => void;
  onReset: () => void;
  headingRef: React.RefObject<HTMLHeadingElement>;
}) {
  const {
    journey,
    loading,
    expandedId,
    deepeningId,
    onToggleExpand,
    onRegenerate,
    onReset,
    headingRef,
  } = props;
  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted">
            {journey.destination} &middot; {vibeLabel(journey.vibe)}
          </p>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className={clsx(
              "mt-2 font-serif text-3xl leading-tight md:text-4xl",
              FOCUS_RING
            )}
          >
            Your journey.
          </h1>
        </div>
        <button
          type="button"
          onClick={onReset}
          className={clsx(
            "whitespace-nowrap rounded text-sm font-semibold text-accent-hover hover:text-accent",
            FOCUS_RING
          )}
        >
          New destination
        </button>
      </div>

      <ol
        className="mt-10 space-y-6"
        aria-label={`Journey through ${journey.destination}`}
      >
        {journey.stops.map((stop, index) => (
          <li key={stop.id}>
            <StopCard
              stop={stop}
              index={index}
              expanded={expandedId === stop.id}
              deepening={deepeningId === stop.id}
              onClick={() => onToggleExpand(stop)}
            />
          </li>
        ))}
      </ol>

      <section
        className="mt-12 rounded-lg border border-border bg-surface-alt p-6"
        aria-labelledby="regenerate-title"
      >
        <p id="regenerate-title" className="text-sm font-semibold text-ink">
          Regenerate with a different vibe
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {VIBES.map((v) => (
            <VibeChip
              key={v.key}
              label={v.label}
              pressed={journey.vibe === v.key}
              onClick={() => onRegenerate(v.key)}
              disabled={loading}
            />
          ))}
        </div>
      </section>
    </>
  );
}
