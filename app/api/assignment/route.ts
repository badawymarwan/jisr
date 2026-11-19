// assignment brief in -> plain explanation of what's being asked out (never the answer).
import { generate, demoAI, errorResponse, parseJSON } from "@/lib/ai";
import { MOCK_ASSIGNMENT } from "@/lib/mock";
import * as norm from "@/lib/normalize";
import { ASSIGNMENT_SYSTEM } from "@/lib/prompts";
import type { AssignmentHelp } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { text } = (await req.json()) as { text: string };
    if (!text?.trim()) return errorResponse(new Error("Paste the assignment first"), 400);
    if (demoAI) return Response.json({ assignment: MOCK_ASSIGNMENT, demo: true });
    const reply = await generate(ASSIGNMENT_SYSTEM, `Assignment brief:\n${text.slice(0, 40_000)}`, 3000, { json: true });
    return Response.json({ assignment: norm.assignment(parseJSON<AssignmentHelp>(reply)) });
  } catch (e) {
    return errorResponse(e);
  }
}
