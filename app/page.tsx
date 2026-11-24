"use client";
// home = dashboard: greeting, the arabic fade panel, three numbers, the review button,
// four shortcuts, the progress charts, then the library by course.

import Link from "next/link";
import { useMemo } from "react";
import { Chart, perWeek, WEEKS } from "@/components/ProgressCharts";
import { dueWords, getItems, getLog, getWords, isLearned, loadSampleData, removeSampleData, streakDays, useStore } from "@/lib/store";
import type { Item, ItemType } from "@/lib/types";

const TYPE_LABEL: Record<ItemType, string> = { lecture: "Lecture", reading: "Reading", assignment: "Assignment" };

// one stroke icon per shortcut, all in the brand blue
const ACTIONS = [
  { href: "/new?mode=record", label: "Record lecture", color: "#2563eb", icon: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3" },
  { href: "/new?mode=photo", label: "Snap slides", color: "#2563eb", icon: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
  { href: "/new?mode=pdf", label: "Upload PDF", color: "#2563eb", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" },
  { href: "/new?mode=assignment", label: "Assignment", color: "#2563eb", icon: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

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
      {/* greeting */}
      <h1 className="text-[28px]">{greeting()}</h1>
      <p className="mt-1 text-slate-500">Less Arabic, more English, week by week.</p>

      {/* arabic fade: the one solid-blue panel on the page */}
      <div className="mt-5 rounded-2xl bg-blue-600 p-6 text-white">
        <p className="text-sm font-medium text-blue-100">Arabic fade</p>
        {drop > 0 ? (
          <>
            <p className="mt-1 text-[44px] font-bold leading-none tracking-tight">↓ {drop}%</p>
            <p className="mt-2 text-blue-100">less Arabic needed than when you started</p>
          </>
        ) : (
          <p className="mt-1 text-lg font-semibold leading-snug">Tap hard words while you study. The Arabic fades as your English grows.</p>
        )}
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-blue-500" role="progressbar" aria-valuenow={drop} aria-valuemin={0} aria-valuemax={100} aria-label="Arabic fade">
          <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${Math.max(drop, 3)}%` }} />
        </div>
        {example && (
          <p className="mt-4 flex items-center gap-2.5 whitespace-nowrap border-t border-blue-500 pt-4 text-lg font-semibold">
            <span dir="rtl" className="font-arabic text-[17px] font-medium text-blue-200">
              {example.arabic.split("—")[0].trim()}
            </span>
            <svg aria-hidden="true" width="24" height="14" viewBox="0 0 34 14" fill="none" stroke="#bfdbfe" strokeWidth="2.5" strokeLinecap="round">
              <path d="M1 7h30M25 1l6 6-6 6" />
            </svg>
            {example.term}
            <span className="ml-auto rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">learned</span>
          </p>
        )}
      </div>

      {/* three numbers */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          [totalLearned, "words learned"],
          [learnedWeeks[WEEKS - 1].value, "this week"],
          [streak, streak === 1 ? "day active" : "days active"],
        ].map(([n, label]) => (
          <div key={label} className="card p-4">
            <p className="text-2xl font-bold text-navy-900">{n}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* one big action */}
      {due.length > 0 ? (
        <Link href="/words?review=1" className="btn mt-4 h-12 w-full">
          Review {due.length} {due.length === 1 ? "word" : "words"}
        </Link>
      ) : (
        <Link href="/new" className="btn mt-4 h-12 w-full">
          Add a lesson
        </Link>
      )}

      {/* shortcuts */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ACTIONS.map((a) => (
          <Link key={a.href} href={a.href} className="tile flex flex-col gap-2 p-4 text-[15px] font-semibold text-navy-900">
            <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={a.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={a.icon} />
            </svg>
            {a.label}
          </Link>
        ))}
      </div>

      {/* progress charts */}
      <h2 className="mb-3 mt-8 text-xl">Your progress</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Chart title="Words learned per week" data={learnedWeeks} color="#1e3a8a" unit="words" />
        <Chart title="Times you needed Arabic" subtitle="Going down = your English is improving" data={arabicWeeks} color="#2563eb" unit="times" />
      </div>

      {/* library */}
      {items.length === 0 ? (
        <div className="card mt-8 text-center">
          <p className="text-lg font-semibold text-navy-600">No lessons yet</p>
          <p className="mt-1 font-semibold text-[#64748b]">Record a lecture, snap your slides, or paste an assignment to start.</p>
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
                  <span className={`h-10 w-1.5 shrink-0 rounded-full ${i.type === "assignment" ? "bg-navy-900" : "bg-blue-600"}`} />
                  <span className="min-w-0">
                    <span className="block truncate text-[16px] font-semibold text-navy-900">{i.title}</span>
                    <span className="text-sm font-semibold text-[#64748b]">
                      {TYPE_LABEL[i.type]} · {new Date(i.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}

      <button className="mt-10 text-sm font-bold text-[#64748b] underline" onClick={hasSample ? removeSampleData : loadSampleData}>
        {hasSample ? "Remove sample data" : "Load sample data (for demos)"}
      </button>
    </div>
  );
}
