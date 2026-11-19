"use client";
// renders a sentence with its hard words highlighted. tapping a highlighted word
// opens its card. every other word is tappable too: tapping it looks it up.
// words the student saved before are highlighted in every lesson (personal highlights).
// learned words (arabic fade) get a lighter style.

import { Fragment, useMemo } from "react";
import { getWords, isLearned, useStore } from "@/lib/store";
import type { Term } from "@/lib/types";
import { useApp } from "./Providers";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

type Props = { text: string; terms: Term[]; course: string; itemId?: string };

export default function TermText({ text, terms, course, itemId }: Props) {
  const { openTerm, lookupWord } = useApp();
  const words = useStore(getWords, {});

  // the lesson's hard words + every word this student saved before.
  const allTerms = useMemo(() => {
    const map = new Map<string, Term>();
    for (const t of terms) if (t.term) map.set(t.term.toLowerCase(), t);
    for (const w of Object.values(words))
      if (w.inBank && w.meaning && !map.has(w.term.toLowerCase()))
        map.set(w.term.toLowerCase(), { term: w.term, meaning: w.meaning, arabic: w.arabic });
    return Array.from(map.values());
  }, [terms, words]);

  // one regex for all terms, longest first so "heat transfer" wins over "heat".
  const { regex, byKey } = useMemo(() => {
    const list = [...allTerms].sort((a, b) => b.term.length - a.term.length);
    const byKey = new Map(list.map((t) => [t.term.toLowerCase(), t]));
    const regex = list.length ? new RegExp(`\\b(${list.map((t) => escape(t.term)).join("|")})\\b`, "gi") : null;
    return { regex, byKey };
  }, [allTerms]);

  const parts = regex ? text.split(regex) : [text];
  const onPlainWord = (w: string) => lookupWord(w, text, course, itemId);

  return (
    <>
      {parts.map((part, i) => {
        // with a capture group, split puts matched words at odd positions
        const term = regex && i % 2 === 1 ? byKey.get(part.toLowerCase()) : undefined;
        if (!term) return <PlainWords key={i} text={part} onWord={onPlainWord} />;
        const learned = isLearned(words[term.term.toLowerCase()]);
        return (
          <button
            key={i}
            type="button"
            onClick={() => openTerm(term, course)}
            className={
              learned
                ? "rounded-md border-b-2 border-dotted border-amber-400 px-0.5 font-medium text-slate-800"
                : "rounded-md bg-amber-100 px-1 font-semibold text-amber-800 hover:bg-amber-200"
            }
            title={learned ? "Learned" : "Tap for meaning"}
          >
            {part}
            {learned && <span className="ml-0.5 text-[10px] text-green-700">✓</span>}
          </button>
        );
      })}
    </>
  );
}

/** normal text where every word (3+ letters) can be tapped to look it up. */
function PlainWords({ text, onWord }: { text: string; onWord: (w: string) => void }) {
  // split keeps the words at odd positions, the spaces and punctuation at even ones
  const pieces = text.split(/([A-Za-z][A-Za-z'’-]{2,})/);
  return (
    <>
      {pieces.map((p, i) =>
        i % 2 === 1 ? (
          <span key={i} role="button" tabIndex={0} onClick={() => onWord(p)} className="cursor-pointer rounded hover:bg-slate-100">
            {p}
          </span>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        )
      )}
    </>
  );
}
