import { describe, it, expect } from "vitest";
import {
  JOURNEY_SYSTEM_BASE,
  VIBE_PERSONAS,
  DEEPEN_SYSTEM,
} from "@/lib/prompts";
import { VIBE_KEYS } from "@/lib/types";

/**
 * The prompts are the product's LLM contract. These tests guard the parts that
 * would silently degrade output quality if edited carelessly.
 */

describe("JOURNEY_SYSTEM_BASE", () => {
  it("is a non-empty single string", () => {
    expect(typeof JOURNEY_SYSTEM_BASE).toBe("string");
    expect(JOURNEY_SYSTEM_BASE.length).toBeGreaterThan(200);
  });

  it("constrains stop count to 4-6 (enforced in prompt, not schema)", () => {
    expect(JOURNEY_SYSTEM_BASE).toMatch(/4 to 6/i);
  });

  it("constrains hidden_gem_score range 1-5 (enforced in prompt, not schema)", () => {
    expect(JOURNEY_SYSTEM_BASE).toMatch(/1 to 5/);
  });

  it("names every required stop field so the model can produce them", () => {
    for (const field of [
      "name",
      "hook",
      "narrative",
      "heritage_note",
      "hidden_gem_score",
      "nearby_experience",
    ]) {
      expect(JOURNEY_SYSTEM_BASE).toContain(field);
    }
  });

  it("instructs the model to return JSON matching the schema", () => {
    expect(JOURNEY_SYSTEM_BASE).toMatch(/return json/i);
  });
});

describe("VIBE_PERSONAS", () => {
  it("has exactly one persona per declared vibe", () => {
    expect(Object.keys(VIBE_PERSONAS).sort()).toEqual([...VIBE_KEYS].sort());
  });

  it("each persona is a non-empty string", () => {
    for (const key of VIBE_KEYS) {
      expect(typeof VIBE_PERSONAS[key]).toBe("string");
      expect(VIBE_PERSONAS[key].length).toBeGreaterThan(20);
    }
  });

  it("every persona starts with a Voice: directive", () => {
    for (const key of VIBE_KEYS) {
      expect(VIBE_PERSONAS[key]).toMatch(/^Voice:/);
    }
  });

  it("personas are unique so vibes produce distinct output", () => {
    const values = Object.values(VIBE_PERSONAS);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

describe("DEEPEN_SYSTEM", () => {
  it("references both deep_* fields the schema requires", () => {
    expect(DEEPEN_SYSTEM).toContain("deep_narrative");
    expect(DEEPEN_SYSTEM).toContain("deep_heritage");
  });

  it("tells the model to match the original vibe and not invent stops", () => {
    expect(DEEPEN_SYSTEM).toMatch(/persona|vibe/i);
    expect(DEEPEN_SYSTEM).toMatch(/do not invent new stops/i);
  });
});

describe("prompt composition (vibe as persona swap)", () => {
  it("base + persona composes into a single system prompt for every vibe", () => {
    for (const vibe of VIBE_KEYS) {
      const composed = `${JOURNEY_SYSTEM_BASE}\n\n${VIBE_PERSONAS[vibe]}`;
      expect(composed).toContain(JOURNEY_SYSTEM_BASE);
      expect(composed).toContain(VIBE_PERSONAS[vibe]);
      expect(composed.length).toBeGreaterThan(JOURNEY_SYSTEM_BASE.length);
    }
  });
});
