import Link from "next/link";
import { imagePath, postPath, type LocalizedPost } from "@/lib/posts";

// Card for an article written on Maroc-Foot: it opens on the site itself.
export function PostCard({ post, large = false, label }: { post: LocalizedPost; large?: boolean; label: string }) {
  const date = post.publishedAt
    ? new Intl.DateTimeFormat(post.lang, { dateStyle: "medium", timeZone: "Africa/Casablanca" }).format(new Date(post.publishedAt))
    : null;
  return (
    <Link
      href={postPath(post)}
      className={`group flex h-full overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-white/5 dark:ring-white/10 ${
        large ? "flex-col md:flex-row" : "flex-col"
      }`}
    >
      <div className={`relative aspect-[16/9] shrink-0 overflow-hidden bg-[#12100f] ${large ? "md:aspect-[16/10] md:w-3/5 md:self-start" : ""}`}>
        {post.imageId ? (
          // Pictures come from our own database: no resizing service needed.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagePath(post.imageId)} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_80%_20%,#c1272d_0%,transparent_60%),radial-gradient(circle_at_10%_110%,#006233_0%,transparent_50%)]" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 md:p-5">
        <p className="text-xs font-semibold tracking-wide text-brand-red uppercase">
          {label}
          {date && <span className="font-normal text-current opacity-60"> · <bdi>{date}</bdi></span>}
        </p>
        <h3 className={`font-display leading-snug font-extrabold ${large ? "text-2xl md:text-3xl" : "text-xl"}`}>{post.title}</h3>
        {post.summary && <p className={`text-sm opacity-75 ${large ? "line-clamp-5" : "line-clamp-3"}`}>{post.summary}</p>}
      </div>
    </Link>
  );
}
