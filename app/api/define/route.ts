// one word + the sentence it's in -> simple meaning + arabic for how it's used there.
// used when a student taps a word the ai didn't highlight.
import { generate, demoAI, errorResponse, parseJSON } from "@/lib/ai";
import { MOCK_NOTES } from "@/lib/mock";
import { DEFINE_SYSTEM } from "@/lib/prompts";
import type { Term } from "@/lib/types";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { word, sentence } = (await req.json()) as { word?: string; sentence?: string };
    const w = (word ?? "").trim();
    if (!w || w.length > 60) return errorResponse(new Error("Pick a word first"), 400);

    if (demoAI) {
      const found = MOCK_NOTES.terms.find((t) => t.term.toLowerCase() === w.toLowerCase());
      return Response.json({
        term: found ?? { term: w, meaning: "(demo) a word from your lesson", arabic: "(تجريبي) كلمة من درسك" },
        demo: true,
      });
    }

    const reply = await generate(DEFINE_SYSTEM, `WORD: ${w}\nSENTENCE: ${(sentence ?? "").slice(0, 500)}`, 300, { json: true });
    // the ai sometimes names the fields differently or leaves out "term", so accept a few spellings.
    // (if it replies with a list, take the first item)
    const parsed = parseJSON<Record<string, unknown> | Record<string, unknown>[]>(reply);
    const raw = (Array.isArray(parsed) ? parsed[0] : parsed) ?? {};
    const pick = (...keys: string[]) => keys.map((k) => raw[k]).find((v) => typeof v === "string" && v.trim()) as string | undefined;
    const meaning = pick("meaning", "definition", "explanation", "simple_meaning");
    const arabic = pick("arabic", "arabic_explanation", "translation", "ar") ?? "";
    if (!meaning) throw new Error("Couldn't explain that word. Try again.");
    // keep the word exactly as the student saw it, so it highlights and caches correctly
    const term: Term = { term: w, meaning, arabic };
    return Response.json({ term });
  } catch (e) {
    return errorResponse(e);
  }
}
