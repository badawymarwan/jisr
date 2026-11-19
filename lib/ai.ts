// server-only helpers for calling the ai and speech-to-text.
// keys live in environment variables and never reach the browser.
//
// ai brain (notes, quiz, ask, assignment helper, live notes):
//   GEMINI_API_KEY    -> google gemini (free tier)   [default]
//   ANTHROPIC_API_KEY -> claude (paid), used if AI_PROVIDER=anthropic or no gemini key
// speech-to-text:
//   GROQ_API_KEY      -> groq whisper (free tier)    [default]
//   OPENAI_API_KEY    -> openai whisper (paid), used if no groq key
// with no keys set, the app runs in demo mode and returns sample content.

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

// models tried in order: if one is busy (503), rate limited (429) or too slow, the next one is used.
// set GEMINI_MODEL to override, e.g. GEMINI_MODEL=gemini-3.5-flash-lite,gemini-flash-lite-latest
const GEMINI_MODELS = (process.env.GEMINI_MODEL || "gemini-3.5-flash-lite,gemini-flash-lite-latest,gemini-3.1-flash-lite,gemini-2.5-flash-lite")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
const GROQ_STT_MODEL = process.env.GROQ_STT_MODEL || "whisper-large-v3-turbo";

// optional overrides (only needed for testing against a fake server)
const GEMINI_BASE = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com";
const GROQ_BASE = process.env.GROQ_BASE_URL || "https://api.groq.com/openai";

/** which ai service answers. */
export const aiProvider: "gemini" | "anthropic" | "demo" =
  process.env.AI_PROVIDER === "anthropic" && ANTHROPIC_KEY
    ? "anthropic"
    : GEMINI_KEY
      ? "gemini"
      : ANTHROPIC_KEY
        ? "anthropic"
        : "demo";

/** which speech-to-text service is used. */
export const sttProvider: "groq" | "openai" | "demo" = GROQ_KEY ? "groq" : OPENAI_KEY ? "openai" : "demo";

export const demoAI = aiProvider === "demo";
export const demoSpeech = sttProvider === "demo";

const TIMEOUT_MS = 15_000; // per model, so fallbacks still fit in the 60s limit

/** fetch with a time limit, so a stuck ai service gives a clear error instead of loading forever. */
async function fetchWithTimeout(service: string, url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (e) {
    if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError"))
      throw new Error(`${service} didn't answer within ${TIMEOUT_MS / 1000} seconds. Try again, or with shorter text.`);
    throw new Error(`Couldn't reach ${service}. Check your internet connection.`);
  }
}

export type Block =
  | { type: "text"; text: string }
  | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } };

/**
 * one call to the ai. returns the text of the reply.
 * set json: true when the prompt asks for json (gemini then guarantees json output).
 */
export async function generate(
  system: string,
  content: string | Block[],
  maxTokens = 4000,
  opts: { json?: boolean } = {}
): Promise<string> {
  return aiProvider === "anthropic" ? callClaude(system, content, maxTokens) : callGemini(system, content, maxTokens, !!opts.json);
}

/** tries each gemini model in turn until one answers. */
async function callGemini(system: string, content: string | Block[], maxTokens: number, json: boolean): Promise<string> {
  let lastError: unknown;
  for (const model of GEMINI_MODELS) {
    try {
      return await callGeminiModel(model, system, content, maxTokens, json);
    } catch (e) {
      lastError = e;
      const retryable = e instanceof RetryableError;
      if (!retryable) throw e; // wrong key, blocked request etc: no point trying another model
    }
  }
  throw lastError instanceof Error ? new Error(lastError.message.replace(/^Gemini/, "Gemini (all models busy)")) : lastError;
}

/** an error where trying a different model might help (busy, rate limited, timed out). */
class RetryableError extends Error {}

async function callGeminiModel(model: string, system: string, content: string | Block[], maxTokens: number, json: boolean): Promise<string> {
  const blocks: Block[] = typeof content === "string" ? [{ type: "text", text: content }] : content;
  const parts = blocks.map((b) =>
    b.type === "text" ? { text: b.text } : { inline_data: { mime_type: b.source.media_type, data: b.source.data } }
  );
  let res: Response;
  try {
    res = await fetchWithTimeout("Gemini", `${GEMINI_BASE}/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": GEMINI_KEY ?? "" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts }],
        generationConfig: {
          // extra room because some gemini models "think" before answering
          maxOutputTokens: Math.max(maxTokens * 2, 4000),
          temperature: 0.4,
          ...(json ? { responseMimeType: "application/json" } : {}),
        },
      }),
    });
  } catch (e) {
    throw new RetryableError(e instanceof Error ? e.message : "Gemini didn't answer");
  }
  if (!res.ok) {
    const msg = friendly("Gemini", res.status, await res.text());
    if ([404, 429, 500, 503, 504].includes(res.status)) throw new RetryableError(msg);
    throw new Error(msg);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
    promptFeedback?: { blockReason?: string };
  };
  if (data.promptFeedback?.blockReason) throw new Error(`Gemini blocked this request (${data.promptFeedback.blockReason})`);
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .filter((p) => !p.thought)
    .map((p) => p.text ?? "")
    .join("");
  if (!text.trim()) throw new RetryableError("Gemini returned an empty answer. Try again.");
  return text;
}

async function callClaude(system: string, content: string | Block[], maxTokens: number): Promise<string> {
  const res = await fetchWithTimeout("Claude", "https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content }],
    }),
  });
  if (!res.ok) throw new Error(friendly("Claude", res.status, await res.text()));
  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  return data.content.map((c) => c.text ?? "").join("");
}

/** claude/gemini are told to reply with json only; this pulls the json out safely. */
export function parseJSON<T>(text: string): T {
  const cleaned = text.replace(/```json|```/g, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("The AI reply had no JSON in it. Try again.");
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

/** speech-to-text with whisper (groq free tier, or openai). */
export async function transcribe(file: Blob, filename: string): Promise<string> {
  const form = new FormData();
  form.append("file", file, filename);
  form.append("language", "en");
  const groq = sttProvider === "groq";
  form.append("model", groq ? GROQ_STT_MODEL : "whisper-1");
  const url = groq ? `${GROQ_BASE}/v1/audio/transcriptions` : "https://api.openai.com/v1/audio/transcriptions";
  const res = await fetchWithTimeout(groq ? "Groq" : "OpenAI", url, {
    method: "POST",
    headers: { Authorization: `Bearer ${groq ? GROQ_KEY : OPENAI_KEY}` },
    body: form,
  });
  if (!res.ok) throw new Error(friendly(groq ? "Groq" : "OpenAI", res.status, await res.text()));
  const data = (await res.json()) as { text: string };
  return data.text ?? "";
}

/** turns api errors into messages a tester can understand. */
function friendly(service: string, status: number, detail: string) {
  if (status === 429) return `${service} free limit reached for now. Wait a minute and try again.`;
  if (status === 401 || status === 403) return `${service} key is missing or wrong. Check the environment variables.`;
  return `${service} error ${status}: ${detail.slice(0, 200)}`;
}

/** turns any thrown error into a json error response. */
export function errorResponse(e: unknown, status = 500) {
  const message = e instanceof Error ? e.message : "Something went wrong";
  return Response.json({ error: message }, { status });
}
