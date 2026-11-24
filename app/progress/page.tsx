"use client";
// progress: the arabic fade and words learned, week by week.

import { useMemo } from "react";
import { Chart, perWeek, WEEKS } from "@/components/ProgressCharts";
import { getLog, loadSampleData, removeSampleData, useStore } from "@/lib/store";

export default function ProgressPage() {
  const log = useStore(getLog, []);
  const arabicWeeks = useMemo(() => perWeek(log, "arabic"), [log]);
  const learnedWeeks = useMemo(() => perWeek(log, "learned"), [log]);
  const firstWeek = arabicWeeks.find((w) => w.value > 0)?.value ?? 0;
  const drop = firstWeek > 0 ? Math.max(0, Math.round(((firstWeek - arabicWeeks[WEEKS - 1].value) / firstWeek) * 100)) : 0;
  const totalLearned = log.filter((e) => e.kind === "learned").length;
  const hasSample = log.some((e) => e.sample);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[28px]">Progress</h1>
      <p className="mt-1 text-slate-500">Less Arabic, more English, week by week.</p>

      <div className="mt-5 rounded-2xl bg-blue-600 p-6 text-white">
        <p className="text-sm text-blue-100">Arabic fade</p>
        <p className="mt-1 text-[44px] font-bold leading-none tracking-tight">{drop > 0 ? `↓ ${drop}%` : "–"}</p>
        <p className="mt-2 text-blue-100">{drop > 0 ? "less Arabic needed than when you started" : "Tap words while you study, and this starts to show."}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-2xl font-bold text-navy-900">{totalLearned}</p>
          <p className="text-xs text-slate-500">words learned</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-navy-900">{learnedWeeks[WEEKS - 1].value}</p>
          <p className="text-xs text-slate-500">learned this week</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Chart title="Times you needed Arabic" subtitle="Going down = your English is improving" data={arabicWeeks} color="#2563eb" unit="times" />
        <Chart title="Words learned per week" data={learnedWeeks} color="#1e3a8a" unit="words" />
      </div>

      <button className="mt-10 text-sm text-slate-400 underline" onClick={hasSample ? removeSampleData : loadSampleData}>
        {hasSample ? "Remove sample data" : "Load sample data (for demos)"}
      </button>
    </div>
  );
}
