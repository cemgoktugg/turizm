import "server-only";
import path from "node:path";
import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { prisma } from "./prisma";
import { toSlug } from "./utils";
import { CONTENT_BLOCKS, isContentKey } from "./content/registry";
import type { MediaUsage, UploadKind } from "./media-types";

export type { MediaUsage, UploadKind } from "./media-types";

/**
 * Yüklenen dosyalar `public/` yerine `storage/uploads` altında tutulur ve
 * app/uploads/[...path]/route.ts ile servis edilir. (Production'da build
 * sonrası public/ klasörüne eklenen dosyalar servis edilmez.)
 */
export const UPLOAD_ROOT = path.join(process.cwd(), "storage", "uploads");
export const UPLOAD_URL_PREFIX = "/uploads/";
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB (görsel)
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB (video)
const MAX_DIMENSION = 2400;

type Detected = { mime: string; ext: string };

/** Dosya imzasından (magic bytes) gerçek türü tespit eder — uzantıya güvenmez */
function detectImage(buf: Buffer): Detected | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return { mime: "image/png", ext: "png" };
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP")
    return { mime: "image/webp", ext: "webp" };
  if (buf.subarray(0, 6).toString("ascii") === "GIF87a" || buf.subarray(0, 6).toString("ascii") === "GIF89a")
    return { mime: "image/gif", ext: "gif" };
  const brand = buf.subarray(4, 12).toString("ascii");
  if (brand === "ftypavif" || brand === "ftypavis") return { mime: "image/avif", ext: "avif" };
  return null;
}

/** MP4 / MOV (ISO-BMFF "ftyp" kutusu) ve WebM (EBML) videoları tanır */
function detectVideo(buf: Buffer): Detected | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return { mime: "video/webm", ext: "webm" };
  if (buf.subarray(4, 8).toString("ascii") !== "ftyp") return null;
  const brand = buf.subarray(8, 12).toString("ascii");
  // Aynı kapsayıcıyı kullanan görsel biçimleri (AVIF / HEIC) video sayılmaz
  if (/^(avi[fs]|hei[cxms]|hev[cx]|mif1|msf1)$/.test(brand)) return null;
  if (brand === "qt  ") return { mime: "video/quicktime", ext: "mov" };
  return { mime: "video/mp4", ext: "mp4" };
}

export class UploadError extends Error {}

export type SavedMedia = {
  id: string;
  url: string;
  originalName: string;
  width: number | null;
  height: number | null;
  size: number;
};

const mb = (bytes: number) => `${bytes / 1024 / 1024} MB`;

/**
 * Yüklenen dosyayı doğrular ve kaydeder. Görseller küçültülüp WEBP'ye çevrilir;
 * videolar (yalnızca kind="media") olduğu gibi saklanır.
 */
export async function saveUpload(file: File, kind: UploadKind = "image"): Promise<SavedMedia> {
  if (file.size === 0) throw new UploadError(`"${file.name}" boş bir dosya.`);
  if (file.size > (kind === "media" ? MAX_VIDEO_BYTES : MAX_UPLOAD_BYTES))
    throw new UploadError(`"${file.name}" çok büyük (en fazla ${mb(kind === "media" ? MAX_VIDEO_BYTES : MAX_UPLOAD_BYTES)}).`);

  const input = Buffer.from(await file.arrayBuffer());
  const detected = detectImage(input);
  const video = !detected && kind === "media" ? detectVideo(input) : null;
  if (!detected && !video)
    throw new UploadError(
      kind === "media"
        ? `"${file.name}" desteklenmeyen bir dosya. JPG, PNG, WEBP, GIF görsel veya MP4, MOV, WEBM video yükleyin.`
        : `"${file.name}" desteklenmeyen bir dosya. JPG, PNG, WEBP, GIF veya AVIF yükleyin.`,
    );
  if (detected && file.size > MAX_UPLOAD_BYTES)
    throw new UploadError(`"${file.name}" çok büyük (görseller en fazla ${mb(MAX_UPLOAD_BYTES)}).`);

  let output: Buffer;
  let ext: string;
  let mime: string;
  let width: number | null = null;
  let height: number | null = null;

  try {
    if (video) {
      // Sunucuda video dönüştürme yok; dosya olduğu gibi saklanır
      output = input;
      ext = video.ext;
      mime = video.mime;
    } else if (detected!.mime === "image/gif") {
      // Animasyonlu GIF'leri bozmamak için olduğu gibi saklanır
      const meta = await sharp(input, { animated: true }).metadata();
      output = input;
      ext = "gif";
      mime = "image/gif";
      width = meta.width ?? null;
      height = meta.pageHeight ?? meta.height ?? null;
    } else {
      const result = await sharp(input)
        .rotate() // EXIF yönünü uygula
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });
      output = result.data;
      width = result.info.width;
      height = result.info.height;
      ext = "webp";
      mime = "image/webp";
    }
  } catch {
    throw new UploadError(`"${file.name}" işlenemedi; dosya bozuk olabilir.`);
  }

  const now = new Date();
  const sub = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const base = toSlug(file.name.replace(/\.[^.]+$/, "")).slice(0, 60) || (video ? "video" : "gorsel");
  const fileName = `${base}-${randomBytes(4).toString("hex")}.${ext}`;
  const dir = path.join(UPLOAD_ROOT, sub);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), output);

  const url = `${UPLOAD_URL_PREFIX}${sub}/${fileName}`;
  const media = await prisma.media.create({
    data: {
      url,
      fileName,
      originalName: file.name.slice(0, 200),
      mimeType: mime,
      size: output.length,
      width,
      height,
    },
  });

  return { id: media.id, url, originalName: media.originalName, width, height, size: media.size };
}

