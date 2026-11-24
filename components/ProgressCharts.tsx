"use client";
// the two progress charts (words learned, arabic needed), shared by the home dashboard.

import { useState } from "react";
import type { LogEvent } from "@/lib/store";

const WEEK = 7 * 24 * 3600 * 1000;
export const WEEKS = 6;

/** splits the log into the last 6 weeks and counts one kind per week. */
export function perWeek(log: LogEvent[], kind: LogEvent["kind"]) {
  const now = Date.now();
  return Array.from({ length: WEEKS }, (_, i) => {
    const start = now - (WEEKS - i) * WEEK;
    const end = start + WEEK;
    const label = i === WEEKS - 1 ? "This week" : new Date(start).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    return { label, value: log.filter((e) => e.kind === kind && e.t >= start && e.t < end).length };
  });
}

/** a simple bar chart drawn with svg. hover or tap a bar to see its number. */
export function Chart({ title, subtitle, data, color, unit }: { title: string; subtitle?: string; data: { label: string; value: number }[]; color: string; unit: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 320, H = 150, pad = 22; // drawing size; it scales to the card width
  const max = Math.max(1, ...data.map((d) => d.value));
  const slot = W / data.length;
  const barW = slot * 0.55;

  return (
    <div className="card">
      <p className="font-semibold text-navy-600">{title}</p>
      {subtitle && <p className="text-xs font-semibold text-[#64748b]">{subtitle}</p>}
      <svg viewBox={`0 0 ${W} ${H + pad}`} className="mt-3 w-full" role="img" aria-label={`${title}: ${data.map((d) => `${d.label} ${d.value}`).join(", ")}`}>
        <line x1={0} x2={W} y1={H} y2={H} stroke="#e3e9f4" strokeWidth={2} />
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
