import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { ensureImageVariant, resolveUploadPath } from "@/lib/media";
import { VARIANT_WIDTHS } from "@/lib/image-variants";

const TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  // H.264 MOV dosyaları Chrome'da da oynasın diye MP4 olarak sunulur (kapsayıcı aynı ailedendir)
  ".mov": "video/mp4",
  ".webm": "video/webm",
};

const BASE_HEADERS = {
  // Dosya adları benzersiz olduğu için uzun süreli önbellek güvenli
  "Cache-Control": "public, max-age=31536000, immutable",
  "X-Content-Type-Options": "nosniff",
  "Accept-Ranges": "bytes",
};

function stream(file: string, start?: number, end?: number) {
  return Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream<Uint8Array>;
}

/**
 * Admin panelinden yüklenen görselleri ve videoları servis eder.
 * Videolar için Range (kısmi içerik) desteklenir; iPhone Safari bunu zorunlu tutar.
 */
export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const target = resolveUploadPath(segments);
  const type = target ? TYPES[path.extname(target).toLowerCase()] : undefined;
  if (!target || !type) return new Response("Bulunamadı", { status: 404 });

  let size: number;
  try {
    const info = await stat(target);
    if (!info.isFile()) return new Response("Bulunamadı", { status: 404 });
    size = info.size;
  } catch {
    return new Response("Bulunamadı", { status: 404 });
  }

  // ?w=800 → küçültülmüş kopya (yalnız izin verilen genişlikler; üretilemezse asıl dosya)
  const width = Number(new URL(req.url).searchParams.get("w"));
  if ((VARIANT_WIDTHS as readonly number[]).includes(width) && /\.(webp|jpe?g|png|avif)$/i.test(target)) {
    const variant = await ensureImageVariant(target, width);
    if (variant) {
      const info = await stat(variant);
      return new Response(stream(variant), {
        headers: { ...BASE_HEADERS, "Content-Type": "image/webp", "Content-Length": String(info.size) },
      });
    }
  }

  const range = req.headers.get("range");
  const match = range?.match(/^bytes=(\d*)-(\d*)$/);
  if (match && (match[1] || match[2])) {
    let start: number;
    let end: number;
    if (match[1]) {
      start = Number(match[1]);
      end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
    } else {
      // "bytes=-500" → son 500 bayt
      start = Math.max(0, size - Number(match[2]));
      end = size - 1;
    }
    if (start >= size || start > end) {
      return new Response(null, { status: 416, headers: { ...BASE_HEADERS, "Content-Range": `bytes */${size}` } });
    }
    return new Response(stream(target, start, end), {
      status: 206,
      headers: {
        ...BASE_HEADERS,
        "Content-Type": type,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${size}`,
      },
    });
  }

  return new Response(stream(target), {
    headers: { ...BASE_HEADERS, "Content-Type": type, "Content-Length": String(size) },
  });
}
