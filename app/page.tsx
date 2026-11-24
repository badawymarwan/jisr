"use client";
// home = your courses: arabic fade ring in the corner, a card per course with its word progress,
// an "add course" card, and a row for words due for review.

import Link from "next/link";
import { useMemo } from "react";
import { perWeek, WEEKS } from "@/components/ProgressCharts";
import { dueWords, getItems, getLog, getWords, isLearned, loadSampleData, removeSampleData, useStore } from "@/lib/store";
import type { Item } from "@/lib/types";

/** a ring that fills to `pct` percent, with the number in the middle */
function Ring({ pct, size = 60 }: { pct: number; size?: number }) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${pct}% less Arabic`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#dbeafe" strokeWidth="6" />
      {pct > 0 && <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#2563eb"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * c} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />}
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize="14" fontWeight="700" fill="#0d1b33">
        {pct}%
      </text>
    </svg>
  );
}

export default function Home() {
  const items = useStore(getItems, [] as Item[]);
  const words = useStore(getWords, {});
  const due = useStore(dueWords, []);
  const log = useStore(getLog, []);
  const hasSample = items.some((i) => i.id.startsWith("sample-")) || log.some((e) => e.sample);

  // arabic fade: how much less arabic this week compared with the first active week
  const arabicWeeks = useMemo(() => perWeek(log, "arabic"), [log]);
  const firstWeek = arabicWeeks.find((w) => w.value > 0)?.value ?? 0;
  const drop = firstWeek > 0 ? Math.max(0, Math.round(((firstWeek - arabicWeeks[WEEKS - 1].value) / firstWeek) * 100)) : 0;

  // one card per course: lessons, assignments, saved words and how many are learned. newest course first.
  const courses = useMemo(() => {
    const map = new Map<string, { name: string; lessons: number; assignments: number; words: number; learned: number; last: number }>();
    for (const i of items) {
      const c = map.get(i.course) ?? { name: i.course, lessons: 0, assignments: 0, words: 0, learned: 0, last: 0 };
      if (i.type === "assignment") c.assignments++;
      else c.lessons++;
      c.last = Math.max(c.last, i.createdAt);
      map.set(i.course, c);
    }
    for (const w of Object.values(words)) {
      const c = map.get(w.course);
      if (!c || !w.inBank) continue;
      c.words++;
      if (isLearned(w)) c.learned++;
    }
    return [...map.values()].sort((a, b) => b.last - a.last);
  }, [items, words]);

  const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{greeting()}</p>
          <h1 className="text-[28px]">Your courses</h1>
        </div>
        <Link href="/progress" className="flex flex-col items-center">
          <Ring pct={drop} />
          <span className="mt-0.5 text-[11px] font-semibold text-slate-500">Arabic fade</span>
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {courses.map((c, idx) => {
          const pct = c.words ? Math.round((c.learned / c.words) * 100) : 0;
          const first = idx === 0; // the most recent course is the solid blue one
          const parts = [c.lessons && plural(c.lessons, "lesson"), c.assignments && plural(c.assignments, "assignment"), plural(c.words, "word")].filter(Boolean);
          return (
            <Link
              key={c.name}
              href={`/course/${encodeURIComponent(c.name)}`}
              className={`flex h-[150px] flex-col rounded-2xl p-4 transition ${first ? "bg-blue-600 text-white hover:bg-blue-700" : "tile"}`}
            >
              <span className={`text-xs font-semibold ${first ? "text-blue-100" : "text-slate-500"}`}>Course</span>
              <span className={`mt-1 text-lg font-bold leading-tight ${first ? "" : "text-navy-900"}`}>{c.name}</span>
              <span className={`mt-auto text-xs ${first ? "text-blue-100" : "text-slate-500"}`}>{parts.join(" · ")}</span>
              <span className={`mt-2 h-1.5 overflow-hidden rounded-full ${first ? "bg-white/25" : "bg-blue-100"}`} aria-label={`${pct}% of words learned`}>
                <span className={`block h-full rounded-full ${first ? "bg-white" : "bg-blue-600"}`} style={{ width: `${Math.max(pct, 3)}%` }} />
              </span>
            </Link>
          );
        })}
        <Link
          href="/new"
          className="flex h-[150px] flex-col items-center justify-center gap-1.5 rounded-2xl border-[1.5px] border-dashed border-blue-200 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
        >
          <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {courses.length ? "Add a lesson" : "Add your first lesson"}
        </Link>
      </div>

      {due.length > 0 && (
        <Link href="/words?review=1" className="tile mt-4 flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold text-navy-900">
              {due.length} {due.length === 1 ? "word" : "words"} to review
            </span>
            <span className="block truncate text-[13px] text-slate-500">{due.map((w) => w.term).join(", ")}</span>
          </span>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>
      )}

      {items.length === 0 && (
        <button className="btn-ghost mt-4 w-full" onClick={loadSampleData}>
          Try with sample data
        </button>
      )}
      {hasSample && (
        <button className="mt-10 text-sm text-slate-400 underline" onClick={removeSampleData}>
          Remove sample data
        </button>
      )}
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
