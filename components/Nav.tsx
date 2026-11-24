"use client";
// sidebar on laptops, bottom bar on phones.

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home", icon: "M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" },
  { href: "/new", label: "New", icon: "M12 5v14M5 12h14" },
  { href: "/words", label: "Words", icon: "M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 5v16" },
  { href: "/live", label: "Live", icon: "M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3zm6-3a6 6 0 01-12 0m6 6v3" },
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export default function Nav() {
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <>
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r-2 border-line bg-white p-5 md:flex">
        <Link href="/" className="mb-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-600 text-lg font-bold text-white">J</span>
          <span className="text-2xl font-bold text-navy-600">Jisr</span>
        </Link>
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`mb-2 flex items-center gap-3 rounded-2xl border-2 px-4 py-2.5 text-[15px] font-semibold ${
              active(l.href) ? "border-navy-100 bg-navy-50 text-navy-600" : "border-transparent text-[#64748b] hover:bg-slate-50"
            }`}
          >
            <Icon d={l.icon} />
            {l.label}
          </Link>
        ))}
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t-2 border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${active(l.href) ? "text-navy-600" : "text-[#64748b]"}`}
          >
            <Icon d={l.icon} />
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
