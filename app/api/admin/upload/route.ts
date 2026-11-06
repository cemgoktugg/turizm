import { recordActivity } from "@/lib/activity";
import { getCurrentUser } from "@/lib/auth";
import { canManageSite } from "@/lib/roles";
import { saveUpload, UploadError, type SavedMedia, type UploadKind } from "@/lib/media";

const MAX_FILES = 20;

/**
 * Admin görsel / video yükleme uç noktası.
 * Server Action'lar varsayılan olarak 1 MB ile sınırlı olduğundan
 * yüklemeler Route Handler üzerinden yapılır.
 * Videolar yalnızca `kind=media` (hikayeler, medya kütüphanesi) ile kabul edilir.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Oturumunuz sona erdi. Lütfen tekrar giriş yapın." }, { status: 401 });
  if (!canManageSite(user.role)) return Response.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const kind: UploadKind = form.get("kind") === "media" ? "media" : "image";
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return Response.json({ error: "Dosya seçilmedi." }, { status: 400 });
  if (files.length > MAX_FILES)
    return Response.json({ error: `Tek seferde en fazla ${MAX_FILES} dosya yüklenebilir.` }, { status: 400 });

  const saved: SavedMedia[] = [];
  const errors: string[] = [];
  for (const file of files) {
    try {
      saved.push(await saveUpload(file, kind));
    } catch (e) {
      errors.push(e instanceof UploadError ? e.message : `"${file.name}" yüklenemedi.`);
      if (!(e instanceof UploadError)) console.error("[upload]", e);
    }
  }

  if (saved.length) await recordActivity(user, { detail: `${saved.length} dosya yüklendi` });
  return Response.json({ files: saved, errors }, { status: saved.length ? 200 : 400 });
}
