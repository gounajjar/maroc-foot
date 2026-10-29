import { isAdmin } from "@/lib/admin";
import { hasDatabase } from "@/lib/articles/db";
import { saveImage } from "@/lib/posts/db";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 3 * 1024 * 1024;

// Upload of a post picture from the admin editor, which shrinks it first.
export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Session expirée : reconnectez-vous." }, { status: 401 });
  if (!hasDatabase()) return Response.json({ error: "La base de données n'est pas branchée." }, { status: 503 });
  const file = (await request.formData()).get("file");
  if (!(file instanceof File) || !TYPES.includes(file.type)) {
    return Response.json({ error: "Choisissez une image JPEG, PNG ou WebP." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) return Response.json({ error: "Image trop lourde (3 Mo maximum)." }, { status: 413 });
  const id = await saveImage(file.type, Buffer.from(await file.arrayBuffer()));
  return Response.json({ id });
}
