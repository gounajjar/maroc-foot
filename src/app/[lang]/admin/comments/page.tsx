import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { hasAdminPassword, isAdmin } from "@/lib/admin";
import { hasDatabase } from "@/lib/articles/db";
import { getLocale } from "@/dictionaries";
import { commentCounts, commentsForModeration, type CommentStatus } from "@/lib/comments";
import { LoginForm } from "../forms";
import { AdminNav } from "../nav";
import { banMember, moderate } from "./actions";

export const metadata: Metadata = { title: "Commentaires · Administration", robots: { index: false, follow: false } };

const card = "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10";
const filters = [
  { id: "pending", label: "À valider" },
  { id: "reported", label: "Signalés" },
  { id: "approved", label: "Publiés" },
  { id: "rejected", label: "Refusés" },
] as const;
type Filter = (typeof filters)[number]["id"];

export default function AdminCommentsPage(props: PageProps<"/[lang]/admin/comments">) {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold">Commentaires</h1>
      <Suspense fallback={<p className="opacity-60">…</p>}>
        <Panel {...props} />
      </Suspense>
    </div>
  );
}

async function Panel({ searchParams }: PageProps<"/[lang]/admin/comments">) {
  if (!hasAdminPassword()) {
    return <p className={card}>Le mot de passe d&apos;administration (ADMIN_PASSWORD) n&apos;est pas encore configuré sur Vercel.</p>;
  }
  if (!(await isAdmin())) return <LoginForm />;
  if (!hasDatabase()) return <p className={card}>La base de données n&apos;est pas encore branchée (MF_DATABASE_URL).</p>;
  const locale = await getLocale();
  const asked = (await searchParams).show;
  const show: Filter = filters.some((f) => f.id === asked) ? (asked as Filter) : "pending";
  const [comments, counts] = await Promise.all([commentsForModeration(show), commentCounts()]);
  const count = { pending: counts.pending, reported: counts.reported } as Partial<Record<Filter, number>>;

  return (
    <div className="space-y-6">
      <AdminNav current="comments" locale={locale} pending={counts.pending} />
      <p className="max-w-2xl text-sm opacity-70">
        Chaque commentaire attend votre accord avant d&apos;apparaître sous l&apos;article. Les commentaires publiés que des membres signalent
        arrivent dans « Signalés ».
      </p>
      <div className="flex flex-wrap gap-2 text-sm">
        {filters.map((f) => (
          <Link
            key={f.id}
            href={`/${locale}/admin/comments?show=${f.id}`}
            className={`rounded-full px-3 py-1 font-semibold ${f.id === show ? "bg-[#12100f] text-white dark:bg-white dark:text-[#12100f]" : "ring-1 ring-black/15 dark:ring-white/20"}`}
          >
            {f.label}
            {count[f.id] ? ` (${count[f.id]})` : ""}
          </Link>
        ))}
      </div>
      <section className={card}>
        {comments.length === 0 && <p className="text-sm opacity-60">Rien ici pour le moment.</p>}
        <ul className="divide-y divide-black/10 dark:divide-white/10">
          {comments.map((c) => (
            <li key={c.id} className="space-y-2 py-4">
              <p className="text-xs opacity-70">
                <b className="text-sm opacity-100" dir="auto">{c.pseudo}</b> ({c.email}) · {new Date(c.createdAt).toLocaleString("fr-FR", { timeZone: "Africa/Casablanca" })}
                {" · sur "}
                <Link href={`/${locale}/admin/articles/${c.postId}`} className="underline" dir="auto">
                  {c.postTitle}
                </Link>
                {c.parentId && " · réponse à un commentaire"}
                {c.reports > 0 && <b className="text-brand-red"> · signalé {c.reports} fois</b>}
              </p>
              <p dir="auto" className="whitespace-pre-line">{c.body}</p>
              <div className="flex flex-wrap gap-2">
                {c.status !== "approved" && <Decision id={c.id} decision="approved" label="✓ Publier" tone="green" />}
                {show === "reported" && <Decision id={c.id} decision="approved" label="Garder en ligne" tone="green" />}
                {c.status !== "rejected" && <Decision id={c.id} decision="rejected" label={c.status === "approved" ? "Retirer" : "✗ Refuser"} tone="red" />}
                <Decision id={c.id} decision="delete" label="Supprimer" tone="plain" />
                <form action={banMember}>
                  <input type="hidden" name="id" value={c.memberId} />
                  <input type="hidden" name="banned" value="1" />
                  <button className="rounded-full px-3 py-1 text-sm opacity-70 ring-1 ring-black/20 hover:opacity-100 dark:ring-white/25">Bloquer ce membre</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const tones = {
  green: "bg-brand-green text-white hover:bg-[#004d28]",
  red: "text-brand-red ring-1 ring-brand-red/40 hover:bg-brand-red hover:text-white",
  plain: "ring-1 ring-black/20 hover:bg-black/5 dark:ring-white/25",
};

function Decision({ id, decision, label, tone }: { id: number; decision: CommentStatus | "delete"; label: string; tone: keyof typeof tones }) {
  return (
    <form action={moderate}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="decision" value={decision} />
      <button className={`rounded-full px-3 py-1 text-sm font-semibold ${tones[tone]}`}>{label}</button>
    </form>
  );
}
