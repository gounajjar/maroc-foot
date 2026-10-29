import Link from "next/link";

// Tabs between the admin screens, shown once signed in.
const tabs = [
  { id: "posts", href: "/admin/articles", label: "Mes articles" },
  { id: "comments", href: "/admin/comments", label: "Commentaires" },
  { id: "members", href: "/admin/members", label: "Membres" },
  { id: "links", href: "/admin", label: "Liens et flux RSS" },
] as const;

// The number of comments waiting for approval shows on the "Commentaires" tab.
export function AdminNav({ current, locale, pending = 0 }: { current: (typeof tabs)[number]["id"]; locale: string; pending?: number }) {
  return (
    <nav className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={`/${locale}${t.href}`}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ${
            t.id === current ? "bg-brand-red text-white ring-brand-red" : "ring-black/15 hover:bg-black/5 dark:ring-white/20 dark:hover:bg-white/10"
          }`}
        >
          {t.label}
          {t.id === "comments" && pending > 0 && (
            <span className="ms-1.5 rounded-full bg-[#f2c200] px-1.5 text-xs text-[#12100f]">{pending}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
