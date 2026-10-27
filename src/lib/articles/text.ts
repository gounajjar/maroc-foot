const entities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function decodeEntities(text: string) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n = code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : Number(code.slice(1));
      return Number.isFinite(n) ? String.fromCodePoint(n) : match;
    }
    return entities[code.toLowerCase()] ?? match;
  });
}

// Feed descriptions often carry HTML; cards only show a short plain-text teaser.
export function toTeaser(html: string, max = 220) {
  const text = decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
  return text.length > max ? text.slice(0, max).replace(/\s+\S*$/, "") + "…" : text;
}

export function firstImage(html: string) {
  return html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? null;
}

export function toIsoDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value.trim());
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function absoluteUrl(value: string | null | undefined, base: string) {
  if (!value) return null;
  try {
    const url = new URL(decodeEntities(value.trim()), base);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

// Some sites refuse requests without a browser-like user agent.
export async function fetchText(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; MarocFootBot/1.0; +https://maroc-foot.com)", Accept: "*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
}
