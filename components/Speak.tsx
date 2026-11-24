"use client";
// speaker button: reads a word aloud with the phone/laptop's built-in voice (free, works offline, no api).

import { useEffect, useState } from "react";

/** true once the device has a voice for this language. voices load a moment after the page opens. */
function useHasVoice(lang: string) {
  const [has, setHas] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const check = () => setHas(speechSynthesis.getVoices().some((v) => v.lang.toLowerCase().startsWith(lang)));
    check();
    speechSynthesis.addEventListener("voiceschanged", check);
    return () => speechSynthesis.removeEventListener("voiceschanged", check);
  }, [lang]);
  return has;
}

export function Speak({ text, lang = "en", label }: { text: string; lang?: "en" | "ar"; label?: string }) {
  const has = useHasVoice(lang);
  const [speaking, setSpeaking] = useState(false);
  if (!has || !text) return null; // no voice for this language on this device: hide the button

  function say(e: React.MouseEvent) {
    e.stopPropagation(); // don't trigger the card/button underneath
    speechSynthesis.cancel(); // stop anything already playing
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "ar" ? "ar-SA" : "en-US";
    u.rate = 0.85; // a bit slower than normal, easier to follow
    u.onend = u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    speechSynthesis.speak(u);
  }

  return (
    <button
      type="button"
      onClick={say}
      aria-label={label ?? `Hear "${text}"`}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
        speaking ? "bg-blue-400 text-navy-900" : "bg-navy-50 text-navy-700 hover:bg-navy-100"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 5 6 9H3v6h3l5 4V5z" />
        <path d={speaking ? "M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" : "M15.5 8.5a5 5 0 0 1 0 7"} />
      </svg>
    </button>
  );
}
