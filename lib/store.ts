"use client";
// everything is saved on the student's own device (localstorage).
// no accounts and no database server. every read/write is wrapped in
// try/catch because storage can be blocked (private mode, full storage).

import { useEffect, useState } from "react";
import type { Item, Term, WordEntry } from "./types";

const ITEMS_KEY = "lb.items.v1";
const WORDS_KEY = "lb.words.v1";
const LOG_KEY = "lb.log.v1";
const EVENT = "lb-store";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or blocked: the app keeps working for this session
  }
  window.dispatchEvent(new Event(EVENT));
}

export const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// ---------- items (lectures, readings, assignments) ----------

export const getItems = (): Item[] => read<Item[]>(ITEMS_KEY, []);
export const getItem = (id: string) => getItems().find((i) => i.id === id);

export function saveItem(item: Item) {
  const items = getItems().filter((i) => i.id !== item.id);
  write(ITEMS_KEY, [item, ...items]);
}

export function updateItem(id: string, patch: Partial<Item>) {
  write(
    ITEMS_KEY,
    getItems().map((i) => (i.id === id ? { ...i, ...patch } : i))
  );
}

export function deleteItem(id: string) {
  write(ITEMS_KEY, getItems().filter((i) => i.id !== id));
}

/** adds a word the student looked up to that lesson, so it stays highlighted there. */
export function addTermToItem(id: string, t: Term) {
  const item = getItem(id);
  if (!item) return;
  const has = (list: Term[]) => list.some((x) => x.term.toLowerCase() === t.term.toLowerCase());
  if (item.notes) {
    if (!has(item.notes.terms)) updateItem(id, { notes: { ...item.notes, terms: [...item.notes.terms, t] } });
  } else if (item.assignment) {
    if (!has(item.assignment.terms)) updateItem(id, { assignment: { ...item.assignment, terms: [...item.assignment.terms, t] } });
  }
}

export const getCourses = () => Array.from(new Set(getItems().map((i) => i.course))).sort();

// ---------- word bank + arabic fade ----------

export const getWords = (): Record<string, WordEntry> => read(WORDS_KEY, {});
const keyOf = (t: string) => t.trim().toLowerCase();

/**
 * arabic fade rule: a word counts as learned when the student marked it
 * "i know this", or it showed up in 2+ new lessons without them tapping it.
 */
export function isLearned(w?: WordEntry) {
  if (!w) return false;
  return w.known || (w.taps > 0 && w.seenSinceTap >= 2);
}

/** call once when a new lesson is created: counts that these words appeared again. */
export function markSeen(terms: Term[], course: string) {
  const words = getWords();
  for (const t of terms) {
    const k = keyOf(t.term);
    const w = words[k];
    if (w) {
      const before = isLearned(w);
      w.seenSinceTap += 1;
      if (!before && isLearned(w)) logEvent("learned", w.term);
    } else
      words[k] = {
        ...t,
        course,
        addedAt: Date.now(),
        inBank: false,
        taps: 0,
        seenSinceTap: 0,
        known: false,
      };
  }
  write(WORDS_KEY, words);
}

/** tapping a highlighted word saves it to the word bank. returns true if it was newly added. */
export function tapWord(t: Term, course: string): boolean {
  const words = getWords();
  const k = keyOf(t.term);
  const w = words[k];
  const wasInBank = !!w?.inBank;
  words[k] = {
    ...(w ?? { ...t, course, addedAt: Date.now(), known: false, taps: 0, seenSinceTap: 0, inBank: false }),
    inBank: true,
    taps: (w?.taps ?? 0) + 1,
    seenSinceTap: 0,
  };
  if (!wasInBank) words[k].addedAt = Date.now();
  write(WORDS_KEY, words);
  logEvent("tap", t.term);
  return !wasInBank;
}

export function setKnown(term: string, known: boolean) {
  const words = getWords();
  const w = words[keyOf(term)];
  if (!w) return;
  const before = isLearned(w);
  w.known = known;
  write(WORDS_KEY, words);
  if (!before && isLearned(w)) logEvent("learned", w.term);
}

export function removeFromBank(term: string) {
  const words = getWords();
  const w = words[keyOf(term)];
  if (!w) return;
  w.inBank = false;
  write(WORDS_KEY, words);
}

export const wordFor = (term: string) => getWords()[keyOf(term)];

// ---------- progress log (for the progress dashboard) ----------
// one line per moment: "tapped a word for arabic help" or "learned a word".
// sample: true marks fake history added by the demo button, so it can be removed.

export type LogEvent = { t: number; kind: "tap" | "learned"; term: string; sample?: boolean };

export const getLog = (): LogEvent[] => read<LogEvent[]>(LOG_KEY, []);

function logEvent(kind: LogEvent["kind"], term: string) {
  write(LOG_KEY, [...getLog(), { t: Date.now(), kind, term }].slice(-5000)); // cap so storage never fills up
}

const WEEK = 7 * 24 * 3600 * 1000;

/** fills the last 6 weeks with believable history: arabic taps going down, learned words going up. */
export function addSampleHistory() {
  const now = Date.now();
  const taps = [26, 21, 17, 12, 9, 5]; // oldest week first
  const learned = [2, 4, 6, 7, 9, 10];
  const fake: LogEvent[] = [];
  taps.forEach((n, i) => {
    const weekStart = now - (6 - i) * WEEK;
    for (let j = 0; j < n; j++) fake.push({ t: weekStart + ((j + 0.5) / n) * WEEK, kind: "tap", term: "sample", sample: true });
    for (let j = 0; j < learned[i]; j++)
      fake.push({ t: weekStart + ((j + 0.5) / learned[i]) * WEEK, kind: "learned", term: "sample", sample: true });
  });
  write(LOG_KEY, [...getLog().filter((e) => !e.sample), ...fake].sort((a, b) => a.t - b.t));
}

export function removeSampleHistory() {
  write(LOG_KEY, getLog().filter((e) => !e.sample));
}

// ---------- react hook: re-render when storage changes ----------

/** returns a value read from storage, refreshed whenever the store changes. */
export function useStore<T>(selector: () => T, fallback: T): T {
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => {
    const update = () => setValue(selector());
    update();
    window.addEventListener(EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(EVENT, update);
      window.removeEventListener("storage", update);
    };
    // selector is intentionally not a dependency: callers pass inline functions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}
