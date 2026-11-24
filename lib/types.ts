// shared data shapes used by the pages and the api routes.

/** a hard word with a simple english meaning and a short arabic explanation. */
export type Term = { term: string; meaning: string; arabic: string };

export type Section = { heading: string; points: string[] };

/** what /api/notes returns for a lecture or a reading. */
export type Notes = {
  title: string;
  summary: string;
  sections: Section[];
  terms: Term[];
};

export type QuizQ = { q: string; options: string[]; answer: number; why: string };
export type Flashcard = { front: string; back: string; arabic?: string };
export type Practice = { quiz: QuizQ[]; flashcards: Flashcard[] };

/** what /api/assignment returns. it explains the task, it never answers it. */
export type AssignmentHelp = {
  title: string;
  goal: string;
  steps: string[];
  handIn: string[];
  format: string[];
  terms: Term[];
};

export type ItemType = "lecture" | "reading" | "assignment";

export type ChatMsg = { role: "user" | "assistant"; content: string; arabic?: string };

/** one saved thing in the student's library. */
export type Item = {
  id: string;
  type: ItemType;
  course: string;
  title: string;
  createdAt: number;
  source: string; // transcript, reading text or assignment brief
  notes?: Notes;
  practice?: Practice;
  assignment?: AssignmentHelp;
  chat?: ChatMsg[];
  helpful?: "up" | "down";
};

/** a word in the student's word bank (also drives arabic fade). */
export type WordEntry = {
  term: string;
  meaning: string;
  arabic: string;
  course: string;
  addedAt: number;
  inBank: boolean; // saved because the student tapped it
  taps: number; // how many times they tapped it
  seenSinceTap: number; // new lessons it appeared in since the last tap
  known: boolean; // student marked "i know this"
  streak?: number; // correct recalls in a row in review (3 = learned)
  due?: number; // when it should come back in review (spaced repetition)
  arabicUses?: number; // times they pressed "show arabic" for it
  sample?: boolean; // part of the demo sample data
};
