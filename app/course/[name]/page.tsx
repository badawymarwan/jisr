"use client";
// one course: its lessons and assignments, newest first, and its saved words.

import Link from "next/link";
import { useParams } from "next/navigation";
import { getItems, getWords, isLearned, useStore } from "@/lib/store";
import type { Item, ItemType } from "@/lib/types";

const TYPE_LABEL: Record<ItemType, string> = { lecture: "Lecture", reading: "Reading", assignment: "Assignment" };

export default function CoursePage() {
  const { name } = useParams<{ name: string }>();
  const course = decodeURIComponent(name);
  const items = useStore(getItems, [] as Item[]).filter((i) => i.course === course);
  const words = Object.values(useStore(getWords, {})).filter((w) => w.inBank && w.course === course);
  const learned = words.filter(isLearned).length;

  return (
    <div>
      <Link href="/" className="text-sm text-slate-500">
        ← Courses
      </Link>
      <h1 className="mt-2 text-[28px]">{course}</h1>
      <p className="mt-1 text-slate-500">
        {learned} of {words.length} words learned
      </p>

      <div className="mt-6 grid gap-3">
        {items.map((i) => (
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
        {items.length === 0 && <p className="text-slate-500">No lessons in this course.</p>}
      </div>

      {words.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-lg">Words</h2>
          <div className="flex flex-wrap gap-2">
            {words.map((w) => (
              <span key={w.term} className={`rounded-full border px-3.5 py-2 text-sm font-semibold ${isLearned(w) ? "border-blue-200 bg-blue-50 text-blue-800" : "border-line bg-white text-navy-900"}`}>
                {w.term}
                {isLearned(w) && " ✓"}
              </span>
            ))}
          </div>
        </>
      )}

      <Link href={`/new?course=${encodeURIComponent(course)}`} className="btn mt-8 w-full">
        Add a lesson to {course}
      </Link>
    </div>
  );
}
