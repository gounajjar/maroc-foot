"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Flag } from "@/components/Flag";

export type LeagueMenuItem = { href: string; name: string; country: string; type: "league" | "cup" };

const linkClass = (current: boolean) =>
  `flex items-center gap-1.5 border-b-3 px-2.5 py-2.5 text-[13px] font-semibold whitespace-nowrap transition ${
    current ? "border-[#9fe3b9] text-white" : "border-transparent text-white/70 hover:text-white"
  }`;

// Championship bar under the header. It lists every enabled competition, so a
// competition added to `competitions` appears here without further changes:
// leagues are shown as links and cups are grouped by region ("EU", "AF") into
// dropdowns. The bar wraps onto a second line when the entries do not fit.
export function LeagueMenuList({
  items,
  label,
  cupGroups,
  active,
}: {
  items: LeagueMenuItem[];
  label: string;
  cupGroups: Record<string, string>;
  active?: string;
}) {
  const leagues = items.filter((i) => i.type === "league");
  const regions = [...new Set(items.filter((i) => i.type === "cup").map((i) => i.country))];
  return (
    <nav aria-label={label} className="relative z-20 bg-[#12100f] text-white">
      <ul className="mx-auto flex max-w-(--page-width) flex-wrap px-2 xl:max-w-none xl:justify-center">
        {leagues.map((item) => (
          <li key={item.href}>
            <Link href={item.href} aria-current={item.href === active ? "page" : undefined} className={linkClass(item.href === active)}>
              <Flag country={item.country} size={16} />
              {item.name}
            </Link>
          </li>
        ))}
        {regions.map((region) => (
          <CupDropdown
            key={region}
            region={region}
            label={cupGroups[region] ?? region}
            items={items.filter((i) => i.type === "cup" && i.country === region)}
            active={active}
          />
        ))}
      </ul>
    </nav>
  );
}

// Opens on mouse hover, and on click/tap or keyboard for touch screens. Closes
// on Escape, on a click elsewhere and after navigating to a cup.
function CupDropdown({ region, label, items, active }: { region: string; label: string; items: LeagueMenuItem[]; active?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const current = items.some((i) => i.href === active);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const menuId = `cups-${region}`;
  return (
    <li
      ref={ref}
      className="relative"
      onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
      onBlur={(e) => !ref.current?.contains(e.relatedTarget as Node) && setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className={`${linkClass(current)} cursor-pointer`}
      >
        <Flag country={region} size={16} />
        {label}
        <svg aria-hidden width="10" height="10" viewBox="0 0 10 10" className={`transition ${open ? "rotate-180" : ""}`}>
          <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>
      <ul
        id={menuId}
        hidden={!open}
        className="absolute start-0 top-full z-10 min-w-full overflow-hidden rounded-b-md bg-[#12100f] py-1 shadow-lg ring-1 ring-white/10"
      >
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={item.href === active ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition hover:bg-white/10 ${
                item.href === active ? "text-[#9fe3b9]" : "text-white/80 hover:text-white"
              }`}
            >
              <Flag country={item.country} size={18} />
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

// Reads the current path to highlight the open championship. Render it inside
// <Suspense> with a LeagueMenuList fallback: the path is not known while the
// shared layout is prerendered.
export function LeagueMenu(props: { items: LeagueMenuItem[]; label: string; cupGroups: Record<string, string> }) {
  return <LeagueMenuList {...props} active={usePathname()} />;
}
