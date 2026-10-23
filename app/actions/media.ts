"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { adminAction, type ActionResult } from "@/lib/action";
import { deleteUploadFile, findMediaUsage, listBuiltinImages, type MediaUsage } from "@/lib/media";

export type MediaItem = {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  size: number;
  createdAt: string;
};

export type MediaLibrary = { uploads: MediaItem[]; builtin: string[] };

/** Görsel seçici için medya listesi */
export async function listMedia(): Promise<ActionResult<MediaLibrary>> {
  return adminAction(async () => {
    const [rows, builtin] = await Promise.all([
      prisma.media.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
      listBuiltinImages(),
    ]);
    return {
      ok: true,
      message: "",
      data: {
        uploads: rows.map((m) => ({
          id: m.id,
          url: m.url,
          originalName: m.originalName,
          mimeType: m.mimeType,
          alt: m.alt,
          width: m.width,
          height: m.height,
          size: m.size,
          createdAt: m.createdAt.toISOString(),
        })),
        builtin,
      },
    };
  });
}

export async function getMediaUsage(url: string): Promise<ActionResult<MediaUsage[]>> {
  return adminAction(async () => ({ ok: true, message: "", data: await findMediaUsage(url) }));
}

export async function updateMediaAlt(id: string, alt: string): Promise<ActionResult> {
  return adminAction(async () => {
    await prisma.media.update({ where: { id }, data: { alt: String(alt ?? "").trim().slice(0, 200) || null } });
    revalidatePath("/admin/media");
    return { ok: true, message: "Açıklama kaydedildi." };
  });
}

/** Dosyayı siler — sitede kullanılıyorsa silmeyi engeller */
export async function deleteMedia(id: string): Promise<ActionResult<MediaUsage[]>> {
  return adminAction(async () => {
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) return { ok: false, message: "Dosya bulunamadı." };
    const usage = await findMediaUsage(media.url);
    if (usage.length) {
      return {
        ok: false,
        message: `Bu dosya ${usage.length} yerde kullanılıyor. Önce oralardan kaldırın.`,
        data: usage,
      };
    }
    await prisma.media.delete({ where: { id } });
    await deleteUploadFile(media.url);
    revalidatePath("/admin/media");
    return { ok: true, message: "Dosya silindi." };
  });
}
