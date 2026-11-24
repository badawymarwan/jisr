"use client";
// home = "today's plan": a blue header with the three key numbers, then a checklist of what to do today
// (like a tutor telling you what's next), shortcuts to add a lesson, the progress charts, and your courses.

import Link from "next/link";
import { useMemo } from "react";
import { Icon, ICONS } from "@/components/Icon";
import { Chart, perWeek, WEEKS } from "@/components/ProgressCharts";
import { dueWords, getItems, getLog, loadSampleData, removeSampleData, useStore } from "@/lib/store";
import type { Item, ItemType } from "@/lib/types";

const TYPE_LABEL: Record<ItemType, string> = { lecture: "Lecture", reading: "Reading", assignment: "Assignment" };
const DAY = 24 * 3600 * 1000;

const ADD = [
  { href: "/new?mode=record", label: "Record", icon: ICONS.mic },
  { href: "/new?mode=photo", label: "Snap", icon: ICONS.camera },
  { href: "/new?mode=pdf", label: "PDF", icon: ICONS.pdf },
  { href: "/new?mode=assignment", label: "Task", icon: ICONS.task },
];

/** one line of today's checklist */
type Task = { key: string; title: string; sub: string; done: boolean; href: string; action?: string };

const isToday = (t: number) => new Date(t).toDateString() === new Date().toDateString();

