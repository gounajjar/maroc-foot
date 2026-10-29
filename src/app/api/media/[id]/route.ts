import { getImage } from "@/lib/posts/db";

// Pictures of the site's own posts, stored in the database. A picture never
// changes once uploaded (a new one gets a new number), so browsers keep it.
export async function GET(_req: Request, ctx: RouteContext<"/api/media/[id]">) {
  const { id } = await ctx.params;
  const image = await getImage(Number(id)).catch((err) => (console.error(err), null));
  if (!image) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
