"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { isAdmin } from "@/lib/admin";
import { hasDatabase } from "@/lib/articles/db";
import { locales } from "@/lib/i18n";
import { POSTS_TAG, type PostInput } from "@/lib/posts";
import { deletePost, getPost, savePost, setFeatured } from "@/lib/posts/db";
import type { FormState } from "../actions";

const field = (form: FormData, name: string) => String(form.get(name) ?? "").trim();
const idOf = (form: FormData) => {
  const id = Number(field(form, "id"));
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

// Every action checks the session itself: server actions can be called directly.
async function guard(): Promise<FormState> {
  if (!(await isAdmin())) return { ok: false, message: "Session expirée : reconnectez-vous." };
  if (!hasDatabase()) return { ok: false, message: "La base de données n'est pas encore branchée (MF_DATABASE_URL)." };
  return null;
}

const langLabel = { fr: "français", ar: "arabe", en: "anglais" };

export async function savePostAction(_: FormState, form: FormData): Promise<FormState> {
  const denied = await guard();
  if (denied) return denied;

  // A language counts when its title is filled in; the others stay empty.
  const versions: PostInput["versions"] = {};
  for (const lang of locales) {
    const title = field(form, `title_${lang}`);
    const summary = field(form, `summary_${lang}`);
    const body = String(form.get(`body_${lang}`) ?? "").trim();
    if (title) versions[lang] = { title, summary, body };
    else if (summary || body) return { ok: false, message: `Il manque le titre de la version en ${langLabel[lang]}.` };
  }
  if (Object.keys(versions).length === 0) return { ok: false, message: "Donnez un titre à l'article, au moins dans une langue." };
  const image = Number(field(form, "imageId"));

  const id = idOf(form);
  const published = form.get("published") === "on";
  const saved = await savePost(id, {
    versions,
    imageId: Number.isSafeInteger(image) && image > 0 ? image : null,
    published,
    featured: form.get("featured") === "on",
    featureOrder: Math.trunc(Number(field(form, "featureOrder"))) || 0,
  });
  updateTag(POSTS_TAG);
  // A new post gets its own address: continue editing it there.
  if (id === null) redirect(`/fr/admin/articles/${saved}?saved=1`);
  return { ok: true, message: published ? "Article enregistré et publié." : "Brouillon enregistré (pas encore visible sur le site)." };
}

export async function toggleFeatured(form: FormData) {
  if (await guard()) return;
  const id = idOf(form);
  const post = id && (await getPost(id));
  if (!post) return;
  await setFeatured(post.id, !post.featured);
  updateTag(POSTS_TAG);
}

export async function removePost(form: FormData) {
  if (await guard()) return;
  const id = idOf(form);
  if (id) await deletePost(id);
  updateTag(POSTS_TAG);
  redirect("/fr/admin/articles");
}

