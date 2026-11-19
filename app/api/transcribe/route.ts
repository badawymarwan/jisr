// audio in, text out (groq whisper). the browser sends audio in short
// pieces so each request stays under the hosting size limit (~4.5mb).
import { demoSpeech, errorResponse, transcribe } from "@/lib/ai";
import { MOCK_TRANSCRIPT } from "@/lib/mock";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("audio");
    if (!(file instanceof Blob)) return errorResponse(new Error("No audio received"), 400);
    if (file.size > 4_000_000) return errorResponse(new Error("Audio piece is too big (max 4MB)"), 413);
    if (demoSpeech) return Response.json({ text: form.get("demo") === "live" ? "" : MOCK_TRANSCRIPT, demo: true });
    const name = (file as File).name || "audio.webm";
    const text = await transcribe(file, name);
    return Response.json({ text });
  } catch (e) {
    return errorResponse(e);
  }
}
