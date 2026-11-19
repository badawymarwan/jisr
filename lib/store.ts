"use client";
// everything is saved on the student's own device (localstorage).
// no accounts and no database server. every read/write is wrapped in
// try/catch because storage can be blocked (private mode, full storage).

import { useEffect, useState } from "react";
import type { Item, Term, WordEntry } from "./types";

const ITEMS_KEY = "lb.items.v1";
const WORDS_KEY = "lb.words.v1";
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
  if (!wasInBank) words[k].addedAt = Date.now();
  write(WORDS_KEY, words);
  return !wasInBank;
}

export function setKnown(term: string, known: boolean) {
  const words = getWords();
  const w = words[keyOf(term)];
  if (!w) return;
  w.known = known;
  write(WORDS_KEY, words);
}

export function removeFromBank(term: string) {
  const words = getWords();
  const w = words[keyOf(term)];
  if (!w) return;
  w.inBank = false;
  write(WORDS_KEY, words);
}

export const wordFor = (term: string) => getWords()[keyOf(term)];

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
