"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { ActionResult } from "./leads";

const ALLOWED_KEYS = [
  "siteName",
  "tagline",
  "phone",
  "whatsapp",
  "email",
  "address",
  "workingHours",
  "facebook",
  "instagram",
  "youtube",
  "twitter",
  "logo",
  "mapEmbed",
  "footerNote",
  "heroSlides",
];

/** Site ayarlarını topluca günceller (upsert) */
export async function updateSettings(
  input: Record<string, string>,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Yetkisiz erişim." };

  const entries = Object.entries(input).filter(([key]) =>
    ALLOWED_KEYS.includes(key),
  );

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        create: { key, value: value ?? "" },
        update: { value: value ?? "" },
      }),
    ),
  );

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return { ok: true, message: "Ayarlar kaydedildi." };
}
