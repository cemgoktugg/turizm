"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { leadSchema, LEAD_STATUSES } from "@/lib/validations";
import { adminAction, toFieldErrors, type ActionResult } from "@/lib/action";
import { activeTourWhere } from "@/lib/queries";
import { clientIp, registerHit, retryAfter } from "@/lib/rate-limit";

const LEAD_WINDOW = 10 * 60 * 1000; // 10 dakika
const LEAD_LIMIT = 5;

/** Ziyaretçi başvurusu / rezervasyon oluşturur (public) */
export async function createLead(input: unknown): Promise<ActionResult> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Lütfen formu kontrol edin.", fieldErrors: toFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  // Honeypot dolu ise sessizce başarılı gibi davran (spam)
  if (data.website) return { ok: true, message: "Başvurunuz alındı." };

  const key = `lead:${await clientIp()}`;
  if (retryAfter(key, LEAD_LIMIT, LEAD_WINDOW) > 0) {
    return {
      ok: false,
      message: "Kısa sürede çok sayıda başvuru gönderdiniz. Lütfen biraz sonra tekrar deneyin veya bizi arayın.",
    };
  }

  // Sadece kayıt alınabilen (yayında + tarihi geçmemiş) turlar kabul edilir
  let tourId: string | null = null;
  let tourTitle = data.tourTitle || null;
  if (data.tourId) {
    const tour = await prisma.tour.findFirst({
      where: activeTourWhere({ id: data.tourId }),
      select: { id: true, title: true },
    });
    if (tour) {
      tourId = tour.id;
      tourTitle = tour.title;
    }
  }

  await prisma.lead.create({
    data: {
      fullName: data.fullName,
      phone: data.phone,
      email: data.email || null,
      personCount: data.personCount ?? null,
      message: data.message?.trim() || null,
      source: data.source ?? null,
      tourId,
      tourTitle,
      status: "Yeni",
    },
  });
  registerHit(key);

  revalidatePath("/admin", "layout");
  return {
    ok: true,
    message: "Başvurunuz başarıyla alındı. En kısa sürede sizinle iletişime geçeceğiz.",
  };
}

/** Başvuru durumunu günceller (admin) */
export async function updateLeadStatus(id: string, status: string): Promise<ActionResult> {
  return adminAction(async () => {
    if (!(LEAD_STATUSES as readonly string[]).includes(status)) return { ok: false, message: "Geçersiz durum." };
    await prisma.lead.update({ where: { id }, data: { status } });
    revalidatePath("/admin", "layout");
    return { ok: true, message: `Durum "${status}" olarak güncellendi.` };
  });
}

/** Başvuruya iç not ekler (admin) */
export async function updateLeadNote(id: string, note: string): Promise<ActionResult> {
  return adminAction(async () => {
    const clean = String(note ?? "").trim().slice(0, 2000);
    await prisma.lead.update({ where: { id }, data: { note: clean || null } });
    revalidatePath("/admin/leads");
    return { ok: true, message: "Not kaydedildi." };
  });
}

/** Başvuru siler (admin) */
export async function deleteLead(id: string): Promise<ActionResult> {
  return adminAction(async () => {
    await prisma.lead.delete({ where: { id } });
    revalidatePath("/admin", "layout");
    return { ok: true, message: "Başvuru silindi." };
  });
}
