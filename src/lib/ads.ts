// Google AdSense settings, read from the environment so the site runs without
// ads until the account is approved. Each placement has its own ad unit; a
// placement whose unit is not set stays empty.
//
//   ADSENSE_CLIENT        publisher id, "ca-pub-1234567890123456"
//   ADSENSE_SLOT_BANNER   banner under the championship bar, on every page
//   ADSENSE_SLOT_INLINE   block inside pages (home, championships, articles)
//   ADSENSE_SLOT_SIDEBAR  column beside the content on wide screens
//   ADS_PREVIEW=1         draws grey placeholders instead, to check the layout

export type AdPlacement = "banner" | "inline" | "sidebar";

const slotVars: Record<AdPlacement, string> = {
  banner: "ADSENSE_SLOT_BANNER",
  inline: "ADSENSE_SLOT_INLINE",
  sidebar: "ADSENSE_SLOT_SIDEBAR",
};

export function adsenseClient(): string | undefined {
  const client = process.env.ADSENSE_CLIENT?.trim();
  return client && /^ca-pub-\d+$/.test(client) ? client : undefined;
}

export function adsPreview() {
  return process.env.ADS_PREVIEW === "1";
}

export function adSlot(placement: AdPlacement): string | undefined {
  return process.env[slotVars[placement]]?.trim() || undefined;
}

export function adEnabled(placement: AdPlacement) {
  return adsPreview() || Boolean(adsenseClient() && adSlot(placement));
}
