// lecture transcript, reading text or a pdf in -> simple english notes with arabic help out.
import { generate, demoAI, errorResponse, parseJSON } from "@/lib/ai";
import { MOCK_NOTES } from "@/lib/mock";
import * as norm from "@/lib/normalize";
import { NOTES_SYSTEM } from "@/lib/prompts";
import type { Notes } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { text, pdfBase64 } = (await req.json()) as { text?: string; pdfBase64?: string };
    if (!text?.trim() && !pdfBase64) return errorResponse(new Error("Nothing to make notes from"), 400);
    if (demoAI) return Response.json({ notes: MOCK_NOTES, demo: true });

    const content = pdfBase64
      ? [
          { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: pdfBase64 } },
          { type: "text" as const, text: "Make study notes from this reading." },
        ]
      : `Make study notes from this material:\n\n${text!.slice(0, 120_000)}`;

    const reply = await generate(NOTES_SYSTEM, content, 4000, { json: true });
    return Response.json({ notes: norm.notes(parseJSON<Notes>(reply)) });
  } catch (e) {
    return errorResponse(e);
  }
}
