import "server-only";
import { XMLParser } from "fast-xml-parser";
import type { Article, Feed } from "./types";
import { absoluteUrl, fetchText, firstImage, toIsoDate, toTeaser } from "./text";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@", textNodeName: "#text" });

type Node = Record<string, unknown>;

const list = (value: unknown): Node[] => (Array.isArray(value) ? value : value == null ? [] : [value]) as Node[];

function text(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return text(value[0]);
  if (typeof value === "object") return text((value as Node)["#text"]);
  return "";
}

function attr(value: unknown, name: string): string | null {
  const node = list(value)[0];
  const found = node?.[`@${name}`];
  return typeof found === "string" ? found : null;
}

// RSS 2.0 <item> and Atom <entry> both end up here.
function toArticle(item: Node, feed: Feed): Article | null {
  const atomLink = list(item.link).find((l) => !attr(l, "rel") || attr(l, "rel") === "alternate");
  const link = typeof item.link === "string" ? item.link : (attr(atomLink, "href") ?? text(item.link));
  const url = absoluteUrl(link, feed.url);
  const title = toTeaser(text(item.title), 200);
  if (!url || !title) return null;

  const body = text(item.description) || text(item.summary) || text(item["content:encoded"]) || text(item.content);
  const enclosure = list(item.enclosure).find((e) => (attr(e, "type") ?? "image").startsWith("image"));
  const image =
    attr(item["media:content"], "url") ??
    attr(item["media:thumbnail"], "url") ??
    attr(list(item["media:group"])[0]?.["media:content"], "url") ??
    attr(enclosure, "url") ??
    firstImage(text(item["content:encoded"]) || body);

  return {
    url,
    title,
    description: toTeaser(body),
    image: absoluteUrl(image, url),
    source: feed.name,
    publishedAt: toIsoDate(text(item.pubDate) || text(item.published) || text(item.updated) || text(item["dc:date"])),
    lang: feed.lang,
  };
}

export async function fetchFeed(feed: Feed, limit = 20): Promise<Article[]> {
  const doc = parser.parse(await fetchText(feed.url)) as Node;
  const rss = doc.rss as Node | undefined;
  const channel = rss?.channel as Node | undefined;
  const atom = doc.feed as Node | undefined;
  const rdf = doc["rdf:RDF"] as Node | undefined;
  const items = list(channel?.item ?? atom?.entry ?? rdf?.item);
  return items
    .slice(0, limit)
    .map((item) => toArticle(item, feed))
    .filter((a): a is Article => a !== null);
}
