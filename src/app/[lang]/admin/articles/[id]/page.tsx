import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { hasAdminPassword, isAdmin } from "@/lib/admin";
import { hasDatabase } from "@/lib/articles/db";
import { getLocale } from "@/dictionaries";
import { getPost } from "@/lib/posts/db";
import { LoginForm } from "../../forms";
import { AdminNav } from "../../nav";
import { removePost } from "../actions";
import { PostEditor } from "./editor";

export const metadata: Metadata = { title: "Article · Administration", robots: { index: false, follow: false } };

const card = "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10";

export default function EditPostPage(props: PageProps<"/[lang]/admin/articles/[id]">) {
  return (
    <div className="space-y-6">
      <Suspense fallback={<p className="opacity-60">…</p>}>
        <Panel {...props} />
      </Suspense>
    </div>
  );
}

async function Panel({ params, searchParams }: PageProps<"/[lang]/admin/articles/[id]">) {
  if (!hasAdminPassword()) {
    return <p className={card}>Le mot de passe d&apos;administration (ADMIN_PASSWORD) n&apos;est pas encore configuré sur Vercel.</p>;
  }
  if (!(await isAdmin())) return <LoginForm />;
  if (!hasDatabase()) return <p className={card}>La base de données n&apos;est pas encore branchée (MF_DATABASE_URL).</p>;
  const locale = await getLocale();
  const { id } = await params;
  const post = id === "new" ? null : await getPost(Number(id));
  if (id !== "new" && !post) notFound();
  const saved = (await searchParams).saved === "1";

  return (
    <div className="space-y-6">
      <AdminNav current="posts" locale={locale} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold">{post ? "Modifier l'article" : "Nouvel article"}</h1>
        <Link href={`/${locale}/admin/articles`} className="text-sm underline opacity-70 hover:opacity-100">
          ← Retour à mes articles
        </Link>
      </div>
      <section className={card}>
        <PostEditor key={post?.id ?? "new"} post={post} saved={saved} />
      </section>
      {post && (
        <form action={removePost} className="text-end">
          <input type="hidden" name="id" value={post.id} />
          <button className="rounded-full px-4 py-1.5 text-sm text-brand-red ring-1 ring-brand-red/40 hover:bg-brand-red hover:text-white">
            Supprimer définitivement cet article
          </button>
        </form>
      )}
    </div>
  );
}
