"use client";

import { useEffect, useRef, useState } from "react";

// Pictures are loaded straight from the source site; if one is missing or the
// site refuses it, the card shows the source name on brand colours instead.
export function ArticleImage({ src, source }: { src: string | null; source: string }) {
  const [failed, setFailed] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  // An image can fail before hydration, when onError is not attached yet.
  useEffect(() => {
    if (img.current?.complete && img.current.naturalWidth === 0) setFailed(true);
  }, []);
  if (!src || failed) {
    return (
      <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_80%_20%,#c1272d_0%,transparent_60%),radial-gradient(circle_at_10%_110%,#006233_0%,transparent_50%)]">
        <span className="font-display px-4 text-center text-2xl font-extrabold text-white/90">{source}</span>
      </div>
    );
  }
  return (
    // External images from many sites: a plain <img> avoids listing every domain.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={img}
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
    />
  );
}
