"use client";
// sidebar on laptops (add button, links, your courses, arabic fade), bottom bar on phones.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { perWeek, WEEKS } from "./ProgressCharts";
import { dueWords, getItems, getLog, useStore } from "@/lib/store";
import type { Item } from "@/lib/types";

// "new" is the round + button in the middle of the phone bar
const LINKS = [
  { href: "/", label: "Home", icon: "M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" },
  { href: "/words", label: "Words", icon: "M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 5v16" },
  { href: "/new", label: "New", icon: "M12 5v14M5 12h14" },
  { href: "/progress", label: "Progress", icon: "M3 3v18h18M7 15l4-4 3 3 6-6" },
  { href: "/live", label: "Live", icon: "M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3zm6-3a6 6 0 01-12 0m6 6v3" },
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export default function Nav() {
  const path = usePathname();
  const items = useStore(getItems, [] as Item[]);
  const due = useStore(dueWords, []);
  const log = useStore(getLog, []);
  // course names, most recent first
  const courses = useMemo(() => [...new Set([...items].sort((a, b) => b.createdAt - a.createdAt).map((i) => i.course))], [items]);
  const drop = useMemo(() => {
    const w = perWeek(log, "arabic");
    const first = w.find((x) => x.value > 0)?.value ?? 0;
    return first > 0 ? Math.max(0, Math.round(((first - w[WEEKS - 1].value) / first) * 100)) : 0;
  }, [log]);
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <>
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-white p-5 md:flex">
        <Link href="/" className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">J</span>
          <span className="text-2xl font-bold text-navy-900">Jisr</span>
        </Link>

        <Link href="/new" className="btn mb-5 w-full">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add a lesson
        </Link>

        {LINKS.filter((l) => l.href !== "/new").map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold ${
              active(l.href) ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-navy-900"
            }`}
          >
            <Icon d={l.icon} />
            {l.label}
            {/* words due for review, as a small count */}
            {l.href === "/words" && due.length > 0 && (
              <span className="ml-auto rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">{due.length}</span>
            )}
          </Link>
        ))}

        {/* your courses */}
        {courses.length > 0 && (
          <>
            <p className="mb-1 mt-6 px-3 text-xs font-semibold text-slate-400">Courses</p>
            <div className="min-h-0 overflow-y-auto">
              {courses.map((c) => {
                const href = `/course/${encodeURIComponent(c)}`;
                const on = decodeURIComponent(path) === `/course/${c}`;
                return (
                  <Link
                    key={c}
                    href={href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${on ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                    <span className="truncate">{c}</span>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* arabic fade, always in view */}
        <Link href="/progress" className="mt-auto rounded-2xl bg-blue-50 p-4 transition hover:bg-blue-100">
          <p className="text-xs font-semibold text-blue-700">Arabic fade</p>
          <p className="mt-0.5 text-2xl font-bold text-navy-900">{drop > 0 ? `↓ ${drop}%` : "–"}</p>
          <p className="text-xs text-slate-500">{drop > 0 ? "less Arabic than when you started" : "Starts when you tap words"}</p>
        </Link>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-start border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {LINKS.map((l) =>
          l.href === "/new" ? (
            // the + button: a blue circle that sits up out of the bar
            <Link key={l.href} href={l.href} aria-label="Add a lesson" className="flex flex-1 justify-center">
              <span className="-mt-6 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_6px_16px_rgba(37,99,235,0.35)] transition active:scale-95">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
                  <path d={l.icon} />
                </svg>
              </span>
            </Link>
          ) : (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${active(l.href) ? "text-blue-600" : "text-slate-400"}`}
            >
              <Icon d={l.icon} />
              {l.label}
            </Link>
          )
        )}
      </nav>
    </>
  );
}
