// makes sure ai replies have the shape the pages expect, even if a field is missing.
import type { AssignmentHelp, Notes, Practice, Term } from "./types";

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);

export const terms = (v: unknown): Term[] =>
  arr<Partial<Term>>(v)
    .filter((t) => t && t.term)
    .map((t) => ({ term: str(t.term), meaning: str(t.meaning), arabic: str(t.arabic) }));

export function notes(v: Partial<Notes>): Notes {
  return {
    title: str(v.title, "Untitled"),
    summary: str(v.summary),
    sections: arr<{ heading?: string; points?: unknown }>(v.sections).map((s) => ({
      heading: str(s.heading),
      points: arr<string>(s.points).map((p) => str(p)),
    })),
    terms: terms(v.terms),
  };
}

export function practice(v: Partial<Practice>): Practice {
  return {
    quiz: arr<Practice["quiz"][number]>(v.quiz).filter((q) => q && Array.isArray(q.options) && q.options.length >= 2),
    flashcards: arr<Practice["flashcards"][number]>(v.flashcards).filter((f) => f && f.front),
  };
}

export function assignment(v: Partial<AssignmentHelp>): AssignmentHelp {
  return {
    title: str(v.title, "Assignment"),
    goal: str(v.goal),
    steps: arr<string>(v.steps),
    handIn: arr<string>(v.handIn),
    format: arr<string>(v.format),
    terms: terms(v.terms),
  };
}
