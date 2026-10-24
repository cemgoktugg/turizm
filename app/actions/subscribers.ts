"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { subscribeSchema } from "@/lib/validations";
import { normalizeContact } from "@/lib/subscribers";
import { getContent } from "@/lib/content";
import { adminAction, toFieldErrors, type ActionResult } from "@/lib/action";
import { clientIp, registerHit, retryAfter } from "@/lib/rate-limit";

const WINDOW = 10 * 60 * 1000; // 10 dakika
const LIMIT = 5;

/** Kampanya ve duyuru listesine kayıt (public) */
export async function subscribe(input: unknown): Promise<ActionResult> {
  const parsed = subscribeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Lütfen formu kontrol edin.", fieldErrors: toFieldErrors(parsed.error) };
  }
  const data = parsed.data;
  const texts = await getContent("shared.newsletter");

  // Honeypot dolu ise sessizce başarılı gibi davran (spam)
  if (data.website) return { ok: true, message: texts.success };

  const contact = normalizeContact(data.contact);
  if (!contact) {
    return {
      ok: false,
      message: "Lütfen formu kontrol edin.",
      fieldErrors: { contact: "Geçerli bir telefon numarası veya e-posta adresi yazın" },
    };
  }

  const key = `subscribe:${await clientIp()}`;
  if (retryAfter(key, LIMIT, WINDOW) > 0) {
    return { ok: false, message: "Kısa sürede çok sayıda deneme yapıldı. Lütfen biraz sonra tekrar deneyin." };
  }
  registerHit(key);

  const existing = await prisma.subscriber.findUnique({ where: { contact: contact.contact }, select: { id: true } });
  if (existing) return { ok: true, message: texts.already };

  await prisma.subscriber.create({
    data: {
      contact: contact.contact,
      type: contact.type,
      fullName: data.fullName || null,
      source: data.source?.slice(0, 200) || null,
    },
  });
  revalidatePath("/admin/subscribers");
  return { ok: true, message: texts.success };
}

/** Aboneyi listeden siler (admin) — onayını geri alan kişiler için */
export async function deleteSubscriber(id: string): Promise<ActionResult> {
  return adminAction(async () => {
    await prisma.subscriber.delete({ where: { id } });
    revalidatePath("/admin/subscribers");
    return { ok: true, message: "Abone listeden çıkarıldı." };
  });
}
