"use client";

import { useActionState } from "react";
import { addArticle, addRssFeed, login, type FormState } from "./actions";

const input =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-[#12100f] outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20";
const button =
  "rounded-full bg-brand-red px-5 py-2 font-semibold text-white transition hover:bg-[#a01f25] disabled:opacity-50";

function Status({ state }: { state: FormState }) {
  if (!state?.message) return null;
  return (
    <p role="status" className={`text-sm font-medium ${state.ok ? "text-brand-green dark:text-[#9fe3b9]" : "text-brand-red"}`}>
      {state.message}
    </p>
  );
}

function LangSelect() {
  return (
    <label className="flex flex-col gap-1 text-sm">
      Langue des articles
      <select name="lang" defaultValue="fr" className={input}>
        <option value="fr">Français</option>
        <option value="ar">العربية</option>
        <option value="en">English</option>
      </select>
    </label>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="flex max-w-sm flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Mot de passe
        <input type="password" name="password" required autoComplete="current-password" className={input} />
      </label>
      <button disabled={pending} className={button}>
        Se connecter
      </button>
      <Status state={state} />
    </form>
  );
}

export function AddArticleForm() {
  const [state, action, pending] = useActionState(addArticle, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Lien de l&apos;article
        <input type="url" name="url" required placeholder="https://…" dir="ltr" className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Titre (facultatif, sinon repris de la page)
        <input type="text" name="title" dir="auto" className={input} />
      </label>
      <LangSelect />
      <button disabled={pending} className={`${button} self-start`}>
        {pending ? "Lecture de la page…" : "Ajouter l'article"}
      </button>
      <Status state={state} />
    </form>
  );
}

export function AddFeedForm() {
  const [state, action, pending] = useActionState(addRssFeed, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Lien du flux RSS
        <input type="url" name="url" required placeholder="https://site.com/feed" dir="ltr" className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Nom de la source
        <input type="text" name="name" required placeholder="Hespress" dir="auto" className={input} />
      </label>
      <LangSelect />
      <button disabled={pending} className={`${button} self-start`}>
        {pending ? "Vérification du flux…" : "Ajouter le flux"}
      </button>
      <Status state={state} />
    </form>
  );
}
