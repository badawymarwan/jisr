// notes in -> quiz questions and flashcards out.
import { generate, demoAI, errorResponse, parseJSON } from "@/lib/ai";
import { MOCK_PRACTICE } from "@/lib/mock";
import * as norm from "@/lib/normalize";
import { PRACTICE_SYSTEM } from "@/lib/prompts";
import type { Notes, Practice } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { notes } = (await req.json()) as { notes: Notes };
    if (demoAI) return Response.json({ practice: MOCK_PRACTICE, demo: true });
    const reply = await generate(PRACTICE_SYSTEM, `Notes:\n${JSON.stringify(notes)}`, 4000, { json: true });
    return Response.json({ practice: norm.practice(parseJSON<Practice>(reply)) });
  } catch (e) {
    return errorResponse(e);
  }
}
