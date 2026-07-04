import OpenAI from "openai";
import type { Journey, JourneyStop } from "@/lib/types";
import { JOURNEY_SCHEMA } from "@/lib/schemas";
import { JOURNEY_SYSTEM_BASE, VIBE_PERSONAS } from "@/lib/prompts";
import { parseJourneyRequest } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { ok: false, error: "Server misconfigured: OPENAI_API_KEY missing." },
        { status: 500 }
      );
    }

    const rawBody = await req.json().catch(() => null);
    const parsed = parseJourneyRequest(rawBody);
    if (!parsed.ok) {
      return Response.json(
        { ok: false, error: parsed.error },
        { status: parsed.status }
      );
    }
    const { destination, vibe } = parsed.value;

    const client = new OpenAI({ timeout: 25_000, maxRetries: 1 });

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `${JOURNEY_SYSTEM_BASE}\n\n${VIBE_PERSONAS[vibe]}`,
        },
        { role: "user", content: `Destination: ${destination}` },
      ],
      max_tokens: 2048,
      temperature: 0.7,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "Journey",
          schema: JOURNEY_SCHEMA,
          strict: true,
        },
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return Response.json(
        { ok: false, error: "Empty response from the storyteller." },
        { status: 502 }
      );
    }

    let raw: { stops: Array<Omit<JourneyStop, "id">> };
    try {
      raw = JSON.parse(content);
    } catch {
      return Response.json(
        { ok: false, error: "Malformed response from the storyteller." },
        { status: 502 }
      );
    }

    if (!Array.isArray(raw.stops) || raw.stops.length === 0) {
      return Response.json(
        { ok: false, error: "The storyteller returned no stops." },
        { status: 502 }
      );
    }

    const stops: JourneyStop[] = raw.stops.slice(0, 6).map((s, i) => ({
      ...s,
      id: `s${i}`,
    }));

    const journey: Journey = { destination, vibe, stops };
    return Response.json({ ok: true, data: journey });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown storyteller error.";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
