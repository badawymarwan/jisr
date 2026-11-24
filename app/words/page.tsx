"use client";
// word bank: every word the student tapped, with a quick review game.

import { useEffect, useMemo, useState } from "react";
import { Speak } from "@/components/Speak";
import { dueWords, getWords, isLearned, LEARNED_STREAK, markArabicUsed, removeFromBank, reviewWord, setKnown, useStore } from "@/lib/store";
import type { WordEntry } from "@/lib/types";

export default function WordsPage() {
  const words = useStore(getWords, {});
  const bank = useMemo(() => Object.values(words).filter((w) => w.inBank).sort((a, b) => b.addedAt - a.addedAt), [words]);
  const learned = bank.filter(isLearned).length;
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const thisWeek = bank.filter((w) => w.addedAt > weekAgo).length;
  const due = useStore(dueWords, []);
  // the list is frozen when review starts, so words don't vanish mid-review. practice = nothing due, just extra practice.
  const [session, setSession] = useState<{ words: WordEntry[]; practice: boolean } | null>(null);

  // the home page's "ready to review" banner links here with ?review=1
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("review") && dueWords().length)
      setSession({ words: dueWords(), practice: false });
  }, []);

  if (session) return <Review {...session} onDone={() => setSession(null)} />;

  return (
    <div className="mx-auto max-w-3xl">
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
        due.length > 0 ? (
          <button className="btn mt-5 w-full sm:w-auto" onClick={() => setSession({ words: due, practice: false })}>
            Review {due.length} {due.length === 1 ? "word" : "words"}
          </button>
        ) : (
          bank.length > learned && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <p className="text-sm text-slate-500">Nothing due. Words come back after 1, 3 and 7 days.</p>
              <button className="btn-ghost" onClick={() => setSession({ words: bank.filter((w) => !isLearned(w)), practice: true })}>
                Practise anyway
              </button>
            </div>
          )
        )
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
          <p className="mt-2 text-xs text-slate-400">
            {w.course} · {learned ? "Learned ✓" : `Recalled ${w.streak ?? 0}/${LEARNED_STREAK}`}
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

/**
 * review: see the word, try to remember the meaning (active recall), then reveal and be honest.
 * real reviews move the word along the 1/3/7-day schedule. practice doesn't, so cramming can't fake "learned".
 */
function Review({ words, practice, onDone }: { words: WordEntry[]; practice: boolean; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [arabic, setArabic] = useState(false);
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
    if (!practice) reviewWord(w.term, knew && !arabic); // needed arabic = not really recalled
    setShown(false);
    setArabic(false);
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
        <div className="mt-2 flex items-center gap-2">
          <p className="text-3xl font-bold">{w.term}</p>
          <Speak text={w.term} />
        </div>
        {shown ? (
          <>
            <p className="mt-4 text-lg">{w.meaning}</p>
            {w.arabic &&
              (arabic ? (
                <p dir="rtl" className="mt-2 font-arabic text-blue-800">
                  {w.arabic}
                </p>
              ) : (
                <button
                  className="mt-3 text-sm text-navy-600 underline"
                  onClick={() => {
                    markArabicUsed(w.term);
                    setArabic(true);
                  }}
                >
                  Show Arabic
                </button>
              ))}
          </>
        ) : (
          <button className="btn-ghost mt-6" onClick={() => setShown(true)}>
            Think of the meaning, then tap
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
