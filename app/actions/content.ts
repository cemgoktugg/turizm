"use server";

import { prisma } from "@/lib/prisma";
import { adminAction, invalid, type ActionResult } from "@/lib/action";
import { revalidateSite } from "@/lib/revalidate";
import { schemaFromFields } from "@/lib/content/fields";
import { CONTENT_BLOCKS, isContentKey } from "@/lib/content/registry";

/** Sayfa içerik bloğunu kaydeder */
export async function saveContent(key: string, input: unknown): Promise<ActionResult> {
  return adminAction(async () => {
    if (!isContentKey(key)) return { ok: false, message: "Bilinmeyen içerik bloğu." };
    const parsed = schemaFromFields(CONTENT_BLOCKS[key].fields).safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const data = JSON.stringify(parsed.data);
    await prisma.contentBlock.upsert({ where: { key }, create: { key, data }, update: { data } });
    revalidateSite();
    return { ok: true, message: "İçerik kaydedildi. Değişiklikler sitede yayında." };
  });
}

/** Bloğu varsayılan içeriğe döndürür */
export async function resetContent(key: string): Promise<ActionResult> {
  return adminAction(async () => {
    if (!isContentKey(key)) return { ok: false, message: "Bilinmeyen içerik bloğu." };
    await prisma.contentBlock.deleteMany({ where: { key } });
    revalidateSite();
    return { ok: true, message: "İçerik varsayılan haline döndürüldü." };
  });
}
