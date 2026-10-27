"use server";

import { updateTag } from "next/cache";
import { isAdmin, signIn, signOut } from "@/lib/admin";
import { ARTICLES_TAG } from "@/lib/articles";
import { addFeed, addManualArticle, deleteFeed, deleteManualArticle, hasDatabase } from "@/lib/articles/db";
import { readOpenGraph } from "@/lib/articles/open-graph";
import { fetchFeed } from "@/lib/articles/rss";
import { hasLocale, type Locale } from "@/lib/i18n";

export type FormState = { ok: boolean; message: string } | null;

const field = (form: FormData, name: string) => String(form.get(name) ?? "").trim();
const langOf = (form: FormData): Locale => {
  const lang = field(form, "lang");
  return hasLocale(lang) ? lang : "fr";
};

function webUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

// Every action checks the session itself: server actions can be called directly.
async function guard(): Promise<FormState> {
  if (!(await isAdmin())) return { ok: false, message: "Session expirée : reconnectez-vous." };
  if (!hasDatabase()) return { ok: false, message: "La base de données n'est pas encore branchée (MF_DATABASE_URL)." };
  return null;
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  return (await signIn(field(form, "password"))) ? { ok: true, message: "" } : { ok: false, message: "Mot de passe incorrect." };
}

export async function logout() {
  await signOut();
}

export async function addArticle(_: FormState, form: FormData): Promise<FormState> {
  const denied = await guard();
  if (denied) return denied;
  const url = webUrl(field(form, "url"));
  if (!url) return { ok: false, message: "Le lien doit commencer par https://" };

  let article;
  try {
    article = await readOpenGraph(url, langOf(form));
  } catch (err) {
    console.error(err);
    article = { url, title: "", description: "", image: null, source: new URL(url).hostname.replace(/^www\./, ""), publishedAt: null, lang: langOf(form) };
  }
  article.title = field(form, "title") || article.title;
  if (!article.title) return { ok: false, message: "Impossible de lire le titre de cette page : écrivez-le dans le champ « Titre »." };

  await addManualArticle(article);
  updateTag(ARTICLES_TAG);
  return { ok: true, message: `Article ajouté : ${article.title}` };
}

export async function removeArticle(form: FormData) {
  if (await guard()) return;
  await deleteManualArticle(Number(field(form, "id")));
  updateTag(ARTICLES_TAG);
}

export async function addRssFeed(_: FormState, form: FormData): Promise<FormState> {
  const denied = await guard();
  if (denied) return denied;
  const url = webUrl(field(form, "url"));
  const name = field(form, "name");
  if (!url) return { ok: false, message: "Le lien du flux doit commencer par https://" };
  if (!name) return { ok: false, message: "Donnez un nom à la source (ex. Hespress)." };

  const feed = { id: 0, url, name, lang: langOf(form) };
  let count;
  try {
    count = (await fetchFeed(feed)).length;
  } catch (err) {
    console.error(err);
    return { ok: false, message: "Ce lien ne répond pas ou n'est pas un flux RSS." };
  }
  if (count === 0) return { ok: false, message: "Aucun article trouvé dans ce flux : vérifiez le lien." };

  await addFeed(feed);
  updateTag(ARTICLES_TAG);
  return { ok: true, message: `Flux ajouté : ${name} (articles trouvés : ${count})` };
}

export async function removeFeed(form: FormData) {
  if (await guard()) return;
  await deleteFeed(Number(field(form, "id")));
  updateTag(ARTICLES_TAG);
}
