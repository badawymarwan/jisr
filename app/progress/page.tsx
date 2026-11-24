"use client";
// progress: proof the student is improving. words learned per week goes up,
// times they needed arabic goes down (the "arabic fade").

import { useMemo, useState } from "react";
import { addSampleHistory, getLog, removeSampleHistory, useStore, type LogEvent } from "@/lib/store";

const WEEK = 7 * 24 * 3600 * 1000;
const WEEKS = 6;

/** splits the log into the last 6 weeks and counts each kind per week. */
function perWeek(log: LogEvent[], kind: LogEvent["kind"]) {
  const now = Date.now();
  return Array.from({ length: WEEKS }, (_, i) => {
    const start = now - (WEEKS - i) * WEEK;
    const end = start + WEEK;
    const label = i === WEEKS - 1 ? "This week" : new Date(start).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    return { label, value: log.filter((e) => e.kind === kind && e.t >= start && e.t < end).length };
  });
}

export default function ProgressPage() {
  const log = useStore(getLog, []);
  const taps = useMemo(() => perWeek(log, "tap"), [log]);
  const learned = useMemo(() => perWeek(log, "learned"), [log]);
  const hasSample = log.some((e) => e.sample);

  const totalLearned = log.filter((e) => e.kind === "learned").length;
  const firstWeek = taps.find((w) => w.value > 0)?.value ?? 0;
  const lastWeek = taps[WEEKS - 1].value;
  const drop = firstWeek > 0 ? Math.round(((firstWeek - lastWeek) / firstWeek) * 100) : 0;

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Your progress</h1>
      <p className="mt-1 text-slate-500">Less Arabic, more English, week by week.</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="card text-center">
          <p className="text-3xl font-bold text-navy-800">{totalLearned}</p>
          <p className="text-xs text-slate-500">words learned</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-navy-800">{drop > 0 ? `↓ ${drop}%` : "–"}</p>
          <p className="text-xs text-slate-500">less Arabic needed</p>
        </div>
      </div>

      <Chart title="Words learned per week" data={learned} color="#172e57" unit="words" />
      <Chart title="Times you needed Arabic" subtitle="Going down = your English is improving" data={taps} color="#b9790f" unit="taps" />

      {log.length === 0 && (
        <p className="mt-6 text-sm text-slate-500">Nothing yet. Tap words in your lessons and mark the ones you know, and your progress shows up here.</p>
      )}

      <button className="mt-8 text-sm text-slate-400 underline" onClick={hasSample ? removeSampleHistory : addSampleHistory}>
        {hasSample ? "Remove sample history" : "Show sample history (for demos)"}
      </button>
    </div>
  );
}

/** a simple bar chart drawn with svg. hover or tap a bar to see its number. */
function Chart({ title, subtitle, data, color, unit }: { title: string; subtitle?: string; data: { label: string; value: number }[]; color: string; unit: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 320, H = 150, pad = 22; // drawing size; it scales to the card width
  const max = Math.max(1, ...data.map((d) => d.value));
  const slot = W / data.length;
  const barW = slot * 0.55;

  return (
    <div className="card mt-5">
      <p className="font-semibold text-navy-900">{title}</p>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      <svg viewBox={`0 0 ${W} ${H + pad}`} className="mt-3 w-full" role="img" aria-label={`${title}: ${data.map((d) => `${d.label} ${d.value}`).join(", ")}`}>
        <line x1={0} x2={W} y1={H} y2={H} stroke="#e2e8f0" />
        {data.map((d, i) => {
          const h = (d.value / max) * (H - 24);
          const x = i * slot + (slot - barW) / 2;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(hover === i ? null : i)}>
              {/* invisible wide rectangle so the bar is easy to hover/tap */}
              <rect x={i * slot} y={0} width={slot} height={H} fill="transparent" />
              {/* bar with rounded top, flat bottom on the baseline */}
              <path d={roundedTop(x, H - h, barW, h, Math.min(4, h))} fill={color} opacity={hover === null || hover === i ? 1 : 0.4} />
              {(hover === i || (hover === null && (i === 0 || i === data.length - 1))) && d.value > 0 && (
                <text x={x + barW / 2} y={H - h - 6} textAnchor="middle" fontSize={11} fill="#334155">
                  {hover === i ? `${d.value} ${unit}` : d.value}
                </text>
              )}
              <text x={x + barW / 2} y={H + 15} textAnchor="middle" fontSize={10} fill="#64748b">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** svg path for a bar whose top corners are rounded. */
function roundedTop(x: number, y: number, w: number, h: number, r: number) {
  if (h <= 0) return "";
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}
