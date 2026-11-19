"use client";
// home: the student's library, grouped by course, plus word-bank stats.

import Link from "next/link";
import { getItems, getWords, isLearned, useStore } from "@/lib/store";
import type { Item, ItemType } from "@/lib/types";

const TYPE_LABEL: Record<ItemType, string> = { lecture: "Lecture", reading: "Reading", assignment: "Assignment" };
const TYPE_ICON: Record<ItemType, string> = { lecture: "🎙️", reading: "📄", assignment: "📝" };

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function Home() {
  const items = useStore(getItems, [] as Item[]);
  const words = useStore(getWords, {});
  const bank = Object.values(words).filter((w) => w.inBank);
  const learned = bank.filter(isLearned).length;

  const byCourse = items.reduce<Record<string, Item[]>>((acc, i) => {
    (acc[i.course] ??= []).push(i);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{greeting()}</h1>
      <p className="mt-1 text-slate-600">
        <span className="font-semibold text-navy-900">{bank.length}</span> {bank.length === 1 ? "word" : "words"} in your word bank ·{" "}
        <span className="font-semibold text-navy-900">{learned}</span> learned
      </p>

      <div className="mt-6 rounded-3xl bg-gradient-to-br from-navy-800 to-navy-600 p-6 text-white">
        <p className="text-sm text-navy-100">Arabic fade</p>
        <p className="mt-1 text-lg font-medium">
          {learned > 0
            ? `${learned} word${learned === 1 ? "" : "s"} no longer need Arabic. Keep going!`
            : "Tap hard words while you study. Once you stop needing them, the Arabic fades away."}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="card mt-6 text-center">
          <p className="text-lg font-semibold">Nothing here yet</p>
          <p className="mt-1 text-slate-600">Record a lecture, upload a reading, or paste an assignment to start.</p>
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
    </div>
  );
}
