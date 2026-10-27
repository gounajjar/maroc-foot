"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

// One AdSense unit. The AdSense script (loaded in the layout) fills every
// <ins class="adsbygoogle"> that is pushed onto window.adsbygoogle.
export function AdUnit({ client, slot, fixed }: { client: string; slot: string; fixed?: boolean }) {
  const ref = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (ref.current?.dataset.adsbygoogleStatus) return;
    try {
      (window.adsbygoogle ??= []).push({});
    } catch {
      // Blocked by an ad blocker or not ready: the space simply stays empty.
    }
  }, []);

  return (
    <ins
      ref={ref}
      className="adsbygoogle"
      style={{ display: "block", width: "100%", height: "100%" }}
      data-ad-client={client}
      data-ad-slot={slot}
      {...(fixed ? {} : { "data-ad-format": "auto", "data-full-width-responsive": "true" })}
    />
  );
}
