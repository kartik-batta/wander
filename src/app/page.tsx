"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import type { Journey, JourneyStop, Vibe } from "@/lib/types";

const VIBES: { key: Vibe; label: string }[] = [
  { key: "heritage", label: "Heritage" },
  { key: "food", label: "Food" },
  { key: "arts", label: "Arts" },
  { key: "spiritual", label: "Spiritual" },
];

function vibeLabel(v: Vibe): string {
  return VIBES.find((x) => x.key === v)?.label ?? v;
}

/**
 * Standard focus-visible ring applied to every interactive element.
 * Kept in one constant so a single change updates keyboard focus everywhere.
 */
const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

export default function Home() {
  const [destination, setDestination] = useState("");
  const [vibe, setVibe] = useState<Vibe>("heritage");
  const [loading, setLoading] = useState(false);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deepeningId, setDeepeningId] = useState<string | null>(null);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(t);
  }, [error]);

  async function generate(nextVibe: Vibe = vibe) {
    if (!destination.trim()) {
      setError("We need somewhere to wander.");
      return;
    }
    setLoading(true);
    setError(null);
    setExpandedId(null);
    try {
      const res = await fetch("/api/journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: destination.trim(),
          vibe: nextVibe,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Journey generation failed.");
      setJourney(json.data);
      setVibe(nextVibe);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Couldn't reach the storyteller. Try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function toggleExpand(stop: JourneyStop) {
    if (!journey) return;
    if (expandedId === stop.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(stop.id);
    if (stop.deep_narrative) return;
    setDeepeningId(stop.id);
    try {
      const res = await fetch("/api/deepen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: journey.destination,
          vibe: journey.vibe,
          stop,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Deepening failed.");
      setJourney((prev) =>
        prev
          ? {
              ...prev,
              stops: prev.stops.map((s) =>
                s.id === stop.id ? { ...s, ...json.data } : s
              ),
            }
          : prev
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Couldn't fetch a deeper story."
      );
    } finally {
      setDeepeningId(null);
    }
  }

  function resetToForm() {
    setJourney(null);
    setExpandedId(null);
  }

  return (
    <>
      <a
        href="#wander-main"
        className={clsx(
          "sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-surface",
          FOCUS_RING
        )}
      >
        Skip to main content
      </a>

      <main
        id="wander-main"
        className="min-h-screen bg-bg text-ink"
        aria-busy={loading}
      >
        <section className="mx-auto max-w-wander px-4 py-16 md:px-6 md:py-24">
          <p className="mb-6 text-xs uppercase tracking-[0.22em] text-muted">
            Wander
          </p>

          {!journey && (
            <HomeForm
              destination={destination}
              onDestinationChange={setDestination}
              vibe={vibe}
              onVibeChange={setVibe}
              loading={loading}
              onSubmit={() => generate()}
            />
          )}

          {journey && (
            <JourneyView
              journey={journey}
              vibe={vibe}
              loading={loading}
              expandedId={expandedId}
              deepeningId={deepeningId}
              onToggleExpand={toggleExpand}
              onRegenerate={(v) => generate(v)}
              onReset={resetToForm}
            />
          )}
        </section>

        {/* Loading overlay: role="status" + aria-live announces to screen readers. */}
        {loading && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-bg/70 backdrop-blur-[1px]"
            role="status"
            aria-live="polite"
          >
            <div className="rounded-lg border border-border bg-surface px-6 py-4 shadow-card">
              <p className="font-serif text-base text-ink">
                Weaving your journey through {destination || "the city"}
                <span className="sr-only">, please wait</span>&hellip;
              </p>
            </div>
          </div>
        )}

        {/*
         * Error region: role="alert" + aria-live="assertive" so screen readers
         * announce immediately. The inner button lets sighted users dismiss
         * with a click; keyboard users get the same via focus + Enter.
         */}
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="fixed right-6 top-6 z-50 max-w-xs rounded-lg border border-danger bg-surface shadow-card"
          >
            <button
              type="button"
              onClick={() => setError(null)}
              className={clsx(
                "w-full px-4 py-3 text-left text-sm text-danger",
                FOCUS_RING,
                "rounded-lg"
              )}
              aria-label={`Dismiss error: ${error}`}
            >
              {error}
            </button>
          </div>
        )}
      </main>
    </>
  );
}

