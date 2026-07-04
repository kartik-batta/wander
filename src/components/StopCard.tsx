"use client";

import clsx from "clsx";
import type { JourneyStop } from "@/lib/types";
import { FOCUS_RING } from "@/lib/constants";
import { GemBadge } from "./GemBadge";

/**
 * A journey stop card. Renders one of the six deliverables from the
 * challenge brief in a single unit:
 *
 *   - attraction (name + hook)                     recommend attractions
 *   - narrative (immersive, first-person)          immersive storytelling
 *   - heritage_note                                promote heritage
 *   - hidden_gem_score badge                       uncover hidden gems
 *   - nearby_experience                            suggest local events
 *   - deep_narrative + deep_heritage (on expand)   authentic experiences
 *
 * The card is expandable; the trigger is a native `<button>` that visually
 * stretches across the entire article via absolute positioning, so clicking
 * anywhere on the card fires the expand handler. The stop name lives OUTSIDE
 * the button — as a real `<h2>` — so heading navigation works and the HTML
 * is valid (`<h2>` inside `<button>` is not allowed).
 */
export function StopCard(props: {
  stop: JourneyStop;
  index: number;
  expanded: boolean;
  deepening: boolean;
  onClick: () => void;
}) {
  const { stop, index, expanded, deepening, onClick } = props;
  const detailId = `stop-${stop.id}-detail`;
  const cardId = `stop-${stop.id}-card`;
  return (
    <article
      id={cardId}
      className="relative isolate rounded-lg border border-border bg-surface p-6 shadow-card"
    >
      <p className="text-xs uppercase tracking-wider text-muted">
        Stop {index + 1}
      </p>
      <h2 className="mt-1 font-serif text-xl font-semibold text-ink">
        {stop.name}
      </h2>

      <button
        type="button"
        onClick={onClick}
        aria-expanded={expanded}
        aria-controls={detailId}
        aria-label={`${expanded ? "Collapse" : "Expand"} deeper story for ${stop.name}`}
        className={clsx(
          "absolute inset-0 rounded-lg",
          "before:absolute before:inset-0 before:rounded-lg",
          FOCUS_RING
        )}
      />

      <p className="pointer-events-none mt-1 font-serif text-sm italic text-muted">
        {stop.hook}
      </p>
      <p className="pointer-events-none mt-4 font-serif text-base leading-relaxed text-ink">
        {stop.narrative}
      </p>

      <dl className="pointer-events-none mt-5 space-y-2 text-xs">
        <div className="flex flex-wrap gap-1">
          <dt className="uppercase tracking-wider text-muted">
            Heritage&nbsp;&middot;&nbsp;
          </dt>
          <dd className="text-ink">{stop.heritage_note}</dd>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <div className="inline-flex items-center gap-2">
            <dt className="uppercase tracking-wider text-muted">Hidden gem</dt>
            <dd>
              <GemBadge score={stop.hidden_gem_score} />
            </dd>
          </div>
          <div className="flex flex-wrap gap-1">
            <dt className="uppercase tracking-wider text-muted">
              Nearby&nbsp;&middot;&nbsp;
            </dt>
            <dd className="text-ink">{stop.nearby_experience}</dd>
          </div>
        </div>
      </dl>

      {/*
       * The aria-live region is ALWAYS rendered so screen readers can pick
       * up subsequent changes. Its content is toggled instead of the region
       * itself — announcing into a region that just materialized is
       * unreliable across assistive-tech implementations.
       */}
      <div id={detailId} aria-live="polite" className="pointer-events-none">
        {expanded && (
          <div className="mt-6 border-t border-border pt-6">
            {deepening && !stop.deep_narrative && (
              <p className="font-serif text-sm text-muted" role="status">
                Deepening the story
                <span className="sr-only">, please wait</span>&hellip;
              </p>
            )}
            {stop.deep_narrative && (
              <>
                <p className="font-serif text-base leading-relaxed text-ink">
                  {stop.deep_narrative}
                </p>
                {stop.deep_heritage && (
                  <p className="mt-4 font-serif text-sm leading-relaxed text-muted">
                    {stop.deep_heritage}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
