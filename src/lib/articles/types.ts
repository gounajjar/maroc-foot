import type { Locale } from "@/lib/i18n";

// An external article shown as a card. The site never stores or shows the
// article text: the card links to the original page.
export type Article = {
  url: string;
  title: string;
  description: string;
  image: string | null;
  source: string;
  publishedAt: string | null;
  lang: Locale;
};

export type Feed = { id: number; url: string; name: string; lang: Locale };

export type ManualArticle = Article & { id: number };
