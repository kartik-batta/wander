import { describe, it, expect } from "vitest";
import {
  parseJourneyRequest,
  parseDeepenRequest,
} from "@/lib/validation";
import type { JourneyStop } from "@/lib/types";

const validStop: JourneyStop = {
  id: "s0",
  name: "Hawa Mahal",
  hook: "A honeycomb of latticed windows overlooking the bazaar.",
  narrative: "I stand below its pink sandstone façade at dusk.",
  heritage_note: "Built in 1799 by Maharaja Sawai Pratap Singh.",
  hidden_gem_score: 2,
  nearby_experience: "Evening bazaar at Johari Bazaar.",
};

describe("parseJourneyRequest", () => {
  it("accepts a valid body and trims destination whitespace", () => {
    const result = parseJourneyRequest({ destination: "  Jaipur  ", vibe: "heritage" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ destination: "Jaipur", vibe: "heritage" });
    }
  });

  it.each(["heritage", "food", "arts", "spiritual"] as const)(
    "accepts vibe=%s",
    (vibe) => {
      const result = parseJourneyRequest({ destination: "Kyoto", vibe });
      expect(result.ok).toBe(true);
    }
  );

  it("rejects empty or whitespace-only destination", () => {
    for (const destination of ["", "   ", "\n\t"]) {
      const result = parseJourneyRequest({ destination, vibe: "heritage" });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.status).toBe(400);
    }
  });

  it("rejects destinations over 100 characters", () => {
    const result = parseJourneyRequest({
      destination: "x".repeat(101),
      vibe: "heritage",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("rejects unknown vibe", () => {
    const result = parseJourneyRequest({ destination: "Lisbon", vibe: "history" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("rejects non-object bodies", () => {
    for (const bad of [null, undefined, "hello", 42, true, []]) {
      const result = parseJourneyRequest(bad);
      expect(result.ok).toBe(false);
    }
  });

  it("rejects missing destination or vibe fields", () => {
    expect(parseJourneyRequest({ vibe: "heritage" }).ok).toBe(false);
    expect(parseJourneyRequest({ destination: "Jaipur" }).ok).toBe(false);
  });
});

describe("parseDeepenRequest", () => {
  it("accepts a well-formed body", () => {
    const result = parseDeepenRequest({
      destination: "Jaipur",
      vibe: "heritage",
      stop: validStop,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stop.name).toBe(validStop.name);
    }
  });

  it("rejects malformed stop (missing name)", () => {
    const badStop = { ...validStop, name: "" };
    const result = parseDeepenRequest({
      destination: "Jaipur",
      vibe: "heritage",
      stop: badStop,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects missing stop entirely", () => {
    const result = parseDeepenRequest({
      destination: "Jaipur",
      vibe: "heritage",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects wrong-typed hidden_gem_score", () => {
    const badStop = { ...validStop, hidden_gem_score: "high" as unknown as number };
    const result = parseDeepenRequest({
      destination: "Jaipur",
      vibe: "heritage",
      stop: badStop,
    });
    expect(result.ok).toBe(false);
  });

  it("returns the exact user-facing error text (no stack leaks)", () => {
    const result = parseDeepenRequest({ destination: "", vibe: "heritage", stop: validStop });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).not.toMatch(/error|stack|trace/i);
      expect(result.error.length).toBeLessThan(120);
    }
  });
});
