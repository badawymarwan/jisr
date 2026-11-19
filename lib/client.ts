"use client";
// browser helpers: calling our api routes and recording audio in short pieces.

/** post json to one of our api routes and return the json reply (throws a readable error). */
export async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data as T;
}

/** send one piece of audio to /api/transcribe. */
export async function transcribeBlob(blob: Blob, opts: { live?: boolean } = {}): Promise<string> {
  const form = new FormData();
  const ext = blob.type.includes("mp4") ? "mp4" : blob.type.includes("mpeg") ? "mp3" : "webm";
  form.append("audio", blob, `audio.${ext}`);
  if (opts.live) form.append("demo", "live");
  const res = await fetch("/api/transcribe", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "Couldn't turn the audio into text");
  return (data as { text: string }).text;
}

/** picks an audio format the browser supports (chrome/android: webm, iphone safari: mp4). */
function pickMime(): string {
  const options = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  if (typeof MediaRecorder === "undefined") return "";
  return options.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
}

/**
 * records the microphone in separate pieces (e.g. every 20s). each piece is a
 * complete audio file, so it can be sent to speech-to-text on its own.
 */
export class SegmentRecorder {
  private stream?: MediaStream;
  private recorder?: MediaRecorder;
  private timer?: ReturnType<typeof setTimeout>;
  private running = false;

  constructor(private segmentMs: number, private onSegment: (blob: Blob) => void) {}

  async start() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("This browser can't record audio. Try Chrome or Safari.");
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.running = true;
    this.next();
  }

  private next() {
    if (!this.running || !this.stream) return;
    const mimeType = pickMime();
    const rec = new MediaRecorder(this.stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 32000 });
    const parts: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && parts.push(e.data);
    rec.onstop = () => {
      if (parts.length) this.onSegment(new Blob(parts, { type: rec.mimeType || mimeType || "audio/webm" }));
      this.next(); // start the next piece straight away
    };
    rec.start();
    this.recorder = rec;
    this.timer = setTimeout(() => rec.state === "recording" && rec.stop(), this.segmentMs);
  }

  /** stops recording; the last piece is still delivered to onsegment. */
  stop() {
    this.running = false;
    clearTimeout(this.timer);
    if (this.recorder?.state === "recording") this.recorder.stop();
    this.stream?.getTracks().forEach((t) => t.stop());
  }
}

/** reads a file as base64 (used to send pdfs). */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(new Error("Couldn't read the file"));
    r.readAsDataURL(file);
  });
}
