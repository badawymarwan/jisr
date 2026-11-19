"use client";
// renders a sentence with its hard words highlighted. tapping a word opens
// its card. learned words (arabic fade) get a lighter style.

import { Fragment, useMemo } from "react";
import { getWords, isLearned, useStore } from "@/lib/store";
import type { Term } from "@/lib/types";
import { useApp } from "./Providers";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default function TermText({ text, terms, course }: { text: string; terms: Term[]; course: string }) {
  const { openTerm } = useApp();
  const words = useStore(getWords, {});

  // one regex for all terms, longest first so "heat transfer" wins over "heat".
  const { regex, byKey } = useMemo(() => {
    const list = [...terms].filter((t) => t.term).sort((a, b) => b.term.length - a.term.length);
    const byKey = new Map(list.map((t) => [t.term.toLowerCase(), t]));
    const regex = list.length ? new RegExp(`\\b(${list.map((t) => escape(t.term)).join("|")})\\b`, "gi") : null;
    return { regex, byKey };
  }, [terms]);

  if (!regex) return <>{text}</>;

  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) => {
        const term = byKey.get(part.toLowerCase());
        if (!term || i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
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
