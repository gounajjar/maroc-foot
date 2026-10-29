import type { Metadata } from "next";
import { Suspense } from "react";
import { hasAdminPassword, isAdmin } from "@/lib/admin";
import { hasDatabase } from "@/lib/articles/db";
import { getLocale } from "@/dictionaries";
import { commentCounts } from "@/lib/comments";
import { listMembers } from "@/lib/members";
import { banMember } from "../comments/actions";
import { LoginForm } from "../forms";
import { AdminNav } from "../nav";

export const metadata: Metadata = { title: "Membres · Administration", robots: { index: false, follow: false } };

const card = "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10";

export default function AdminMembersPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold">Membres</h1>
      <Suspense fallback={<p className="opacity-60">…</p>}>
        <Panel />
      </Suspense>
    </div>
  );
}

async function Panel() {
  if (!hasAdminPassword()) {
    return <p className={card}>Le mot de passe d&apos;administration (ADMIN_PASSWORD) n&apos;est pas encore configuré sur Vercel.</p>;
  }
  if (!(await isAdmin())) return <LoginForm />;
  if (!hasDatabase()) return <p className={card}>La base de données n&apos;est pas encore branchée (MF_DATABASE_URL).</p>;
  const locale = await getLocale();
  const [members, counts] = await Promise.all([listMembers(), commentCounts()]);

  return (
    <div className="space-y-6">
      <AdminNav current="members" locale={locale} pending={counts.pending} />
      <p className="max-w-2xl text-sm opacity-70">
        Un membre bloqué est déconnecté, ne peut plus se connecter, et ses commentaires disparaissent du site. Les comptes jamais validés sont
        supprimés automatiquement après 7 jours.
      </p>
      <section className={card}>
        <h2 className="font-display mb-3 text-xl font-extrabold">{members.length} membre{members.length > 1 ? "s" : ""}</h2>
        <ul className="divide-y divide-black/10 dark:divide-white/10">
          {members.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
              <span className="min-w-0">
                <b dir="auto">{m.pseudo}</b> <span className="text-sm opacity-70">{m.email}</span>
                <span className="block text-xs opacity-60">
                  Inscrit le {new Date(m.createdAt).toLocaleDateString("fr-FR")} · {m.verified ? "validé" : "pas encore validé"} · {m.comments} commentaire
                  {m.comments > 1 ? "s" : ""}
                  {m.banned && <b className="text-brand-red"> · bloqué</b>}
                </span>
              </span>
              <form action={banMember}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="banned" value={m.banned ? "0" : "1"} />
                <button className={`rounded-full px-3 py-1 text-sm ring-1 ${m.banned ? "ring-black/20" : "text-brand-red ring-brand-red/40 hover:bg-brand-red hover:text-white"}`}>
                  {m.banned ? "Débloquer" : "Bloquer"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
