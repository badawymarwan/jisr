"use client";
// home = dashboard, playful style: streak and stars on top, the arabic fade card, one big review button,
// four chunky shortcut tiles, the progress charts, then the library by course.

import Link from "next/link";
import { useMemo } from "react";
import { Chart, perWeek, WEEKS } from "@/components/ProgressCharts";
import { dueWords, getItems, getLog, getWords, isLearned, loadSampleData, removeSampleData, streakDays, useStore } from "@/lib/store";
import type { Item, ItemType } from "@/lib/types";

const TYPE_LABEL: Record<ItemType, string> = { lecture: "Lecture", reading: "Reading", assignment: "Assignment" };

// one stroke icon per shortcut, coloured navy or yellow (the only two brand colours)
const ACTIONS = [
  { href: "/new?mode=record", label: "Record lecture", color: "#1e3a6b", icon: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3" },
  { href: "/new?mode=photo", label: "Snap slides", color: "#ffb800", icon: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
  { href: "/new?mode=pdf", label: "Upload PDF", color: "#ffb800", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" },
  { href: "/new?mode=assignment", label: "Assignment", color: "#1e3a6b", icon: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" },
];

export default function Home() {
  const items = useStore(getItems, [] as Item[]);
  const due = useStore(dueWords, []);
  const log = useStore(getLog, []);
  const words = useStore(getWords, {});

  const arabicWeeks = useMemo(() => perWeek(log, "arabic"), [log]);
  const learnedWeeks = useMemo(() => perWeek(log, "learned"), [log]);
  const totalLearned = log.filter((e) => e.kind === "learned").length;
  const streak = useMemo(() => streakDays(log), [log]);
  const hasSample = items.some((i) => i.id.startsWith("sample-")) || log.some((e) => e.sample);

  // arabic fade: how much less arabic this week compared with the first active week
  const firstWeek = arabicWeeks.find((w) => w.value > 0)?.value ?? 0;
  const thisWeek = arabicWeeks[WEEKS - 1].value;
  const drop = firstWeek > 0 ? Math.max(0, Math.round(((firstWeek - thisWeek) / firstWeek) * 100)) : 0;

  // the most recently learned word, shown as "arabic → english" to explain the idea at a glance
  const example = useMemo(
    () =>
      Object.values(words)
        .filter((w) => w.inBank && isLearned(w) && w.arabic && w.term.length <= 12) // short, so it fits on one line
        .sort((a, b) => b.addedAt - a.addedAt)[0],
    [words]
  );

  const byCourse = items.reduce<Record<string, Item[]>>((acc, i) => {
    (acc[i.course] ??= []).push(i);
    return acc;
  }, {});

  return (
    <div>
      {/* top bar: logo, streak, stars (= words learned) */}
      <div className="-mx-4 -mt-6 mb-5 flex items-center justify-between border-b-2 border-line px-4 py-3 md:mx-0 md:mt-0 md:rounded-2xl md:border-2">
        <span className="flex items-center gap-2 text-lg font-black text-navy-600">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-600 text-sm text-white md:hidden">J</span>
          Jisr
        </span>
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5 text-[17px] font-black text-[#ff9600]" title="Days in a row">
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="#ff9600">
              <path d="M12 2c1 4 5 5.5 5 10.5A5 5 0 0 1 7 12.5c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-6 1-9z" />
            </svg>
            {streak}
            <span className="sr-only">day streak</span>
          </span>
          <span className="flex items-center gap-1.5 text-[17px] font-black text-sun-400" title="Words learned">
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="#ffb800">
              <path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z" />
            </svg>
            {totalLearned}
            <span className="sr-only">words learned</span>
          </span>
        </div>
      </div>

      {/* arabic fade */}
      <div className="card">
        <p className="label">Arabic fade</p>
        {drop > 0 ? (
          <p className="mt-1 text-[32px] font-black leading-tight text-navy-600">{drop}% less Arabic</p>
        ) : (
          <p className="mt-1 text-xl font-extrabold leading-snug text-navy-600">Tap hard words while you study. The Arabic fades as your English grows.</p>
        )}
        <div className="mt-3 h-4 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={drop} aria-valuemin={0} aria-valuemax={100} aria-label="Arabic fade">
          <div className="h-full rounded-full bg-sun-400 shadow-[inset_0_4px_0_rgba(255,255,255,0.35)] transition-all duration-700" style={{ width: `${Math.max(drop, 4)}%` }} />
        </div>
        {example && (
          <p className="mt-4 flex items-center gap-2.5 whitespace-nowrap text-lg font-extrabold text-navy-600">
            <span dir="rtl" className="font-arabic text-[17px] font-medium text-[#afafaf]">
              {example.arabic.split("—")[0].trim()}
            </span>
            <svg aria-hidden="true" width="26" height="14" viewBox="0 0 34 14" fill="none" stroke="#ffb800" strokeWidth="3" strokeLinecap="round">
              <path d="M1 7h30M25 1l6 6-6 6" />
            </svg>
            {example.term}
          </p>
        )}
      </div>

      {/* one big action */}
      {due.length > 0 ? (
        <Link href="/words?review=1" className="btn mt-5 h-[52px] w-full text-[17px]">
          Review {due.length} {due.length === 1 ? "word" : "words"}
        </Link>
      ) : (
        <Link href="/new" className="btn mt-5 h-[52px] w-full text-[17px]">
          Add a lesson
        </Link>
      )}

      {/* shortcuts */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ACTIONS.map((a) => (
          <Link key={a.href} href={a.href} className="tile flex flex-col gap-2 p-4 text-[15px] font-extrabold text-[#3c3c3c]">
            <svg aria-hidden="true" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={a.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d={a.icon} />
            </svg>
            {a.label}
          </Link>
        ))}
      </div>

      {/* progress charts */}
      <h2 className="mb-3 mt-8 text-xl">Your progress</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Chart title="Words learned per week" data={learnedWeeks} color="#1e3a6b" unit="words" />
        <Chart title="Times you needed Arabic" subtitle="Going down = your English is improving" data={arabicWeeks} color="#ffb800" unit="times" />
      </div>

      {/* library */}
      {items.length === 0 ? (
        <div className="card mt-8 text-center">
          <p className="text-lg font-extrabold text-navy-600">No lessons yet</p>
          <p className="mt-1 font-semibold text-[#777]">Record a lecture, snap your slides, or paste an assignment to start.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/new" className="btn">
              Add your first lesson
            </Link>
            <button className="btn-ghost" onClick={loadSampleData}>
              Try sample data
            </button>
          </div>
        </div>
      ) : (
        Object.entries(byCourse).map(([course, list]) => (
          <section key={course} className="mt-8">
            <h2 className="mb-3 text-xl">{course}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map((i) => (
                <Link key={i.id} href={`/item/${i.id}`} className="tile flex items-center gap-4 p-4">
                  <span className={`h-10 w-2.5 shrink-0 rounded-full ${i.type === "assignment" ? "bg-navy-600" : "bg-sun-400"}`} />
                  <span className="min-w-0">
                    <span className="block truncate text-[16px] font-extrabold text-[#3c3c3c]">{i.title}</span>
                    <span className="text-sm font-semibold text-[#afafaf]">
                      {TYPE_LABEL[i.type]} · {new Date(i.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}

      <button className="mt-10 text-sm font-bold text-[#afafaf] underline" onClick={hasSample ? removeSampleData : loadSampleData}>
        {hasSample ? "Remove sample data" : "Load sample data (for demos)"}
      </button>
    </div>
  );
}
