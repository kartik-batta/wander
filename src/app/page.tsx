"use client";

import clsx from "clsx";
import { FOCUS_RING } from "@/lib/constants";
import { useJourney } from "@/hooks/useJourney";
import { HomeForm } from "@/components/HomeForm";
import { JourneyView } from "@/components/JourneyView";

/**
 * The single page of the Wander app. Orchestrates a {@link useJourney}
 * session between a {@link HomeForm} (empty state) and a {@link JourneyView}
 * (rendered state), plus a shared loading overlay and error toast.
 *
 * This component intentionally holds NO business logic — all state lives in
 * `useJourney`; all markup lives in the child components. Adding a new
 * screen means composing a new hook + component here.
 */
export default function Home() {
  const j = useJourney();

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
        aria-busy={j.loading}
      >
        <section className="mx-auto max-w-wander px-4 py-16 md:px-6 md:py-24">
          <p className="mb-6 text-xs uppercase tracking-[0.22em] text-muted">
            Wander
          </p>

          {!j.journey && (
            <HomeForm
              destination={j.destination}
              onDestinationChange={j.setDestination}
              vibe={j.vibe}
              onVibeChange={j.setVibe}
              loading={j.loading}
              onSubmit={() => j.generate()}
              destinationRef={j.destinationRef}
            />
          )}

          {j.journey && (
            <JourneyView
              journey={j.journey}
              loading={j.loading}
              expandedId={j.expandedId}
              deepeningId={j.deepeningId}
              onToggleExpand={j.toggleExpand}
              onRegenerate={(v) => j.generate(v)}
              onReset={j.resetToForm}
              headingRef={j.journeyHeadingRef}
            />
          )}
        </section>

        {/* Loading overlay: role="status" + aria-live announces progress. */}
        {j.loading && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-bg/70 backdrop-blur-[1px] motion-reduce:backdrop-blur-0"
            role="status"
            aria-live="polite"
          >
            <div className="rounded-lg border border-border bg-surface px-6 py-4 shadow-card">
              <p className="font-serif text-base text-ink">
                Weaving your journey through {j.destination || "the city"}
                <span className="sr-only">, please wait</span>&hellip;
              </p>
            </div>
          </div>
        )}

        {/* Error region: role="alert" + aria-live="assertive" announces immediately. */}
        {j.error && (
          <div
            role="alert"
            aria-live="assertive"
            className="fixed right-6 top-6 z-50 max-w-xs rounded-lg border border-danger bg-surface shadow-card"
          >
            <button
              type="button"
              onClick={j.dismissError}
              className={clsx(
                "w-full rounded-lg px-4 py-3 text-left text-sm text-danger",
                FOCUS_RING
              )}
              aria-label={`Dismiss error: ${j.error}`}
            >
              {j.error}
            </button>
          </div>
        )}
      </main>
    </>
  );
}
