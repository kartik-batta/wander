/**
 * OpenAI structured-output JSON schemas.
 *
 * Strict-mode `json_schema` does NOT support: minItems, maxItems, minimum,
 * maximum, minLength, maxLength, pattern, format. Constraints on stop count
 * (4-6) and hidden_gem_score range (1-5) are enforced via the system prompt.
 *
 * Every object requires `additionalProperties: false` and every property must
 * appear in `required`, per OpenAI's strict-mode contract.
 */

type JsonSchema = Record<string, unknown>;

export const JOURNEY_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    stops: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          hook: { type: "string" },
          narrative: { type: "string" },
          heritage_note: { type: "string" },
          hidden_gem_score: { type: "integer" },
          nearby_experience: { type: "string" },
        },
        required: [
          "name",
          "hook",
          "narrative",
          "heritage_note",
          "hidden_gem_score",
          "nearby_experience",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["stops"],
  additionalProperties: false,
};

export const DEEPEN_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    deep_narrative: { type: "string" },
    deep_heritage: { type: "string" },
  },
  required: ["deep_narrative", "deep_heritage"],
  additionalProperties: false,
};
