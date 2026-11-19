"use client";
// one lesson: notes | quiz | flashcards | ask. assignments get the assignment helper view.

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import TermText from "@/components/TermText";
import { useApp } from "@/components/Providers";
import { post } from "@/lib/client";
import { deleteItem, getItem, updateItem, useStore } from "@/lib/store";
import type { ChatMsg, Item, Practice, Term } from "@/lib/types";

type Tab = "notes" | "quiz" | "cards" | "ask";

export default function ItemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const item = useStore(() => getItem(id), undefined as Item | undefined);
  const [tab, setTab] = useState<Tab>("notes");

  if (!item)
    return (
      <div className="card text-center">
        <p>This lesson isn&apos;t on this device.</p>
        <Link href="/" className="btn mt-4">
          Back home
        </Link>
      </div>
    );

  function remove() {
    if (!item) return;
    deleteItem(item.id);
    router.push("/");
  }

  return (
    <div>
      <Link href="/" className="text-sm text-slate-500">
        ← {item.course}
      </Link>
      <div className="mt-2 flex items-start justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{item.title}</h1>
        <button onClick={remove} className="shrink-0 text-sm text-slate-400 hover:text-red-600">
          Delete
        </button>
      </div>

      {item.type === "assignment" && item.assignment ? (
        <AssignmentView item={item} />
      ) : (
        <>
          <div className="mt-5 flex gap-1 rounded-full bg-white p-1 shadow-sm">
            {(
              [
                ["notes", "Notes"],
                ["quiz", "Quiz"],
                ["cards", "Flashcards"],
                ["ask", "Ask"],
              ] as [Tab, string][]
            ).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${tab === t ? "bg-navy-700 text-white" : "text-slate-600"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5">
            {tab === "notes" && <NotesView item={item} />}
            {(tab === "quiz" || tab === "cards") && <PracticeView item={item} tab={tab} />}
            {tab === "ask" && <AskView item={item} />}
          </div>
        </>
      )}
    </div>
  );
}

// ---------- notes ----------

function NotesView({ item }: { item: Item }) {
  const n = item.notes!;
  return (
    <div className="space-y-4">
      <div className="card">
        <p className="text-[17px] leading-relaxed text-slate-700">
          <TermText text={n.summary} terms={n.terms} course={item.course} />
        </p>
        <p className="mt-3 text-xs text-slate-400">Tap a highlighted word for its meaning and Arabic help.</p>
      </div>
      {n.sections.map((s, i) => (
        <div key={i} className="card">
          <h2 className="text-lg font-semibold">{s.heading}</h2>
          <ul className="mt-2 space-y-2">
            {s.points.map((p, j) => (
              <li key={j} className="flex gap-3 text-[16px] leading-relaxed">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                <span>
                  <TermText text={p} terms={n.terms} course={item.course} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <Helpful item={item} />
    </div>
  );
}

function Helpful({ item }: { item: Item }) {
  const { toast } = useApp();
  const pick = (v: "up" | "down") => {
    updateItem(item.id, { helpful: v });
    toast("Thanks for the feedback!");
  };
  return (
    <div className="flex items-center justify-center gap-3 py-2 text-sm text-slate-500">
      Was this helpful?
      {(["up", "down"] as const).map((v) => (
        <button
          key={v}
          onClick={() => pick(v)}
          className={`rounded-full px-3 py-1 text-lg ${item.helpful === v ? "bg-navy-50" : "hover:bg-white"}`}
          aria-label={v === "up" ? "Yes" : "No"}
        >
          {v === "up" ? "👍" : "👎"}
        </button>
      ))}
    </div>
  );
}

// ---------- quiz + flashcards ----------

function PracticeView({ item, tab }: { item: Item; tab: "quiz" | "cards" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function make() {
    setLoading(true);
    setError(null);
    try {
      const { practice } = await post<{ practice: Practice }>("/api/practice", { notes: item.notes });
      updateItem(item.id, { practice });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't make practice");
    }
    setLoading(false);
  }

  if (!item.practice)
    return (
      <div className="card text-center">
        <p className="font-semibold">Practise this lesson</p>
        <p className="mt-1 text-sm text-slate-500">We&apos;ll make quiz questions and flashcards from your notes.</p>
        <button className="btn mt-4" onClick={make} disabled={loading}>
          {loading ? "Making your practice..." : "Make quiz and flashcards"}
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    );

  return tab === "quiz" ? <Quiz practice={item.practice} /> : <Cards practice={item.practice} />;
}

function Quiz({ practice }: { practice: Practice }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const q = practice.quiz[i];

  if (!q)
    return (
      <div className="card text-center">
        <p className="text-4xl font-bold">
          {score}/{practice.quiz.length}
        </p>
        <p className="mt-1 text-slate-600">{score === practice.quiz.length ? "Perfect!" : "Nice work. Try again to beat your score."}</p>
        <button
          className="btn mt-4"
          onClick={() => {
            setI(0);
            setScore(0);
            setPicked(null);
          }}
        >
          Try again
        </button>
      </div>
    );

  return (
    <div className="card">
      <p className="text-sm text-slate-500">
        Question {i + 1} of {practice.quiz.length}
      </p>
      <p className="mt-2 text-lg font-semibold">{q.q}</p>
      <div className="mt-4 space-y-2">
        {q.options.map((o, k) => {
          const state = picked === null ? "" : k === q.answer ? "border-green-500 bg-green-50" : k === picked ? "border-red-400 bg-red-50" : "opacity-60";
          return (
            <button
              key={k}
              disabled={picked !== null}
              onClick={() => {
                setPicked(k);
                if (k === q.answer) setScore((s) => s + 1);
              }}
              className={`w-full rounded-2xl border border-slate-200 px-4 py-3 text-left transition ${state}`}
            >
              {o}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <>
          <p className="mt-4 text-sm text-slate-700">
            <span className="font-semibold">{picked === q.answer ? "Correct. " : "Not quite. "}</span>
            {q.why}
          </p>
          <button
            className="btn mt-4"
            onClick={() => {
              setI(i + 1);
              setPicked(null);
            }}
          >
            {i + 1 < practice.quiz.length ? "Next question" : "See score"}
          </button>
        </>
      )}
    </div>
  );
}

function Cards({ practice }: { practice: Practice }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const c = practice.flashcards[i];
  if (!c) return null;
  const go = (d: number) => {
    setFlipped(false);
    setI((i + d + practice.flashcards.length) % practice.flashcards.length);
  };
  return (
    <div>
      <button onClick={() => setFlipped(!flipped)} className="card flex min-h-[220px] w-full flex-col items-center justify-center text-center">
        {!flipped ? (
          <p className="text-2xl font-bold">{c.front}</p>
        ) : (
          <>
            <p className="text-lg">{c.back}</p>
            {c.arabic && (
              <p dir="rtl" className="mt-3 font-arabic text-lg text-amber-800">
                {c.arabic}
              </p>
            )}
          </>
        )}
        <span className="mt-4 text-xs text-slate-400">{flipped ? "Tap to see the word" : "Tap to flip"}</span>
      </button>
      <div className="mt-4 flex items-center justify-between">
        <button className="btn-ghost" onClick={() => go(-1)}>
          ← Back
        </button>
        <span className="text-sm text-slate-500">
          {i + 1} / {practice.flashcards.length}
        </span>
        <button className="btn-ghost" onClick={() => go(1)}>
          Next →
        </button>
      </div>
    </div>
  );
}

// ---------- ask ----------

function AskView({ item }: { item: Item }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chat = item.chat ?? [];
  const terms: Term[] = item.notes?.terms ?? [];
  const material = item.source || JSON.stringify(item.notes);

  async function ask() {
    if (!q.trim()) return;
    const question = q.trim();
    const next: ChatMsg[] = [...chat, { role: "user", content: question }];
    updateItem(item.id, { chat: next });
    setQ("");
    setBusy(true);
    setError(null);
    try {
      const { answer } = await post<{ answer: string }>("/api/ask", { question, material, history: chat });
      updateItem(item.id, { chat: [...next, { role: "assistant", content: answer }] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't answer that");
    }
    setBusy(false);
  }

  async function arabicFor(index: number) {
    const msg = chat[index];
    try {
      const { arabic } = await post<{ arabic: string }>("/api/ask", { mode: "arabic", answer: msg.content, material: "" });
      const updated = chat.map((m, k) => (k === index ? { ...m, arabic } : m));
      updateItem(item.id, { chat: updated });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't explain in Arabic");
    }
  }

  return (
    <div>
      <div className="space-y-3">
        {chat.length === 0 && (
          <div className="card text-sm text-slate-600">
            Ask anything about this lesson, in English, Arabic or a mix. Answers come in simple English, only from your material.
          </div>
        )}
        {chat.map((m, k) =>
          m.role === "user" ? (
            <div key={k} className="ml-auto max-w-[85%] rounded-3xl rounded-br-md bg-navy-700 px-4 py-3 text-white" dir="auto">
              {m.content}
            </div>
          ) : (
            <div key={k} className="card max-w-[92%] !rounded-bl-md">
              <p className="leading-relaxed">
                <TermText text={m.content} terms={terms} course={item.course} />
              </p>
              {m.arabic ? (
                <p dir="rtl" className="mt-3 rounded-2xl bg-amber-100 p-3 font-arabic leading-relaxed text-amber-800">
                  {m.arabic}
                </p>
              ) : (
                <button className="mt-3 text-sm font-medium text-navy-600 underline" onClick={() => arabicFor(k)}>
                  Explain in Arabic
                </button>
              )}
            </div>
          )
        )}
        {busy && <p className="animate-pulse text-sm text-slate-500">Thinking...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="mt-5">
        <div className="flex gap-2 rounded-full bg-white p-1.5 shadow-lg">
          <input
            className="flex-1 bg-transparent px-4 text-[15px] outline-none"
            placeholder="Ask about this lesson..."
            dir="auto"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
          />
          <button className="btn" onClick={ask} disabled={busy || !q.trim()}>
            Ask
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-slate-400">Answers come only from your material.</p>
      </div>
    </div>
  );
}

// ---------- assignment helper ----------

function AssignmentView({ item }: { item: Item }) {
  const a = item.assignment!;
  const List = ({ title, items, ordered }: { title: string; items: string[]; ordered?: boolean }) =>
    items.length ? (
      <div className="card">
        <h2 className="text-lg font-semibold">{title}</h2>
        <ol className={`mt-2 space-y-2 ${ordered ? "list-decimal pl-5" : ""}`}>
          {items.map((s, i) => (
            <li key={i} className={ordered ? "pl-1" : "flex gap-3"}>
              {!ordered && <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />}
              <span>
                <TermText text={s} terms={a.terms} course={item.course} />
              </span>
            </li>
          ))}
        </ol>
      </div>
    ) : null;

  return (
    <div className="mt-5 space-y-4">
      <div className="rounded-3xl bg-navy-700 p-5 text-white">
        <p className="text-sm text-navy-100">What you need to do</p>
        <p className="mt-1 text-lg font-medium">{a.goal}</p>
      </div>
      <List title="Steps" items={a.steps} ordered />
      <List title="What to hand in" items={a.handIn} />
      <List title="Format rules" items={a.format} />
      {a.terms.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold">Key words</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {a.terms.map((t) => (
              <TermText key={t.term} text={t.term} terms={[t]} course={item.course} />
            ))}
          </div>
        </div>
      )}
      <p className="text-center text-sm text-slate-500">Jisr explains the task. It doesn&apos;t do it for you.</p>
    </div>
  );
}
