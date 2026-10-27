"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flag } from "@/components/Flag";

export type LeagueMenuItem = { href: string; name: string; country: string };

// Championship bar under the header. It lists every enabled competition, so a
// competition added to `competitions` appears here without further changes.
// The bar scrolls sideways when the entries do not fit.
export function LeagueMenuList({ items, label, active }: { items: LeagueMenuItem[]; label: string; active?: string }) {
  return (
    <nav aria-label={label} className="bg-[#12100f] text-white">
      <ul className="mx-auto flex max-w-(--page-width) gap-1 overflow-x-auto px-2 [scrollbar-width:none]">
        {items.map((item) => {
          const current = item.href === active;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`flex items-center gap-2 border-b-3 px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition ${
                  current ? "border-[#9fe3b9] text-white" : "border-transparent text-white/70 hover:text-white"
                }`}
              >
                <Flag country={item.country} size={18} />
                {item.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Reads the current path to highlight the open championship. Render it inside
// <Suspense> with a LeagueMenuList fallback: the path is not known while the
// shared layout is prerendered.
export function LeagueMenu(props: { items: LeagueMenuItem[]; label: string }) {
  return <LeagueMenuList {...props} active={usePathname()} />;
}
