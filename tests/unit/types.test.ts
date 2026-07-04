import { describe, it, expect } from "vitest";
import { isVibe, VIBE_KEYS } from "@/lib/types";

describe("isVibe", () => {
  it("accepts every declared vibe key", () => {
    for (const key of VIBE_KEYS) {
      expect(isVibe(key)).toBe(true);
    }
  });

  it("rejects unknown strings", () => {
    expect(isVibe("history")).toBe(false);
    expect(isVibe("Heritage")).toBe(false); // case-sensitive by design
    expect(isVibe("")).toBe(false);
    expect(isVibe("nature")).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(isVibe(null)).toBe(false);
    expect(isVibe(undefined)).toBe(false);
    expect(isVibe(42)).toBe(false);
    expect(isVibe({})).toBe(false);
    expect(isVibe([])).toBe(false);
    expect(isVibe(true)).toBe(false);
  });
});

describe("VIBE_KEYS", () => {
  it("exposes exactly the four supported vibes", () => {
    expect(VIBE_KEYS).toEqual(["heritage", "food", "arts", "spiritual"]);
  });
});
