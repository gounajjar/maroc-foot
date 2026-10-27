import { getDictionary } from "@/dictionaries";
import { adEnabled, adSlot, adsenseClient, adsPreview, type AdPlacement } from "@/lib/ads";
import { AdUnit } from "./AdUnit";

// Space kept for each placement, so the page does not jump when the ad loads.
const sizes: Record<AdPlacement, string> = {
  banner: "h-[100px] sm:h-[90px]",
  inline: "min-h-[250px]",
  sidebar: "h-[600px] w-[300px]",
};

// An ad placement. Renders nothing until AdSense is configured (see lib/ads.ts).
export async function AdSlot({ placement, className = "" }: { placement: AdPlacement; className?: string }) {
  if (!adEnabled(placement)) return null;
  const dict = await getDictionary();
  const box = `${sizes[placement]} flex w-full items-center justify-center overflow-hidden`;

  return (
    <aside aria-label={dict.ads.label} className={`flex flex-col items-center gap-1 ${className}`}>
      <span className="text-[10px] tracking-widest uppercase opacity-40">{dict.ads.label}</span>
      {adsPreview() ? (
        <div className={`${box} rounded-lg border border-dashed border-current/25 text-xs opacity-40`}>{placement}</div>
      ) : (
        <div className={box}>
          <AdUnit client={adsenseClient()!} slot={adSlot(placement)!} fixed={placement === "sidebar"} />
        </div>
      )}
    </aside>
  );
}
