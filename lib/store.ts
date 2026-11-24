"use client";
// everything is saved on the student's own device (localstorage).
// no accounts and no database server. every read/write is wrapped in
// try/catch because storage can be blocked (private mode, full storage).

import { useEffect, useState } from "react";
import { sampleItems, sampleWords } from "./sample";
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
 * a word counts as learned when the student recalled it correctly in review
 * 3 times in a row (spread over days), or marked it "i know this".
 */
export const LEARNED_STREAK = 3;
export function isLearned(w?: WordEntry) {
  if (!w) return false;
  return w.known || (w.streak ?? 0) >= LEARNED_STREAK;
}

const DAY = 24 * 3600 * 1000;
const GAPS = [1, 3, 7]; // days until the next review after 0, 1, 2 correct recalls

/** words waiting for review right now: saved, not learned, and their review date has come. */
export function dueWords(): WordEntry[] {
  const now = Date.now();
  return Object.values(getWords()).filter((w) => w.inBank && !isLearned(w) && (w.due ?? 0) <= now);
}

/**
 * spaced repetition. knew it: the gap grows (1, 3, 7 days). didn't: back to the start, see it tomorrow.
 * after 3 correct recalls in a row the word is learned.
 */
export function reviewWord(term: string, knew: boolean) {
  const words = getWords();
  const w = words[keyOf(term)];
  if (!w) return;
  const before = isLearned(w);
  w.streak = knew ? (w.streak ?? 0) + 1 : 0;
  w.due = Date.now() + GAPS[Math.min(w.streak, GAPS.length - 1)] * DAY;
  write(WORDS_KEY, words);
  logEvent("review", w.term); // lets the home page tick off "review words" for today
  if (!before && isLearned(w)) logEvent("learned", w.term);
}

/** the student pressed "show arabic": english alone wasn't enough, so the word starts over. */
export function markArabicUsed(term: string) {
  const words = getWords();
  const w = words[keyOf(term)];
  if (w) {
    w.arabicUses = (w.arabicUses ?? 0) + 1;
    w.streak = 0;
    write(WORDS_KEY, words);
  }
  logEvent("arabic", term);
}

/** call once when a new lesson is created: counts that these words appeared again. */
export function markSeen(terms: Term[], course: string) {
  const words = getWords();
  for (const t of terms) {
    const k = keyOf(t.term);
    const w = words[k];
    if (w) w.seenSinceTap += 1;
    else
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
  if (!wasInBank) {
    words[k].addedAt = Date.now();
    words[k].due = Date.now() + DAY; // first review tomorrow
  }
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

// tap = opened a word card. arabic = pressed "show arabic". learned = reached 3 correct recalls.
export type LogEvent = { t: number; kind: "tap" | "arabic" | "learned" | "review"; term: string; sample?: boolean };

export const getLog = (): LogEvent[] => read<LogEvent[]>(LOG_KEY, []);

function logEvent(kind: LogEvent["kind"], term: string) {
  write(LOG_KEY, [...getLog(), { t: Date.now(), kind, term }].slice(-5000)); // cap so storage never fills up
}

const WEEK = 7 * 24 * 3600 * 1000;

/** streak: how many days in a row (ending today or yesterday) the student did anything in the app. */
export function streakDays(log: LogEvent[]): number {
  const dayKey = (t: number) => new Date(t).toDateString();
  const days = new Set(log.map((e) => dayKey(e.t)));
  let n = 0;
  const d = new Date();
  if (!days.has(dayKey(d.getTime()))) d.setDate(d.getDate() - 1); // today not started yet: count up to yesterday
  while (days.has(dayKey(d.getTime()))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** fills the app with sample lessons, words and 6 weeks of progress, for demos. */
export function loadSampleData() {
  const now = Date.now();
  write(ITEMS_KEY, [...getItems().filter((i) => !i.id.startsWith("sample-")), ...sampleItems(now)].sort((a, b) => b.createdAt - a.createdAt));
  write(WORDS_KEY, { ...sampleWords(now), ...getWords() }); // the student's own words win if both exist
  addSampleHistory();
}

/** removes exactly the sample data and keeps everything the student made. */
export function removeSampleData() {
  write(ITEMS_KEY, getItems().filter((i) => !i.id.startsWith("sample-")));
  write(WORDS_KEY, Object.fromEntries(Object.entries(getWords()).filter(([, w]) => !w.sample)));
  removeSampleHistory();
}

/** fills the last 6 weeks with believable history: arabic needed going down, learned words going up. */
function addSampleHistory() {
  const now = Date.now();
  const arabic = [26, 21, 17, 12, 9, 5]; // oldest week first
  const learned = [1, 1, 2, 2, 3, 3]; // adds up to the 12 learned sample words
  const fake: LogEvent[] = [];
  arabic.forEach((n, i) => {
    const weekStart = now - (6 - i) * WEEK;
    for (let j = 0; j < n; j++) fake.push({ t: weekStart + ((j + 0.5) / n) * WEEK, kind: "arabic", term: "sample", sample: true });
    for (let j = 0; j < learned[i]; j++)
      fake.push({ t: weekStart + ((j + 0.5) / learned[i]) * WEEK, kind: "learned", term: "sample", sample: true });
  });
  write(LOG_KEY, [...getLog().filter((e) => !e.sample), ...fake].sort((a, b) => a.t - b.t));
}

function removeSampleHistory() {
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
