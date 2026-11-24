"use client";
// app-wide pieces: the toast message and the word card that opens when a
// word is tapped (a highlighted word, or any other word the student looks up).

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Speak } from "./Speak";
import { post } from "@/lib/client";
import { addTermToItem, getWords, isLearned, markArabicUsed, setKnown, tapWord, useStore } from "@/lib/store";
import type { Term } from "@/lib/types";

type Ctx = {
  toast: (msg: string) => void;
  openTerm: (t: Term, course: string) => void;
  lookupWord: (word: string, sentence: string, course: string, itemId?: string) => void;
};

const AppCtx = createContext<Ctx>({ toast: () => {}, openTerm: () => {}, lookupWord: () => {} });
export const useApp = () => useContext(AppCtx);

/** what the word card is showing. t is missing while a lookup is still loading. */
type Card = { word: string; course: string; learned: boolean; t?: Term; loading?: boolean; error?: string };

export default function Providers({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState<Card | null>(null);
  const [showArabic, setShowArabic] = useState(false);
  const words = useStore(getWords, {});
  const lookupId = useRef(0); // makes sure only the latest lookup fills the card

  const toast = useCallback((m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 2200);
  }, []);

  // tapping a word = the student needed help with it, so it goes to the word bank.
  const openTerm = useCallback(
    (t: Term, course: string) => {
      lookupId.current++;
      const learned = isLearned(getWords()[t.term.toLowerCase()]);
      const added = tapWord(t, course);
      if (added) toast("Added to your word bank");
      setShowArabic(false);
      setOpen({ word: t.term, t, course, learned });
    },
    [toast]
  );

  // tapping a word the ai didn't highlight: look it up in the context of its sentence.
  const lookupWord = useCallback(
    async (word: string, sentence: string, course: string, itemId?: string) => {
      // looked up before? use the saved meaning straight away, no waiting.
      const saved = getWords()[word.toLowerCase()];
      if (saved?.meaning) {
        const t = { term: saved.term, meaning: saved.meaning, arabic: saved.arabic };
        if (itemId) addTermToItem(itemId, t);
        openTerm(t, course);
        return;
      }

      const id = ++lookupId.current;
      setShowArabic(false);
      setOpen({ word, course, learned: false, loading: true });
      try {
        const { term } = await post<{ term: Term }>("/api/define", { word, sentence });
        if (lookupId.current !== id) return; // the student tapped another word meanwhile
        if (itemId) addTermToItem(itemId, term);
        const added = tapWord(term, course);
        if (added) toast("Added to your word bank");
        setOpen({ word, t: term, course, learned: false });
      } catch (e) {
        if (lookupId.current !== id) return;
        setOpen({ word, course, learned: false, error: e instanceof Error ? e.message : "Couldn't look that up" });
      }
    },
    [openTerm, toast]
  );

  const entry = open?.t ? words[open.t.term.toLowerCase()] : undefined;

  return (
    <AppCtx.Provider value={{ toast, openTerm, lookupWord }}>
      {children}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-900/30 sm:items-center" onClick={() => setOpen(null)}>
          <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold text-navy-900">{open.t?.term ?? open.word}</h3>
                <Speak text={open.t?.term ?? open.word} />
              </div>
              {open.learned && <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">Learned ✓</span>}
            </div>

            {open.loading && <p className="mt-3 animate-pulse text-slate-500">Looking it up...</p>}
            {open.error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{open.error}</p>}

            {open.t && (
              <>
                <p className="mt-2 text-lg text-slate-700">{open.t.meaning}</p>

                {/* english first. arabic only if the student asks, and asking is what the fade chart counts. */}
                {open.t.arabic &&
                  (showArabic ? (
                    <div dir="rtl" className="mt-4 flex items-start gap-2 rounded-2xl bg-blue-50 p-4 text-blue-800">
                      <p className="flex-1 font-arabic text-lg leading-relaxed">{open.t.arabic}</p>
                      <Speak text={open.t.arabic.split("—")[0].trim()} lang="ar" label="Hear the Arabic term" />
                    </div>
                  ) : (
                    <button
                      className="mt-4 text-sm font-medium text-navy-600 underline"
                      onClick={() => {
                        if (open.t) markArabicUsed(open.t.term);
                        setShowArabic(true);
                      }}
                    >
                      Still unsure? Show Arabic
                    </button>
                  ))}
              </>
            )}

            <div className="mt-6 flex items-center justify-between">
              {open.t ? (
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-navy-600"
                    checked={!!entry?.known}
                    onChange={(e) => open.t && setKnown(open.t.term, e.target.checked)}
                  />
                  I know this word
                </label>
              ) : (
                <span />
              )}
              <button className="rounded-full bg-navy-700 px-5 py-2 text-sm font-semibold text-white" onClick={() => setOpen(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {msg && (
        <div className="fixed left-1/2 top-4 z-[60] -translate-x-1/2 whitespace-nowrap rounded-full bg-navy-900 px-5 py-3 text-sm font-medium text-white shadow-lg sm:bottom-8 sm:top-auto">
          {msg}
        </div>
      )}
    </AppCtx.Provider>
  );
}
