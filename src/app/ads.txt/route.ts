import { adsenseClient } from "@/lib/ads";

// https://maroc-foot.com/ads.txt declares Google as an authorised seller of the
// site's ad space. AdSense warns, and earns less, when the file is missing.
export function GET() {
  const client = adsenseClient();
  if (!client) return new Response("Not found\n", { status: 404 });
  const publisher = client.replace(/^ca-/, "");
  return new Response(`google.com, ${publisher}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
