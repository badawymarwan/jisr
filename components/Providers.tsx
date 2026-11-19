"use client";
// app-wide pieces: the toast message and the word card that opens when a
// highlighted word is tapped.

import { createContext, useCallback, useContext, useState } from "react";
import { isLearned, setKnown, tapWord, useStore, getWords } from "@/lib/store";
import type { Term } from "@/lib/types";

type Ctx = {
  toast: (msg: string) => void;
  openTerm: (t: Term, course: string) => void;
};

const AppCtx = createContext<Ctx>({ toast: () => {}, openTerm: () => {} });
export const useApp = () => useContext(AppCtx);

export default function Providers({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState<{ t: Term; course: string; learned: boolean } | null>(null);
  const [showArabic, setShowArabic] = useState(false);
  const words = useStore(getWords, {});

  const toast = useCallback((m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 2200);
  }, []);

  // tapping a word = the student needed help with it, so it goes to the word bank.
  const openTerm = useCallback(
    (t: Term, course: string) => {
      const learned = isLearned(getWords()[t.term.toLowerCase()]);
      const added = tapWord(t, course);
      if (added) toast("Added to your word bank");
      setShowArabic(false);
      setOpen({ t, course, learned });
    },
    [toast]
  );

  const entry = open ? words[open.t.term.toLowerCase()] : undefined;

  return (
    <AppCtx.Provider value={{ toast, openTerm }}>
      {children}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-900/30 sm:items-center" onClick={() => setOpen(null)}>
          <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-2xl font-bold text-navy-900">{open.t.term}</h3>
              {open.learned && <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">Learned ✓</span>}
            </div>
            <p className="mt-2 text-lg text-slate-700">{open.t.meaning}</p>

            {open.t.arabic &&
              (!open.learned || showArabic ? (
                <p dir="rtl" className="mt-4 rounded-2xl bg-amber-100 p-4 font-arabic text-lg leading-relaxed text-amber-800">
                  {open.t.arabic}
                </p>
              ) : (
                <button className="mt-4 text-sm font-medium text-navy-600 underline" onClick={() => setShowArabic(true)}>
                  Show Arabic anyway
                </button>
              ))}

            <div className="mt-6 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-navy-600"
                  checked={!!entry?.known}
                  onChange={(e) => setKnown(open.t.term, e.target.checked)}
                />
                I know this word
              </label>
              <button className="rounded-full bg-navy-700 px-5 py-2 text-sm font-semibold text-white" onClick={() => setOpen(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {msg && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-navy-900 px-5 py-3 text-sm font-medium text-white shadow-lg sm:bottom-8">
          {msg}
        </div>
      )}
    </AppCtx.Provider>
  );
}
