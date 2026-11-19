// live mode: notes so far + the newest piece of speech in -> 1-3 new bullet points out.
import { generate, demoAI, errorResponse, parseJSON } from "@/lib/ai";
import { MOCK_LIVE_LINES } from "@/lib/mock";
import * as norm from "@/lib/normalize";
import { LIVE_SYSTEM } from "@/lib/prompts";
import type { Term } from "@/lib/types";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { chunk, notesSoFar, step } = (await req.json()) as { chunk: string; notesSoFar: string[]; step?: number };
    if (demoAI) {
      const line = MOCK_LIVE_LINES[(step ?? 0) % MOCK_LIVE_LINES.length];
      return Response.json({ ...line, demo: true });
    }
    if (!chunk?.trim()) return Response.json({ points: [], terms: [] });
    const prompt = `NOTES SO FAR:\n${(notesSoFar ?? []).slice(-15).join("\n") || "(none)"}\n\nNEWEST PIECE:\n${chunk}`;
    const reply = await generate(LIVE_SYSTEM, prompt, 600, { json: true });
    const data = parseJSON<{ points: string[]; terms: Term[] }>(reply);
    return Response.json({ points: Array.isArray(data.points) ? data.points : [], terms: norm.terms(data.terms) });
  } catch (e) {
    return errorResponse(e);
  }
}