/** URL'yi diskteki güvenli yola çevirir (dizin dışına çıkışı engeller) */
export function resolveUploadPath(segments: string[]): string | null {
  const joined = path.normalize(path.join(UPLOAD_ROOT, ...segments));
  if (!joined.startsWith(UPLOAD_ROOT + path.sep)) return null;
  return joined;
}

export async function deleteUploadFile(url: string) {
  if (!url.startsWith(UPLOAD_URL_PREFIX)) return;
  const target = resolveUploadPath(url.slice(UPLOAD_URL_PREFIX.length).split("/"));
  if (!target) return;
  await unlink(target).catch(() => undefined);
}

/** public/images altındaki hazır görseller (kütüphanede seçilebilir) */
export async function listBuiltinImages(): Promise<string[]> {
  try {
    const files = await readdir(path.join(process.cwd(), "public", "images"));
    return files
      .filter((f) => /\.(svg|png|jpe?g|webp|gif|avif)$/i.test(f))
      .sort()
      .map((f) => `/images/${f}`);
  } catch {
    return [];
  }
}


/** Bir görselin sitede nerelerde kullanıldığını bulur (silme öncesi kontrol) */
export async function findMediaUsage(url: string): Promise<MediaUsage[]> {
  const [tours, tourImages, tourHotels, stories, hotels, posts, certs, categories, settings, blocks] = await Promise.all([
    prisma.tour.findMany({ where: { coverImage: url }, select: { id: true, title: true } }),
    prisma.tourImage.findMany({ where: { url }, select: { tour: { select: { id: true, title: true } } } }),
    prisma.tourHotel.findMany({ where: { image: url }, select: { tour: { select: { id: true, title: true } } } }),
    prisma.story.findMany({
      where: { OR: [{ cover: url }, { items: { some: { url } } }] },
      select: { id: true, title: true },
    }),
    prisma.hotel.findMany({ where: { images: { contains: url } }, select: { id: true, name: true } }),
    prisma.blogPost.findMany({ where: { coverImage: url }, select: { id: true, title: true } }),
    prisma.documentCertificate.findMany({ where: { image: url }, select: { title: true } }),
    prisma.tourCategory.findMany({ where: { image: url }, select: { name: true } }),
    prisma.siteSetting.findMany({ where: { value: { contains: url } }, select: { key: true } }),
    prisma.contentBlock.findMany({ where: { data: { contains: url } }, select: { key: true } }),
  ]);

  const usage: MediaUsage[] = [];
  const seenTours = new Set<string>();
  for (const t of [...tours, ...tourImages.map((i) => i.tour), ...tourHotels.map((h) => h.tour)]) {
    if (seenTours.has(t.id)) continue;
    seenTours.add(t.id);
    usage.push({ label: `Tur: ${t.title}`, href: `/admin/tours/${t.id}/edit` });
  }
  for (const s of stories) usage.push({ label: `Hikaye: ${s.title}`, href: `/admin/stories/${s.id}/edit` });
  for (const h of hotels) usage.push({ label: `Otel: ${h.name}`, href: `/admin/hotels/${h.id}/edit` });
  for (const p of posts) usage.push({ label: `Blog: ${p.title}`, href: `/admin/blog/${p.id}/edit` });
  for (const c of certs) usage.push({ label: `Belge: ${c.title}`, href: "/admin/certificates" });
  for (const c of categories) usage.push({ label: `Kategori: ${c.name}`, href: "/admin/categories" });
  if (settings.length) usage.push({ label: "Site ayarları", href: "/admin/settings" });
  for (const b of blocks)
    usage.push({
      label: `Sayfa içeriği: ${isContentKey(b.key) ? CONTENT_BLOCKS[b.key].title : b.key}`,
      href: `/admin/content/${b.key}`,
    });
  return usage;
}
