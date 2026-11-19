"use client";
// live mode: notes build while the professor talks. every 20 seconds a piece
// of audio goes to speech-to-text, then the ai adds 1-3 new bullet points.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TermText from "@/components/TermText";
import { post, SegmentRecorder, transcribeBlob } from "@/lib/client";
import { getCourses, markSeen, newId, saveItem } from "@/lib/store";
import type { Item, Term } from "@/lib/types";

const SEGMENT_MS = 20_000;
const DEMO_STEP_MS = 4_000;

export default function LivePage() {
  const router = useRouter();
  const [course, setCourse] = useState("");
  const [courses, setCourses] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const [points, setPoints] = useState<string[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [present, setPresent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);

  const recRef = useRef<SegmentRecorder | null>(null);
  const demoTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcript = useRef<string[]>([]);
  const pointsRef = useRef<string[]>([]);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const step = useRef(0);

  useEffect(() => {
    setCourses(getCourses());
    fetch("/api/status")
      .then((r) => r.json())
      .then((s: { demoAI: boolean; demoSpeech: boolean }) => setDemo(s.demoAI || s.demoSpeech))
      .catch(() => {});
    return () => {
      recRef.current?.stop();
      if (demoTimer.current) clearInterval(demoTimer.current);
    };
  }, []);

  /** adds new points and terms from one piece of speech. */
  async function addPiece(chunk: string) {
    const res = await post<{ points: string[]; terms: Term[] }>("/api/live", {
      chunk,
      notesSoFar: pointsRef.current,
      step: step.current++,
    });
    pointsRef.current = [...pointsRef.current, ...res.points];
    setPoints(pointsRef.current);
    setTerms((old) => {
      const seen = new Set(old.map((t) => t.term.toLowerCase()));
      return [...old, ...res.terms.filter((t) => !seen.has(t.term.toLowerCase()))];
    });
  }

  async function start() {
    setError(null);
    setPoints([]);
    setTerms([]);
    pointsRef.current = [];
    transcript.current = [];
    step.current = 0;

    if (demo) {
      // no keys yet: play the sample lecture line by line.
      setListening(true);
      addPiece("");
      demoTimer.current = setInterval(() => addPiece("").catch(() => {}), DEMO_STEP_MS);
      return;
    }

    const rec = new SegmentRecorder(SEGMENT_MS, (blob) => {
      // process pieces in order so the notes stay in order.
      queue.current = queue.current.then(async () => {
        try {
          const text = await transcribeBlob(blob, { live: true });
          if (!text.trim()) return;
          transcript.current.push(text);
          await addPiece(text);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Lost a piece of audio");
        }
      });
    });
    try {
      await rec.start();
      recRef.current = rec;
      setListening(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't use the microphone");
    }
  }

  async function stop() {
    recRef.current?.stop();
    if (demoTimer.current) clearInterval(demoTimer.current);
    setListening(false);
    await queue.current;
  }

  /** saves the live notes as a normal lecture in the library. */
  function save() {
    const name = course.trim() || "My course";
    const item: Item = {
      id: newId(),
      type: "lecture",
      course: name,
      title: `Live lecture · ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
      createdAt: Date.now(),
      source: transcript.current.join(" ") || pointsRef.current.join("\n"),
      notes: { title: "Live notes", summary: "Notes taken live during the lecture.", sections: [{ heading: "Live notes", points: pointsRef.current }], terms },
    };
    saveItem(item);
    markSeen(terms, name);
    router.push(`/item/${item.id}`);
  }

  const notesList = (
    <ul className={present ? "space-y-6" : "space-y-3"}>
      {points.map((p, i) => (
        <li key={i} className={`flex gap-3 ${present ? "text-3xl leading-snug md:text-4xl" : "text-[17px] leading-relaxed"} animate-[fadein_.5s_ease]`}>
          <span className={`${present ? "mt-4 h-3 w-3" : "mt-2.5 h-1.5 w-1.5"} shrink-0 rounded-full bg-amber-400`} />
          <span>
            <TermText text={p} terms={terms} course={course.trim() || "My course"} />
          </span>
        </li>
      ))}
      {listening && <li className={`animate-pulse text-slate-400 ${present ? "text-2xl" : "text-sm"}`}>Listening...</li>}
    </ul>
  );

  if (present)
    return (
      <div className="fixed inset-0 z-50 overflow-auto bg-white p-8 md:p-16">
        <div className="mb-10 flex items-center justify-between">
          <p className="text-xl font-semibold text-navy-800">Jisr · Live</p>
          <button className="btn-ghost" onClick={() => setPresent(false)}>
            Exit present
          </button>
        </div>
        {notesList}
      </div>
    );

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Live mode</h1>
      <p className="mt-1 text-slate-600">Notes appear while the professor talks. Tap highlighted words for Arabic help.</p>

      <input className="input mt-5" list="live-courses" placeholder="Course (e.g. ECON 101)" value={course} onChange={(e) => setCourse(e.target.value)} />
      <datalist id="live-courses">
        {courses.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <div className="card mt-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={listening ? stop : start}
            className={`flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg ${listening ? "animate-pulse bg-red-600" : "bg-navy-700"}`}
            aria-label={listening ? "Stop" : "Start listening"}
          >
            {listening ? <span className="h-6 w-6 rounded bg-white" /> : <span className="text-2xl">🎙️</span>}
          </button>
          <div>
            <p className="font-semibold">{listening ? "Listening..." : "Start listening"}</p>
            <p className="text-sm text-slate-500">{demo ? "Demo: plays a sample lecture" : "New notes about every 20 seconds"}</p>
          </div>
        </div>
        <button className="btn-ghost" onClick={() => setPresent(true)} disabled={!points.length && !listening}>
          Present
        </button>
      </div>

      {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {(points.length > 0 || listening) && <div className="card mt-5">{notesList}</div>}

      {!listening && points.length > 0 && (
        <button className="btn mt-5" onClick={save}>
          Save to my library
        </button>
      )}
    </div>
  );
}