export default function Home() {
  const items = useStore(getItems, [] as Item[]);
  const due = useStore(dueWords, []);
  const log = useStore(getLog, []);

  const arabicWeeks = useMemo(() => perWeek(log, "arabic"), [log]);
  const learnedWeeks = useMemo(() => perWeek(log, "learned"), [log]);
  const totalLearned = log.filter((e) => e.kind === "learned").length;
  const hasSample = items.some((i) => i.id.startsWith("sample-")) || log.some((e) => e.sample);

  // arabic fade: how much less arabic this week compared with the first active week
  const firstWeek = arabicWeeks.find((w) => w.value > 0)?.value ?? 0;
  const thisWeek = arabicWeeks[WEEKS - 1].value;
  const drop = firstWeek > 0 ? Math.max(0, Math.round(((firstWeek - thisWeek) / firstWeek) * 100)) : 0;

  // today's checklist, built from what the student has: lessons added today (done),
  // words due for review (to do, or done if reviewed today), and recent assignments (to do).
  const tasks = useMemo(() => {
    const list: Task[] = [];
    items
      .filter((i) => i.type !== "assignment" && isToday(i.createdAt))
      .forEach((i) => list.push({ key: i.id, title: `Notes: ${i.title}`, sub: `${i.course} · done`, done: true, href: `/item/${i.id}` }));
    if (due.length > 0) {
      const names = due.slice(0, 2).map((w) => w.term).join(", ") + (due.length > 2 ? `, +${due.length - 2}` : "");
      list.push({ key: "review", title: `Review ${due.length} ${due.length === 1 ? "word" : "words"}`, sub: names, done: false, href: "/words?review=1", action: "Start" });
    } else if (log.some((e) => e.kind === "review" && isToday(e.t))) {
      list.push({ key: "review", title: "Review words", sub: "All done for today", done: true, href: "/words" });
    }
    items
      .filter((i) => i.type === "assignment" && Date.now() - i.createdAt < 14 * DAY)
      .slice(0, 2)
      .forEach((i) => list.push({ key: i.id, title: i.title, sub: `${i.course} · assignment`, done: false, href: `/item/${i.id}`, action: "Open" }));
    if (!list.some((t) => !t.done))
      list.push({ key: "add", title: "Add today's lecture", sub: "Record it, snap the slides, or upload a PDF", done: false, href: "/new", action: "Add" });
    return list;
  }, [items, due, log]);
  const doneCount = tasks.filter((t) => t.done).length;
  const nextKey = tasks.find((t) => !t.done)?.key; // the next thing to do gets highlighted

  const byCourse = items.reduce<Record<string, Item[]>>((acc, i) => {
    (acc[i.course] ??= []).push(i);
    return acc;
  }, {});

  return (
    <div>
      {/* blue header: date, greeting, the three numbers */}
      <header className="-mx-4 -mt-6 rounded-b-[28px] bg-blue-600 px-5 pb-6 pt-7 text-white md:mx-0 md:mt-0 md:rounded-[28px]">
        <p className="text-sm text-blue-100">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1 className="mt-0.5 text-[28px] !text-white">{greeting()}</h1>
        <div className="mt-5 grid grid-cols-[1.3fr_1fr_1fr] divide-x divide-white/25">
          <div className="pr-3">
            <p className="text-[13px] text-blue-100">Arabic fade</p>
            <p className="mt-0.5 whitespace-nowrap text-[28px] font-bold leading-tight">{drop > 0 ? `↓ ${drop}%` : "–"}</p>
          </div>
          <div className="px-4">
            <p className="text-[13px] text-blue-100">Learned</p>
            <p className="mt-0.5 text-[28px] font-bold leading-tight">{totalLearned}</p>
          </div>
          <div className="pl-4">
            <p className="text-[13px] text-blue-100">Lessons</p>
            <p className="mt-0.5 text-[28px] font-bold leading-tight">{items.length}</p>
          </div>
        </div>
      </header>

      {/* today's checklist */}
      <section className="mt-6">
        <h2 className="text-lg">Today</h2>
        <p className="text-sm text-slate-500">
          {doneCount} of {tasks.length} done
        </p>
        <div className="relative mt-3">
          {/* the thin line joining the circles */}
          <div className="absolute bottom-6 left-[13px] top-6 w-0.5 bg-line" aria-hidden="true" />
          {tasks.map((t) => {
            const next = t.key === nextKey;
            return (
              <Link
                key={t.key}
                href={t.href}
                className={`relative my-1.5 flex items-center gap-3.5 rounded-2xl ${next ? "-mx-2 border border-blue-200 bg-blue-50 px-2 py-3" : "py-2.5"}`}
              >
                {t.done ? (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600">
                    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round">
                      <path d="M5 12l5 5 9-10" />
                    </svg>
                  </span>
                ) : (
                  <span className={`h-7 w-7 shrink-0 rounded-full border-2 bg-white ${next ? "border-blue-600" : "border-slate-300"}`} />
                )}
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-[15px] font-semibold ${t.done ? "text-slate-400 line-through" : "text-navy-900"}`}>{t.title}</span>
                  <span className="block truncate text-[13px] text-slate-500">{t.sub}</span>
                </span>
                {next && t.action && <span className="rounded-xl bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white">{t.action}</span>}
              </Link>
            );
          })}
        </div>
      </section>

      {/* add a lesson */}
      <section className="mt-6">
        <h2 className="text-lg">Add a lesson</h2>
        <div className="mt-3 grid grid-cols-4 gap-2.5">
          {ADD.map((a) => (
            <Link key={a.href} href={a.href} className="tile flex flex-col items-center gap-1.5 py-3 text-xs font-semibold text-navy-900">
              <Icon d={a.icon} color="#2563eb" size={22} />
              {a.label}
            </Link>
          ))}
        </div>
      </section>

      {/* progress charts */}
      <h2 className="mb-3 mt-8 text-lg">Your progress</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Chart title="Words learned per week" data={learnedWeeks} color="#1e3a8a" unit="words" />
        <Chart title="Times you needed Arabic" subtitle="Going down = your English is improving" data={arabicWeeks} color="#2563eb" unit="times" />
      </div>

      {/* courses */}
      {items.length === 0 ? (
        <div className="card mt-8 text-center">
          <p className="text-lg font-semibold text-navy-900">No lessons yet</p>
          <p className="mt-1 text-slate-500">Record a lecture, snap your slides, or paste an assignment to start.</p>
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
            <h2 className="mb-3 text-lg">{course}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map((i) => (
                <Link key={i.id} href={`/item/${i.id}`} className="tile flex items-center gap-4 p-4">
                  <span className={`h-10 w-1.5 shrink-0 rounded-full ${i.type === "assignment" ? "bg-navy-900" : "bg-blue-600"}`} />
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold text-navy-900">{i.title}</span>
                    <span className="text-sm text-slate-500">
                      {TYPE_LABEL[i.type]} · {new Date(i.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}

      <button className="mt-10 text-sm text-slate-400 underline" onClick={hasSample ? removeSampleData : loadSampleData}>
        {hasSample ? "Remove sample data" : "Load sample data (for demos)"}
      </button>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
