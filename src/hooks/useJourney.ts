"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Journey, JourneyStop, Vibe } from "@/lib/types";

/**
 * A journey session, encapsulated as a hook. Owns the destination + vibe
 * form state, the fetched journey, expand/deepen state, and error/loading
 * state. Also exposes refs so callers can move keyboard focus on state
 * transitions (form &harr; journey) — required by WCAG 2.4.3.
 *
 * All network calls hit our own `/api/*` routes; secrets never touch the
 * client, and the response contract is enforced by the strict `json_schema`
 * output on the server side.
 */
export function useJourney() {
  const [destination, setDestination] = useState("");
  const [vibe, setVibe] = useState<Vibe>("heritage");
  const [loading, setLoading] = useState(false);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deepeningId, setDeepeningId] = useState<string | null>(null);

  const destinationRef = useRef<HTMLInputElement>(null);
  const journeyHeadingRef = useRef<HTMLHeadingElement>(null);

  // Auto-dismiss errors after a short delay so the toast doesn't linger.
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(t);
  }, [error]);

  // Move keyboard focus to the journey heading when a journey renders so
  // screen-reader users are placed at the new content, not the vanished form.
  useEffect(() => {
    if (journey) journeyHeadingRef.current?.focus();
  }, [journey]);

  const generate = useCallback(
    async (nextVibe?: Vibe) => {
      const targetVibe = nextVibe ?? vibe;
      if (!destination.trim()) {
        setError("We need somewhere to wander.");
        destinationRef.current?.focus();
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
            vibe: targetVibe,
          }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || "Journey generation failed.");
        setJourney(json.data);
        setVibe(targetVibe);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Couldn't reach the storyteller. Try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [destination, vibe]
  );

  const toggleExpand = useCallback(
    async (stop: JourneyStop) => {
      if (!journey) return;
      if (expandedId === stop.id) {
        setExpandedId(null);
        return;
      }
      setExpandedId(stop.id);
      if (stop.deep_narrative) return; // already cached
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
    },
    [journey, expandedId]
  );

  const resetToForm = useCallback(() => {
    setJourney(null);
    setExpandedId(null);
    // rAF ensures the input has re-mounted before we call .focus().
    requestAnimationFrame(() => destinationRef.current?.focus());
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  return {
    // form state
    destination,
    setDestination,
    vibe,
    setVibe,
    // async state
    loading,
    error,
    dismissError,
    // journey state
    journey,
    expandedId,
    deepeningId,
    // actions
    generate,
    toggleExpand,
    resetToForm,
    // refs for focus management
    destinationRef,
    journeyHeadingRef,
  };
}
