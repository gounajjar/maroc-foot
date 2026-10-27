import "server-only";
import type { Locale } from "@/lib/i18n";
import type { Article } from "./types";
import { absoluteUrl, decodeEntities, fetchText, toIsoDate, toTeaser } from "./text";

// Reads the preview information (Open Graph / Twitter / <title>) that sites
// publish for link sharing.
export async function readOpenGraph(pageUrl: string, lang: Locale): Promise<Article> {
  const html = (await fetchText(pageUrl)).slice(0, 500_000);
  const head = html.split(/<\/head>/i)[0];
  const meta = new Map<string, string>();
  for (const tag of head.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = tag.match(/\b(?:property|name|itemprop)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
    const content = tag.match(/\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    const value = content?.[1] ?? content?.[2];
    if (key && value && !meta.has(key)) meta.set(key, decodeEntities(value).trim());
  }
  const pick = (...keys: string[]) => keys.map((k) => meta.get(k)).find(Boolean) ?? "";
  const titleTag = decodeEntities(head.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "").trim();
  const url = absoluteUrl(pick("og:url"), pageUrl) ?? pageUrl;

  return {
    url,
    title: toTeaser(pick("og:title", "twitter:title") || titleTag, 200),
    description: toTeaser(pick("og:description", "twitter:description", "description")),
    image: absoluteUrl(pick("og:image", "og:image:url", "og:image:secure_url", "twitter:image", "twitter:image:src"), url),
    source: pick("og:site_name") || new URL(url).hostname.replace(/^www\./, ""),
    publishedAt: toIsoDate(pick("article:published_time", "og:published_time", "datepublished", "date")),
    lang,
  };
}
