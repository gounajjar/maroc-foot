"use client";

import { useActionState, useRef, useState } from "react";
import { locales, type Locale } from "@/lib/i18n";
import { PostBody } from "@/lib/posts/format";
import { imagePath, type Post, type PostText } from "@/lib/posts/types";
import { savePostAction } from "../actions";

const input =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-[#12100f] outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20";
const button = "rounded-full bg-brand-red px-5 py-2 font-semibold text-white transition hover:bg-[#a01f25] disabled:opacity-50";
const small = "rounded-full px-3 py-1 text-sm ring-1 ring-black/20 hover:bg-black/5 disabled:opacity-50 dark:ring-white/25 dark:hover:bg-white/10";

const langNames: Record<Locale, string> = { fr: "Français", ar: "العربية", en: "English" };
const empty: PostText = { title: "", summary: "", body: "" };

// Pictures are shrunk in the browser before upload: the site never needs more
// than 1600 pixels wide, and it keeps the database small.
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("image"))), "image/jpeg", 0.85));
}

export function PostEditor({ post, saved }: { post: Post | null; saved: boolean }) {
  const [state, action, pending] = useActionState(savePostAction, saved ? { ok: true, message: "Article créé." } : null);
  const [versions, setVersions] = useState<Record<Locale, PostText>>(() => ({
    fr: post?.versions.fr ?? empty,
    ar: post?.versions.ar ?? empty,
    en: post?.versions.en ?? empty,
  }));
  const [tab, setTab] = useState<Locale>(() => locales.find((l) => post?.versions[l]) ?? "fr");
  const [preview, setPreview] = useState(false);
  const [imageId, setImageId] = useState(post?.imageId ?? null);
  const [note, setNote] = useState<{ ok: boolean; message: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const current = versions[tab];
  const update = (lang: Locale, patch: Partial<PostText>) => setVersions((v) => ({ ...v, [lang]: { ...v[lang], ...patch } }));

  // Toolbar: wraps the selected words, or starts the selected lines, with a mark.
  function mark(before: string, after = "", perLine = false) {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    let next: string;
    let cursor: number;
    if (perLine) {
      const start = value.lastIndexOf("\n", a - 1) + 1;
      const lines = value.slice(start, b).split("\n").map((l) => before + l);
      next = value.slice(0, start) + lines.join("\n") + value.slice(b);
      cursor = start + lines.join("\n").length;
    } else {
      const words = value.slice(a, b) || "texte";
      next = value.slice(0, a) + before + words + after + value.slice(b);
      cursor = a + before.length + words.length + after.length;
    }
    update(tab, { body: next });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  }

  function link() {
    const url = window.prompt("Adresse du lien (https://…)");
    if (url && /^https?:\/\//.test(url)) mark("[", `](${url})`);
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setNote(null);
    try {
      const data = new FormData();
      data.append("file", await shrink(file), "photo.jpg");
      const res = await fetch("/api/media", { method: "POST", body: data });
      const json = (await res.json()) as { id?: number; error?: string };
      if (!res.ok || !json.id) throw new Error(json.error ?? "Envoi impossible.");
      setImageId(json.id);
    } catch (err) {
      setNote({ ok: false, message: err instanceof Error ? err.message : "Envoi de la photo impossible." });
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      {post && <input type="hidden" name="id" value={post.id} />}
      <input type="hidden" name="imageId" value={imageId ?? ""} />

      <div className="flex flex-wrap items-center gap-2">
        {locales.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setTab(l)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ${
              l === tab ? "bg-[#12100f] text-white ring-[#12100f] dark:bg-white dark:text-[#12100f]" : "ring-black/15 dark:ring-white/20"
            }`}
          >
            {langNames[l]} {versions[l].title ? "✓" : "—"}
          </button>
        ))}
      </div>
      <p className="-mt-2 text-xs opacity-60">Écrivez chaque langue dans son onglet. Une langue sans titre n&apos;affiche pas l&apos;article sur les pages de cette langue.</p>

      {/* Every language stays in the form, so that all three are saved together. */}
      {locales.map((l) => (
        <div key={l} hidden={l !== tab} dir={l === "ar" ? "rtl" : "ltr"} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Titre
            <input name={`title_${l}`} value={versions[l].title} onChange={(e) => update(l, { title: e.target.value })} className={`${input} text-lg font-semibold`} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Résumé (affiché sur les cartes de l&apos;accueil)
            <textarea name={`summary_${l}`} rows={2} value={versions[l].summary} onChange={(e) => update(l, { summary: e.target.value })} className={input} />
          </label>
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex flex-wrap items-center gap-1.5" dir="ltr">
              <span className="me-1">Texte</span>
              {!preview && (
                <>
                  <button type="button" className={small} onClick={() => mark("**", "**")}><b>G</b></button>
                  <button type="button" className={small} onClick={() => mark("*", "*")}><i>I</i></button>
                  <button type="button" className={small} onClick={() => mark("## ", "", true)}>Titre</button>
                  <button type="button" className={small} onClick={() => mark("### ", "", true)}>Sous-titre</button>
                  <button type="button" className={small} onClick={() => mark("- ", "", true)}>• Liste</button>
                  <button type="button" className={small} onClick={() => mark("> ", "", true)}>❝ Citation</button>
                  <button type="button" className={small} onClick={link}>Lien</button>
                </>
              )}
              <button type="button" className={`${small} ms-auto`} onClick={() => setPreview((p) => !p)}>
                {preview ? "Revenir à l'écriture" : "Aperçu"}
              </button>
            </div>
            <textarea
              ref={l === tab ? bodyRef : undefined}
              name={`body_${l}`}
              rows={16}
              hidden={preview}
              value={versions[l].body}
              onChange={(e) => update(l, { body: e.target.value })}
              className={`${input} leading-relaxed`}
            />
            {preview && (
              <div className="min-h-40 rounded-lg border border-black/15 bg-white p-4 text-[#12100f]">
                <PostBody text={versions[l].body} />
              </div>
            )}
            <span className="text-xs opacity-60" dir="ltr">Laissez une ligne vide entre deux paragraphes.</span>
          </div>
        </div>
      ))}

      <fieldset className="flex flex-col gap-2 text-sm">
        <legend className="mb-1">Photo (la même pour les 3 langues)</legend>
        {imageId ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePath(imageId)} alt="" className="h-24 w-40 rounded-lg object-cover" />
            <button type="button" className={small} onClick={() => setImageId(null)}>Retirer la photo</button>
          </div>
        ) : null}
        <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(e) => upload(e.target.files?.[0])} />
        {uploading && <span className="opacity-70">Envoi de la photo…</span>}
      </fieldset>

      <fieldset className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl bg-black/[.03] p-4 text-sm dark:bg-white/5">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="published" defaultChecked={post?.published ?? false} className="size-4" />
          <span><b>Publier</b> sur le site (sinon reste en brouillon)</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="featured" defaultChecked={post?.featured ?? true} className="size-4" />
          <span><b>À la une</b> sur l&apos;accueil</span>
        </label>
        <label className="flex items-center gap-2">
          Position à la une
          <input type="number" name="featureOrder" min={0} defaultValue={post?.featureOrder || ""} placeholder="auto" className={`${input} w-20`} />
        </label>
        <span className="w-full text-xs opacity-60">Position : 1 = en premier. Laissez vide pour classer du plus récent au plus ancien.</span>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <button disabled={pending || uploading} className={button}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        {[state, note].map(
          (s, i) =>
            s?.message && (
              <p key={i} role="status" className={`text-sm font-medium ${s.ok ? "text-brand-green dark:text-[#9fe3b9]" : "text-brand-red"}`}>
                {s.message}
              </p>
            ),
        )}
      </div>
    </form>
  );
}
