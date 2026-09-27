import { readFile } from "node:fs/promises";
import path from "node:path";
import { resolveUploadPath } from "@/lib/media";

const TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

/** Admin panelinden yüklenen görselleri servis eder */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const target = resolveUploadPath(segments);
  const type = target ? TYPES[path.extname(target).toLowerCase()] : undefined;
  if (!target || !type) return new Response("Bulunamadı", { status: 404 });

  try {
    const data = await readFile(target);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": type,
        // Dosya adları benzersiz olduğu için uzun süreli önbellek güvenli
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Bulunamadı", { status: 404 });
  }
}
