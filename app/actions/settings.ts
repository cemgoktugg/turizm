"use server";

import { prisma } from "@/lib/prisma";
import { settingsSchema } from "@/lib/validations";
import { adminAction, invalid, type ActionResult } from "@/lib/action";
import { revalidateSite } from "@/lib/revalidate";

/** Site ayarlarını topluca günceller (upsert) */
export async function updateSettings(input: unknown): Promise<ActionResult> {
  return adminAction(async () => {
    const parsed = settingsSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    await prisma.$transaction(
      Object.entries(parsed.data).map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          create: { key, value: value ?? "" },
          update: { value: value ?? "" },
        }),
      ),
    );
    // Artık kullanılmayan eski anahtar (hero slaytları içerik yönetimine taşındı)
    await prisma.siteSetting.deleteMany({ where: { key: "heroSlides" } });

    revalidateSite();
    return { ok: true, message: "Ayarlar kaydedildi. Değişiklikler sitede yayında." };
  });
}
