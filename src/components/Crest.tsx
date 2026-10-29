import type { Team } from "@/lib/football/types";

export function Crest({ team }: { team: Team }) {
  if (!team.logo) return <span className="size-5 shrink-0" />;
  // Crests come from each provider's CDN, so they are not run through next/image.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={team.logo} alt="" width={20} height={20} loading="lazy" className="size-5 shrink-0 object-contain" />;
}
