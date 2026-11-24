// lecture transcript, reading text, a pdf, or photos of slides in -> simple english notes with arabic help out.
import { generate, demoAI, errorResponse, parseJSON } from "@/lib/ai";
import { MOCK_NOTES } from "@/lib/mock";
import * as norm from "@/lib/normalize";
import { NOTES_SYSTEM } from "@/lib/prompts";
import type { Notes } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { text, pdfBase64, images } = (await req.json()) as { text?: string; pdfBase64?: string; images?: string[] };
    if (!text?.trim() && !pdfBase64 && !images?.length) return errorResponse(new Error("Nothing to make notes from"), 400);
    if (demoAI) return Response.json({ notes: MOCK_NOTES, demo: true });

    // photos: each one becomes an image block. gemini reads the text and diagrams in them.
    const content = images?.length
      ? [
          ...images.slice(0, 8).map((data) => ({ type: "image" as const, source: { type: "base64" as const, media_type: "image/jpeg" as const, data } })),
          {
            type: "text" as const,
            text: "These are photos of lecture slides or a whiteboard, in order. Read all the text and diagrams, ignore anything that isn't lesson content, and make study notes.",
          },
        ]
      : pdfBase64
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
