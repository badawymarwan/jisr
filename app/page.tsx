"use client";
// home = dashboard: progress at a glance, quick actions, recent lessons, then the library by course.

import Link from "next/link";
import { useMemo } from "react";
import { Chart, perWeek, WEEKS } from "@/components/ProgressCharts";
import { addSampleHistory, getItems, getLog, getWords, isLearned, removeSampleHistory, useStore } from "@/lib/store";
import type { Item, ItemType } from "@/lib/types";

const TYPE_LABEL: Record<ItemType, string> = { lecture: "Lecture", reading: "Reading", assignment: "Assignment" };
const TYPE_ICON: Record<ItemType, string> = { lecture: "🎙️", reading: "📄", assignment: "📝" };

const ACTIONS = [
  { href: "/new?mode=record", icon: "🎙️", label: "Record lecture" },
  { href: "/new?mode=pdf", icon: "📄", label: "Upload slides" },
  { href: "/new?mode=assignment", icon: "📝", label: "Explain assignment" },
  { href: "/live", icon: "⚡", label: "Live class" },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function Home() {
  const items = useStore(getItems, [] as Item[]);
  const words = useStore(getWords, {});
  const log = useStore(getLog, []);

  const bank = Object.values(words).filter((w) => w.inBank);
  const toReview = bank.filter((w) => !isLearned(w)).length;
  const taps = useMemo(() => perWeek(log, "tap"), [log]);
  const learnedWeeks = useMemo(() => perWeek(log, "learned"), [log]);
  const totalLearned = log.filter((e) => e.kind === "learned").length;
  const hasSample = log.some((e) => e.sample);

  // arabic fade: how much less arabic this week compared with the first active week
  const firstWeek = taps.find((w) => w.value > 0)?.value ?? 0;
  const thisWeek = taps[WEEKS - 1].value;
  const drop = firstWeek > 0 ? Math.round(((firstWeek - thisWeek) / firstWeek) * 100) : 0;

  const byCourse = items.reduce<Record<string, Item[]>>((acc, i) => {
    (acc[i.course] ??= []).push(i);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{greeting()}</h1>
      <p className="mt-1 text-slate-600">Less Arabic, more English, week by week.</p>

      {/* hero: the arabic fade in one number */}
      <div className="mt-6 rounded-3xl bg-gradient-to-br from-navy-800 to-navy-600 p-6 text-white">
        <p className="text-sm text-navy-100">Arabic fade</p>
        {drop > 0 ? (
          <>
            <p className="mt-1 text-4xl font-bold">↓ {drop}%</p>
            <p className="mt-1 text-navy-100">less Arabic needed than when you started</p>
          </>
        ) : (
          <p className="mt-1 text-lg font-medium">Tap hard words while you study. Once you stop needing them, the Arabic fades away.</p>
        )}
      </div>

      {/* three quick numbers */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          [totalLearned, "words learned"],
          [learnedWeeks[WEEKS - 1].value, "this week"],
          [items.length, items.length === 1 ? "lesson" : "lessons"],
        ].map(([n, label]) => (
          <div key={label} className="card text-center">
            <p className="text-2xl font-bold text-navy-800">{n}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {toReview > 0 && (
        <Link href="/words" className="mt-4 flex items-center justify-between rounded-2xl bg-amber-100 px-5 py-4 text-amber-800">
          <span>
            <span className="font-semibold">{toReview} words</span> ready to review
          </span>
          <span className="font-semibold">Review →</span>
        </Link>
      )}

      {/* quick actions */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ACTIONS.map((a) => (
          <Link key={a.href} href={a.href} className="card flex flex-col items-center gap-2 py-4 text-center transition hover:-translate-y-0.5">
            <span className="text-2xl">{a.icon}</span>
            <span className="text-sm font-semibold text-navy-900">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* progress charts */}
      <h2 className="mt-8 mb-3 text-xl font-semibold">Your progress</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Chart title="Words learned per week" data={learnedWeeks} color="#172e57" unit="words" />
        <Chart title="Times you needed Arabic" subtitle="Going down = your English is improving" data={taps} color="#b9790f" unit="taps" />
      </div>

      {/* library */}
      {items.length === 0 ? (
        <div className="card mt-8 text-center">
          <p className="text-lg font-semibold">No lessons yet</p>
          <p className="mt-1 text-slate-600">Record a lecture, upload slides, or paste an assignment to start.</p>
          <Link href="/new" className="btn mt-4">
            Add your first lesson
          </Link>
        </div>
      ) : (
        Object.entries(byCourse).map(([course, list]) => (
          <section key={course} className="mt-8">
            <h2 className="mb-3 text-xl font-semibold">{course}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map((i) => (
                <Link key={i.id} href={`/item/${i.id}`} className="card flex items-center gap-4 transition hover:-translate-y-0.5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy-50 text-xl">{TYPE_ICON[i.type]}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{i.title}</span>
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

      <button className="mt-10 text-sm text-slate-400 underline" onClick={hasSample ? removeSampleHistory : addSampleHistory}>
        {hasSample ? "Remove sample history" : "Show sample history (for demos)"}
      </button>
    </div>
  );
}
