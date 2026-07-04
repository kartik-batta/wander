import OpenAI from "openai";
import { DEEPEN_SCHEMA } from "@/lib/schemas";
import { DEEPEN_SYSTEM, VIBE_PERSONAS } from "@/lib/prompts";
import { parseDeepenRequest } from "@/lib/validation";

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
    const parsed = parseDeepenRequest(rawBody);
    if (!parsed.ok) {
      return Response.json(
        { ok: false, error: parsed.error },
        { status: parsed.status }
      );
    }
    const { destination, vibe, stop } = parsed.value;

    const client = new OpenAI({ timeout: 12_000, maxRetries: 1 });

    const stopContext = JSON.stringify(
      {
        name: stop.name,
        hook: stop.hook,
        narrative: stop.narrative,
        heritage_note: stop.heritage_note,
        nearby_experience: stop.nearby_experience,
      },
      null,
      2
    );

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `${DEEPEN_SYSTEM}\n\n${VIBE_PERSONAS[vibe]}`,
        },
        {
          role: "user",
          content: `Destination: ${destination}\n\nStop:\n${stopContext}`,
        },
      ],
      max_tokens: 768,
      temperature: 0.4,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "Deepen",
          schema: DEEPEN_SCHEMA,
          strict: true,
        },
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return Response.json(
        { ok: false, error: "Empty response while deepening." },
        { status: 502 }
      );
    }

    let parsedContent: { deep_narrative: string; deep_heritage: string };
    try {
      parsedContent = JSON.parse(content);
    } catch {
      return Response.json(
        { ok: false, error: "Malformed response while deepening." },
        { status: 502 }
      );
    }

    return Response.json({ ok: true, data: parsedContent });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown deepen error.";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
