import { describe, it, expect } from "vitest";
import { JOURNEY_SCHEMA, DEEPEN_SCHEMA } from "@/lib/schemas";

/**
 * OpenAI strict-mode `json_schema` requires:
 *   1. `additionalProperties: false` on every object
 *   2. every property listed in `required`
 *   3. no unsupported keywords (minItems, minimum, pattern, ...)
 *
 * These tests lock the contract so a well-meaning schema tweak can't silently
 * break the OpenAI call at runtime.
 */

type ObjectSchema = {
  type: "object";
  properties: Record<string, unknown>;
  required: string[];
  additionalProperties: boolean;
};

function isObjectSchema(node: unknown): node is ObjectSchema {
  return (
    !!node &&
    typeof node === "object" &&
    (node as Record<string, unknown>).type === "object"
  );
}

function walkObjectSchemas(node: unknown, path: string, visit: (n: ObjectSchema, p: string) => void) {
  if (isObjectSchema(node)) {
    visit(node, path);
    for (const [key, child] of Object.entries(node.properties)) {
      walkObjectSchemas(child, `${path}.properties.${key}`, visit);
    }
  } else if (node && typeof node === "object") {
    const n = node as Record<string, unknown>;
    if (n.type === "array" && n.items) {
      walkObjectSchemas(n.items, `${path}.items`, visit);
    }
  }
}

const BANNED_KEYWORDS = [
  "minItems",
  "maxItems",
  "minimum",
  "maximum",
  "minLength",
  "maxLength",
  "pattern",
  "format",
];

function assertNoBannedKeywords(node: unknown, path: string) {
  if (!node || typeof node !== "object") return;
  const n = node as Record<string, unknown>;
  for (const banned of BANNED_KEYWORDS) {
    if (banned in n) {
      throw new Error(`${path} contains banned keyword "${banned}" (strict-mode json_schema forbids it)`);
    }
  }
  for (const [key, child] of Object.entries(n)) {
    assertNoBannedKeywords(child, `${path}.${key}`);
  }
}

describe("JOURNEY_SCHEMA", () => {
  it("is a strict-compatible object schema", () => {
    expect(JOURNEY_SCHEMA.type).toBe("object");
    expect(JOURNEY_SCHEMA.additionalProperties).toBe(false);
  });

  it("requires exactly one top-level property: stops", () => {
    expect(JOURNEY_SCHEMA.required).toEqual(["stops"]);
    expect(Object.keys(JOURNEY_SCHEMA.properties as Record<string, unknown>)).toEqual(["stops"]);
  });

  it("declares every stop field as required and forbids extras", () => {
    walkObjectSchemas(JOURNEY_SCHEMA, "root", (obj, path) => {
      expect(obj.additionalProperties, `${path}.additionalProperties`).toBe(false);
      const requiredKeys = new Set(obj.required);
      const propertyKeys = new Set(Object.keys(obj.properties));
      expect(requiredKeys, `${path}.required must equal properties keys`).toEqual(propertyKeys);
    });
  });

  it("has every stop field the deepen prompt depends on", () => {
    const stopSchema = (
      (JOURNEY_SCHEMA.properties as Record<string, unknown>).stops as Record<string, unknown>
    ).items as ObjectSchema;
    const props = Object.keys(stopSchema.properties);
    expect(props).toContain("name");
    expect(props).toContain("hook");
    expect(props).toContain("narrative");
    expect(props).toContain("heritage_note");
    expect(props).toContain("hidden_gem_score");
    expect(props).toContain("nearby_experience");
  });

  it("uses no keywords that strict-mode json_schema forbids", () => {
    expect(() => assertNoBannedKeywords(JOURNEY_SCHEMA, "JOURNEY_SCHEMA")).not.toThrow();
  });
});

describe("DEEPEN_SCHEMA", () => {
  it("is strict-compatible and requires both deep_* fields", () => {
    expect(DEEPEN_SCHEMA.type).toBe("object");
    expect(DEEPEN_SCHEMA.additionalProperties).toBe(false);
    expect(DEEPEN_SCHEMA.required).toEqual(["deep_narrative", "deep_heritage"]);
  });

  it("uses no banned keywords", () => {
    expect(() => assertNoBannedKeywords(DEEPEN_SCHEMA, "DEEPEN_SCHEMA")).not.toThrow();
  });
});
