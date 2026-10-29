import type { Metadata } from "next";
import { Suspense } from "react";
import { hasAdminPassword, isAdmin } from "@/lib/admin";
import { hasDatabase, listFeeds, listManualArticles } from "@/lib/articles/db";
import { fetchFeed } from "@/lib/articles/rss";
import { logout, removeArticle, removeFeed } from "./actions";
import { AddArticleForm, AddFeedForm, LoginForm } from "./forms";
import { AdminNav } from "./nav";
import { getLocale } from "@/dictionaries";

// Admin screens are in French only: they are used by the site owner.
export const metadata: Metadata = { title: "Administration", robots: { index: false, follow: false } };

const card = "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10";
const removeButton = "shrink-0 rounded-full px-3 py-1 text-sm text-brand-red ring-1 ring-brand-red/40 hover:bg-brand-red hover:text-white";
const langNames = { fr: "FR", ar: "AR", en: "EN" };

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold">Administration des articles</h1>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AdminNav current="links" locale={await getLocale()} />
        <form action={logout}>
          <button className="text-sm underline opacity-70 hover:opacity-100">Se déconnecter</button>
        </form>
      </div>
      {!hasDatabase() ? (
        <p className={card}>La base de données n&apos;est pas encore branchée (MF_DATABASE_URL). Les flux par défaut s&apos;affichent, mais rien ne peut être ajouté.</p>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <section className={card}>
              <h2 className="font-display mb-3 text-2xl font-extrabold">Ajouter un article</h2>
              <p className="mb-4 text-sm opacity-70">Collez le lien : le titre, le résumé et l&apos;image sont repris automatiquement de la page.</p>
              <AddArticleForm />
            </section>
            <section className={card}>
              <h2 className="font-display mb-3 text-2xl font-extrabold">Ajouter un flux RSS</h2>
              <p className="mb-4 text-sm opacity-70">Les nouveaux articles du flux apparaissent tout seuls sur le site.</p>
              <AddFeedForm />
            </section>
          </div>
          <Lists />
        </>
      )}
    </div>
  );
}

async function Lists() {
  const [feeds, articles] = await Promise.all([listFeeds(), listManualArticles(50)]);
  // Read every feed now so the owner can see which sources stopped answering.
  const counts = await Promise.all(feeds.map((f) => fetchFeed(f).then((items) => items.length, () => null)));
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className={card}>
        <h2 className="font-display mb-3 text-xl font-extrabold">Flux RSS ({feeds.length})</h2>
        <ul className="divide-y divide-black/10 dark:divide-white/10">
          {feeds.map((f, i) => (
            <li key={f.id} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0">
                <span className="font-semibold">{f.name}</span> <span className="text-xs opacity-60">{langNames[f.lang]}</span>{" "}
                <FeedStatus count={counts[i]} />
                <span className="block truncate text-xs opacity-60" dir="ltr">{f.url}</span>
              </span>
              <form action={removeFeed}>
                <input type="hidden" name="id" value={f.id} />
                <button className={removeButton}>Retirer</button>
              </form>
            </li>
          ))}
        </ul>
      </section>
      <section className={card}>
        <h2 className="font-display mb-3 text-xl font-extrabold">Articles ajoutés à la main ({articles.length})</h2>
        {articles.length === 0 && <p className="text-sm opacity-60">Aucun pour l&apos;instant.</p>}
        <ul className="divide-y divide-black/10 dark:divide-white/10">
          {articles.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2">
              <a href={a.url} target="_blank" rel="noopener noreferrer" className="min-w-0 hover:underline" dir="auto">
                <span className="line-clamp-2 font-semibold">{a.title}</span>
                <span className="text-xs opacity-60">{a.source} · {langNames[a.lang]}</span>
              </a>
              <form action={removeArticle}>
                <input type="hidden" name="id" value={a.id} />
                <button className={removeButton}>Supprimer</button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function FeedStatus({ count }: { count: number | null }) {
  if (count === null) return <span className="text-xs font-semibold text-brand-red">● ne répond pas</span>;
  if (count === 0) return <span className="text-xs font-semibold text-brand-red">● aucun article</span>;
  return <span className="text-xs font-semibold text-brand-green dark:text-[#9fe3b9]">● OK, {count} article{count > 1 ? "s" : ""}</span>;
}
