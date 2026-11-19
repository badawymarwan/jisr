"use client";
// new: record or upload a lecture, upload a pdf, paste a reading, or paste an assignment.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fileToBase64, post, SegmentRecorder, transcribeBlob } from "@/lib/client";
import { getCourses, markSeen, newId, saveItem } from "@/lib/store";
import type { AssignmentHelp, Item, Notes } from "@/lib/types";

type Mode = "record" | "audio" | "pdf" | "text" | "assignment";

const MODES: { id: Mode; label: string; hint: string; icon: string }[] = [
  { id: "record", label: "Record lecture", hint: "Use your phone's mic in class", icon: "🎙️" },
  { id: "audio", label: "Upload audio", hint: "A recording up to 4MB", icon: "🎧" },
  { id: "pdf", label: "Upload PDF or slides", hint: "Save slides as PDF first", icon: "📄" },
  { id: "text", label: "Paste a reading", hint: "Copy text from any reading", icon: "📋" },
  { id: "assignment", label: "Paste assignment", hint: "We explain it, not do it", icon: "📝" },
];

const SEGMENT_MS = 60_000; // send audio for speech-to-text every 60 seconds

export default function NewPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  const [course, setCourse] = useState("");
  const [courses, setCourses] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // recording state
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recRef = useRef<SegmentRecorder | null>(null);
  const pieces = useRef<Promise<string>[]>([]);

  useEffect(() => setCourses(getCourses()), []);
  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  const courseName = course.trim() || "My course";

  /** turns the gathered text into notes, saves the lesson and opens it. */
  async function makeNotes(source: string, type: Item["type"], pdfBase64?: string) {
    setStatus("Writing your notes...");
    const { notes } = await post<{ notes: Notes }>("/api/notes", { text: source, pdfBase64 });
    const item: Item = { id: newId(), type, course: courseName, title: notes.title, createdAt: Date.now(), source: source || "", notes };
    saveItem(item);
    markSeen(notes.terms, courseName);
    router.push(`/item/${item.id}`);
  }

  async function submit() {
    setError(null);
    try {
      if (mode === "text") {
        if (!text.trim()) throw new Error("Paste the reading first");
        await makeNotes(text, "reading");
      } else if (mode === "assignment") {
        if (!text.trim()) throw new Error("Paste the assignment first");
        setStatus("Reading the assignment...");
        const { assignment } = await post<{ assignment: AssignmentHelp }>("/api/assignment", { text });
        const item: Item = {
          id: newId(),
          type: "assignment",
          course: courseName,
          title: assignment.title,
          createdAt: Date.now(),
          source: text,
          assignment,
        };
        saveItem(item);
        markSeen(assignment.terms, courseName);
        router.push(`/item/${item.id}`);
      } else if (mode === "pdf") {
        if (!file) throw new Error("Choose a PDF first");
        if (file.size > 3_000_000) throw new Error("This PDF is over 3MB. Try a smaller one, or paste the text instead.");
        setStatus("Reading the PDF...");
        await makeNotes("", "reading", await fileToBase64(file));
      } else if (mode === "audio") {
        if (!file) throw new Error("Choose an audio file first");
        if (file.size > 4_000_000) throw new Error("This file is over 4MB. For long lectures, use Record lecture instead.");
        setStatus("Turning the audio into text...");
        const transcript = await transcribeBlob(file);
        await makeNotes(transcript, "lecture");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStatus(null);
    }
  }

  async function startRecording() {
    setError(null);
    pieces.current = [];
    setSeconds(0);
    const rec = new SegmentRecorder(SEGMENT_MS, (blob) => {
      pieces.current.push(transcribeBlob(blob).catch(() => ""));
    });
    try {
      await rec.start();
      recRef.current = rec;
      setRecording(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't use the microphone. Check the browser's permission.");
    }
  }

  async function stopRecording() {
    recRef.current?.stop();
    setRecording(false);
    try {
      setStatus("Turning the audio into text...");
      await new Promise((r) => setTimeout(r, 600)); // let the last piece arrive
      const texts = await Promise.all(pieces.current);
      const transcript = Array.from(new Set(texts.filter(Boolean))).join(" ");
      if (!transcript.trim()) throw new Error("We couldn't hear anything. Try again closer to the speaker.");
      await makeNotes(transcript, "lecture");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStatus(null);
    }
  }

  const mmss = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Add a lesson</h1>

      <div className="mt-6">
        <label className="mb-2 block text-sm font-medium text-slate-600">Course</label>
        <input
          className="input"
          list="courses"
          placeholder="e.g. ECON 101"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
        />
        <datalist id="courses">
          {courses.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMode(m.id);
              setText("");
              setFile(null);
              setError(null);
            }}
            className={`card text-left transition ${mode === m.id ? "ring-2 ring-navy-600" : "hover:-translate-y-0.5"}`}
          >
            <span className="text-2xl">{m.icon}</span>
            <span className="mt-2 block font-semibold">{m.label}</span>
            <span className="text-xs text-slate-500">{m.hint}</span>
          </button>
        ))}
      </div>

      {mode && (
        <div className="card mt-5">
          {mode === "record" && (
            <div className="flex flex-col items-center py-4 text-center">
              <button
                onClick={recording ? stopRecording : startRecording}
                disabled={!!status}
                className={`flex h-24 w-24 items-center justify-center rounded-full text-white shadow-lg transition ${
                  recording ? "animate-pulse bg-red-600" : "bg-navy-700 hover:bg-navy-800"
                }`}
                aria-label={recording ? "Stop recording" : "Start recording"}
              >
                {recording ? <span className="h-8 w-8 rounded-md bg-white" /> : <span className="text-4xl">🎙️</span>}
              </button>
              <p className="mt-4 font-semibold">{recording ? `Recording ${mmss}` : "Tap to start recording"}</p>
              <p className="mt-1 text-sm text-slate-500">
                {recording ? "Keep this page open. Tap again when the lecture ends." : "Put your phone near the speaker."}
              </p>
            </div>
          )}

          {(mode === "audio" || mode === "pdf") && (
            <input
              type="file"
              accept={mode === "audio" ? "audio/*" : "application/pdf"}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-navy-50 file:px-4 file:py-2 file:font-semibold file:text-navy-800"
            />
          )}

          {(mode === "text" || mode === "assignment") && (
            <textarea
              className="input min-h-[200px]"
              placeholder={mode === "text" ? "Paste the reading here..." : "Paste the assignment instructions here..."}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          )}

          {mode !== "record" && (
            <button className="btn mt-4 w-full sm:w-auto" onClick={submit} disabled={!!status}>
              {mode === "assignment" ? "Explain this assignment" : "Make my notes"}
            </button>
          )}

          {status && <p className="mt-4 animate-pulse text-sm font-medium text-navy-700">{status}</p>}
          {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        </div>
      )}
    </div>
  );
}
