import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { hasAdminPassword, isAdmin } from "@/lib/admin";
import { hasDatabase } from "@/lib/articles/db";
import { getLocale } from "@/dictionaries";
import { localize, postPath, type Post } from "@/lib/posts";
import { locales } from "@/lib/i18n";
import { listPosts } from "@/lib/posts/db";
import { LoginForm } from "../forms";
import { AdminNav } from "../nav";
import { toggleFeatured } from "./actions";

export const metadata: Metadata = { title: "Mes articles · Administration", robots: { index: false, follow: false } };

const card = "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10";
const langNames = { fr: "FR", ar: "AR", en: "EN" };

export default function AdminPostsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold">Mes articles</h1>
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
  const locale = await getLocale();
  if (!hasDatabase()) return <p className={card}>La base de données n&apos;est pas encore branchée (MF_DATABASE_URL).</p>;

  const posts = await listPosts();
  return (
    <div className="space-y-6">
      <AdminNav current="posts" locale={locale} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm opacity-70">
          Les articles cochés « À la une » s&apos;affichent sur l&apos;accueil, sous les matchs du jour, dans la langue de l&apos;article. Tous les
          articles publiés apparaissent aussi dans la page Articles.
        </p>
        <Link href={`/${locale}/admin/articles/new`} className="rounded-full bg-brand-red px-5 py-2 font-semibold text-white hover:bg-[#a01f25]">
          + Écrire un article
        </Link>
      </div>
      <section className={card}>
        {posts.length === 0 && <p className="text-sm opacity-60">Aucun article pour l&apos;instant.</p>}
        <ul className="divide-y divide-black/10 dark:divide-white/10">
          {posts.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span className="min-w-0 flex-1">
                <Link href={`/${locale}/admin/articles/${p.id}`} dir="auto" className="line-clamp-2 font-semibold hover:underline">
                  {titleOf(p)}
                </Link>
                <span className="text-xs opacity-70">
                  {locales.filter((l) => p.versions[l]).map((l) => langNames[l]).join(" · ")} ·{" "}
                  {p.published ? (
                    <span className="font-semibold text-brand-green dark:text-[#9fe3b9]">Publié</span>
                  ) : (
                    <span className="font-semibold">Brouillon</span>
                  )}
                  {p.published &&
                    locales.map((l) => {
                      const v = localize(p, l);
                      return (
                        v && (
                          <span key={l}>
                            {" · "}
                            <a href={postPath(v)} target="_blank" className="underline">
                              voir en {langNames[l]}
                            </a>
                          </span>
                        )
                      );
                    })}
                </span>
              </span>
              <form action={toggleFeatured}>
                <input type="hidden" name="id" value={p.id} />
                <button
                  title={p.featured ? "Retirer de l'accueil" : "Mettre à la une sur l'accueil"}
                  className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 ${
                    p.featured ? "bg-brand-green text-white ring-brand-green" : "ring-black/20 hover:bg-black/5 dark:ring-white/25"
                  }`}
                >
                  {p.featured ? `★ À la une${p.featureOrder ? ` (n° ${p.featureOrder})` : ""}` : "☆ À la une"}
                </button>
              </form>
              <Link href={`/${locale}/admin/articles/${p.id}`} className="rounded-full px-3 py-1 text-sm ring-1 ring-black/20 hover:bg-black/5 dark:ring-white/25">
                Modifier
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// The French title when there is one, else the first language written.
const titleOf = (p: Post) => (p.versions.fr ?? p.versions.ar ?? p.versions.en)?.title ?? "(sans titre)";
