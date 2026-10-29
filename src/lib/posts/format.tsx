import { Fragment, type ReactNode } from "react";

// The owner writes posts in plain text with a few marks, which the editor
// toolbar inserts:
//   ## Title   ### Subtitle   - list item   > quote
//   **bold**   *italic*   [text](https://link)
// A blank line starts a new paragraph. Nothing else is interpreted, so the
// text can never inject HTML into the page.

const INLINE = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = out.length;
    if (m[1] !== undefined) out.push(<strong key={key}>{inline(m[1])}</strong>);
    else if (m[2] !== undefined) out.push(<em key={key}>{inline(m[2])}</em>);
    else
      out.push(
        <a key={key} href={m[4]} target="_blank" rel="noopener noreferrer nofollow" className="text-brand-red underline">
          {m[3]}
        </a>,
      );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const lines = (block: string) =>
  block.split("\n").map((l, i, all) => (
    <Fragment key={i}>
      {inline(l)}
      {i < all.length - 1 && <br />}
    </Fragment>
  ));

export function PostBody({ text }: { text: string }) {
  const blocks = text.replace(/\r\n?/g, "\n").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <div dir="auto" className="space-y-4 text-lg leading-relaxed">
      {blocks.map((b, i) => {
        if (b.startsWith("### ")) return <h3 key={i} className="font-display pt-2 text-2xl font-extrabold">{inline(b.slice(4))}</h3>;
        if (b.startsWith("## ")) return <h2 key={i} className="font-display pt-3 text-3xl font-extrabold">{inline(b.slice(3))}</h2>;
        const rows = b.split("\n");
        if (rows.every((r) => /^[-•]\s/.test(r)))
          return (
            <ul key={i} className="list-disc space-y-1 ps-6">
              {rows.map((r, j) => <li key={j}>{inline(r.replace(/^[-•]\s+/, ""))}</li>)}
            </ul>
          );
        if (rows.every((r) => r.startsWith(">")))
          return (
            <blockquote key={i} className="border-s-4 border-brand-green ps-4 italic opacity-90">
              {lines(rows.map((r) => r.replace(/^>\s?/, "")).join("\n"))}
            </blockquote>
          );
        return <p key={i}>{lines(b)}</p>;
      })}
    </div>
  );
}