function HomeForm(props: {
  destination: string;
  onDestinationChange: (v: string) => void;
  vibe: Vibe;
  onVibeChange: (v: Vibe) => void;
  loading: boolean;
  onSubmit: () => void;
}) {
  const { destination, onDestinationChange, vibe, onVibeChange, loading, onSubmit } =
    props;
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
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Vibe">
            {VIBES.map((v) => {
              const active = vibe === v.key;
              return (
                <button
                  key={v.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onVibeChange(v.key)}
                  disabled={loading}
                  className={clsx(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "border-accent bg-accent text-surface"
                      : "border-accent-hover/60 bg-transparent text-accent-hover hover:border-accent-hover",
                    "disabled:opacity-60",
                    FOCUS_RING
                  )}
                >
                  {v.label}
                </button>
              );
            })}
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

function JourneyView(props: {
  journey: Journey;
  vibe: Vibe;
  loading: boolean;
  expandedId: string | null;
  deepeningId: string | null;
  onToggleExpand: (stop: JourneyStop) => void;
  onRegenerate: (v: Vibe) => void;
  onReset: () => void;
}) {
  const { journey, loading, expandedId, deepeningId, onToggleExpand, onRegenerate, onReset } =
    props;
  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted">
            {journey.destination} &middot; {vibeLabel(journey.vibe)}
          </p>
          <h1 className="mt-2 font-serif text-3xl leading-tight md:text-4xl">
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

      <ol className="mt-10 space-y-6" aria-label={`Journey through ${journey.destination}`}>
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
        aria-label="Regenerate journey with a different vibe"
      >
        <p className="text-sm font-semibold text-ink">
          Regenerate with a different vibe
        </p>
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Choose a different vibe">
          {VIBES.map((v) => {
            const active = journey.vibe === v.key;
            return (
              <button
                key={v.key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onRegenerate(v.key)}
                disabled={loading}
                className={clsx(
                  "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "border-accent bg-accent text-surface"
                    : "border-accent-hover/60 bg-transparent text-accent-hover hover:border-accent-hover",
                  "disabled:opacity-60",
                  FOCUS_RING
                )}
              >
                {v.label}
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}

function StopCard(props: {
  stop: JourneyStop;
  index: number;
  expanded: boolean;
  deepening: boolean;
  onClick: () => void;
}) {
  const { stop, index, expanded, deepening, onClick } = props;
  const detailId = `stop-${stop.id}-detail`;
  return (
    <article className="rounded-lg border border-border bg-surface p-6 shadow-card">
      <button
        type="button"
        onClick={onClick}
        className={clsx("w-full rounded text-left", FOCUS_RING)}
        aria-expanded={expanded}
        aria-controls={detailId}
      >
        <p className="text-xs uppercase tracking-wider text-muted">
          Stop {index + 1}
        </p>
        <h2 className="mt-1 font-serif text-xl font-semibold text-ink">
          {stop.name}
        </h2>
        <p className="mt-1 font-serif text-sm italic text-muted">
          {stop.hook}
        </p>
        <p className="mt-4 font-serif text-base leading-relaxed text-ink">
          {stop.narrative}
        </p>
      </button>

      <dl className="mt-5 space-y-2 text-xs">
        <div className="flex flex-wrap gap-1">
          <dt className="uppercase tracking-wider text-muted">Heritage&nbsp;&middot;&nbsp;</dt>
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
            <dt className="uppercase tracking-wider text-muted">Nearby&nbsp;&middot;&nbsp;</dt>
            <dd className="text-ink">{stop.nearby_experience}</dd>
          </div>
        </div>
      </dl>

      <div
        id={detailId}
        hidden={!expanded}
        aria-live="polite"
      >
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

function GemBadge({ score }: { score: number }) {
  const s = Math.max(0, Math.min(5, Math.round(score)));
  return (
    <span
      className="inline-flex items-center gap-[3px] align-middle"
      role="img"
      aria-label={`Hidden gem score ${s} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          aria-hidden="true"
          className={clsx(
            "block h-2 w-2 rounded-full",
            n <= s ? "bg-accent" : "bg-border"
          )}
        />
      ))}
    </span>
  );
}
