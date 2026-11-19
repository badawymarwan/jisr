"use client";
// word bank: every word the student tapped, with a quick review game.

import { useMemo, useState } from "react";
import { getWords, isLearned, removeFromBank, setKnown, useStore } from "@/lib/store";
import type { WordEntry } from "@/lib/types";

export default function WordsPage() {
  const words = useStore(getWords, {});
  const bank = useMemo(() => Object.values(words).filter((w) => w.inBank).sort((a, b) => b.addedAt - a.addedAt), [words]);
  const learned = bank.filter(isLearned).length;
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const thisWeek = bank.filter((w) => w.addedAt > weekAgo).length;
  const [reviewing, setReviewing] = useState(false);

  if (reviewing) return <Review words={bank.filter((w) => !isLearned(w))} onDone={() => setReviewing(false)} />;

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Word bank</h1>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {[
          [bank.length, "words saved"],
          [learned, "learned"],
          [thisWeek, "this week"],
        ].map(([n, label]) => (
          <div key={label} className="card text-center">
            <p className="text-3xl font-bold text-navy-800">{n}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {bank.length > 0 && (
        <button className="btn mt-5 w-full sm:w-auto" onClick={() => setReviewing(true)} disabled={bank.length === learned}>
          Review words
        </button>
      )}

      <div className="mt-6 space-y-3">
        {bank.length === 0 && <div className="card text-slate-600">Tap highlighted words in your notes and they&apos;ll be saved here.</div>}
        {bank.map((w) => (
          <WordRow key={w.term} w={w} />
        ))}
      </div>
    </div>
  );
}

function WordRow({ w }: { w: WordEntry }) {
  const learned = isLearned(w);
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-semibold">{w.term}</p>
          <p className="text-slate-600">{w.meaning}</p>
          {!learned && w.arabic && (
            <p dir="rtl" className="mt-1 font-arabic text-amber-800">
              {w.arabic}
            </p>
          )}
          <p className="mt-2 text-xs text-slate-400">
            {w.course} · {learned ? "Learned: Arabic hidden" : "Arabic shown"}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <button
            onClick={() => setKnown(w.term, !w.known)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${w.known ? "bg-green-100 text-green-800" : "bg-navy-50 text-navy-800"}`}
          >
            {w.known ? "Known ✓" : "I know this"}
          </button>
          <button onClick={() => removeFromBank(w.term)} className="text-xs text-slate-400 hover:text-red-600">
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

/** quick review: see the word, think of the meaning, reveal, say if you knew it. */
function Review({ words, onDone }: { words: WordEntry[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const w = words[i];

  if (!w)
    return (
      <div className="card text-center">
        <p className="text-xl font-semibold">Review done!</p>
        <button className="btn mt-4" onClick={onDone}>
          Back to word bank
        </button>
      </div>
    );

  const next = (knew: boolean) => {
    if (knew) setKnown(w.term, true);
    setShown(false);
    setI(i + 1);
  };

  return (
    <div>
      <button onClick={onDone} className="text-sm text-slate-500">
        ← Word bank
      </button>
      <div className="card mt-4 flex min-h-[260px] flex-col items-center justify-center text-center">
        <p className="text-sm text-slate-400">
          {i + 1} of {words.length}
        </p>
        <p className="mt-2 text-3xl font-bold">{w.term}</p>
        {shown ? (
          <>
            <p className="mt-4 text-lg">{w.meaning}</p>
            {w.arabic && (
              <p dir="rtl" className="mt-2 font-arabic text-amber-800">
                {w.arabic}
              </p>
            )}
          </>
        ) : (
          <button className="btn-ghost mt-6" onClick={() => setShown(true)}>
            Show meaning
          </button>
        )}
      </div>
      {shown && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button className="btn-ghost" onClick={() => next(false)}>
            Still learning
          </button>
          <button className="btn" onClick={() => next(true)}>
            I knew it
          </button>
        </div>
      )}
    </div>
  );
}
