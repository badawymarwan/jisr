"use client";
// home = your courses: arabic fade ring in the corner, a card per course with its word progress,
// an "add course" card, and a row for words due for review.

import Link from "next/link";
import { useMemo } from "react";
import { Chart, perWeek, WEEKS } from "@/components/ProgressCharts";
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
    const map = new Map<string, { name: string; lessons: number; assignments: number; words: number; learned: number; last: number; latest: string }>();
    for (const i of items) {
      const c = map.get(i.course) ?? { name: i.course, lessons: 0, assignments: 0, words: 0, learned: 0, last: 0, latest: "" };
      if (i.type === "assignment") c.assignments++;
      else c.lessons++;
      if (i.createdAt >= c.last) c.latest = i.title; // the newest lesson's title shows on the card
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

  const learnedWeeks = useMemo(() => perWeek(log, "learned"), [log]);
  const recent = [...items].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);
  const maxArabic = Math.max(1, ...arabicWeeks.map((w) => w.value));

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

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="grid content-start gap-4">
        <div className="grid content-start grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
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
              {c.latest && <span className={`mt-1.5 line-clamp-2 text-[13px] leading-snug ${first ? "text-white/90" : "text-slate-600"}`}>Latest: {c.latest}</span>}
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

        {items.length > 0 && <Chart title="Times you needed Arabic" subtitle="Going down = your English is improving" data={arabicWeeks} color="#2563eb" unit="times" />}
        </div>

        {/* side column (below on phones): review, this week, recent */}
        {items.length > 0 && (
          <aside className="grid content-start gap-3">
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-navy-900">Review</p>
                <span className="text-sm text-slate-500">{due.length} due</span>
              </div>
              {due.length > 0 ? (
                <>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {due.slice(0, 5).map((w) => (
                      <span key={w.term} className="rounded-full border border-line px-2.5 py-1 text-[13px] font-medium text-navy-900">
                        {w.term}
                      </span>
                    ))}
                    {due.length > 5 && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[13px] font-medium text-blue-700">+{due.length - 5}</span>}
                  </div>
                  <Link href="/words?review=1" className="btn mt-3 w-full">
                    Start review
                  </Link>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Nothing due. Words come back after 1, 3 and 7 days.</p>
              )}
            </div>

            <Link href="/progress" className="card block p-4 transition hover:border-blue-200">
              <p className="font-semibold text-navy-900">This week</p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div className="flex gap-5">
                  <div>
                    <p className="text-xl font-bold text-navy-900">{learnedWeeks[WEEKS - 1].value}</p>
                    <p className="text-xs text-slate-500">learned</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-navy-900">{arabicWeeks[WEEKS - 1].value}</p>
                    <p className="text-xs text-slate-500">Arabic used</p>
                  </div>
                </div>
                {/* tiny chart: times arabic was needed, last 6 weeks */}
                <div className="flex h-10 items-end gap-1" aria-label="Arabic needed, last 6 weeks">
                  {arabicWeeks.map((w, i) => (
                    <span key={i} className={`w-2.5 rounded-sm ${i === WEEKS - 1 ? "bg-blue-600" : "bg-blue-100"}`} style={{ height: `${Math.max(8, (w.value / maxArabic) * 100)}%` }} />
                  ))}
                </div>
              </div>
            </Link>

            <div className="card p-4">
              <p className="font-semibold text-navy-900">Recent</p>
              <div className="mt-1">
                {recent.map((i) => (
                  <Link key={i.id} href={`/item/${i.id}`} className="flex items-center gap-3 border-b border-line py-2.5 last:border-0">
                    <span className={`h-8 w-1 shrink-0 rounded-full ${i.type === "assignment" ? "bg-navy-900" : "bg-blue-600"}`} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-navy-900">{i.title}</span>
                      <span className="text-xs text-slate-500">{i.course}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>

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
