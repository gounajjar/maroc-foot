import Link from "next/link";

// Tabs between the admin screens, shown once signed in.
const tabs = [
  { id: "posts", href: "/admin/articles", label: "Mes articles" },
  { id: "links", href: "/admin", label: "Liens et flux RSS" },
] as const;

export function AdminNav({ current, locale }: { current: (typeof tabs)[number]["id"]; locale: string }) {
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
        </Link>
      ))}
    </nav>
  );
}
