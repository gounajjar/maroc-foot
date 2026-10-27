import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getDictionary } from "@/dictionaries";
import { contactEmail } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: `${dict.privacy.title} · ${dict.site.name}`, description: dict.privacy.intro };
}

// Turns the web addresses and the {email} marker of a paragraph into links.
function linkify(text: string): ReactNode[] {
  return text.split(/(https:\/\/\S+?(?=[.,]?(?:\s|$))|\{email\})/).map((part, i) => {
    if (part === "{email}")
      return (
        <a key={i} href={`mailto:${contactEmail}`} className="font-medium text-brand-red hover:underline">
          {contactEmail}
        </a>
      );
    if (part.startsWith("https://"))
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-red hover:underline" dir="ltr">
          {part.replace("https://", "")}
        </a>
      );
    return part;
  });
}

export default async function PrivacyPage() {
  const { privacy } = await getDictionary();
  return (
    <article className="mx-auto max-w-2xl space-y-8 leading-relaxed">
      <header>
        <h1 className="font-display text-3xl font-extrabold">{privacy.title}</h1>
        <p className="mt-1 text-sm opacity-60">{privacy.updated}</p>
        <p className="mt-4">{privacy.intro}</p>
      </header>
      {privacy.sections.map((section) => (
        <section key={section.title} className="space-y-3">
          <h2 className="font-display text-xl font-bold">{section.title}</h2>
          {section.paragraphs.map((p, i) => (
            <p key={i} className="opacity-90">
              {linkify(p)}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
