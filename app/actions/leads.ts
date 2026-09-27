"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { leadSchema, LEAD_STATUSES } from "@/lib/validations";
import { getCurrentUser } from "@/lib/auth";

export type ActionResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};

/** Ziyaretçi başvurusu / rezervasyon oluşturur (public) */
export async function createLead(
  input: unknown,
): Promise<ActionResult> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { ok: false, message: "Lütfen formu kontrol edin.", fieldErrors };
  }

  const data = parsed.data;

  // Honeypot dolu ise sessizce başarılı gibi davran (spam)
  if (data.website) {
    return { ok: true, message: "Başvurunuz alındı." };
  }

  let tourTitle = data.tourTitle;
  if (data.tourId) {
    const tour = await prisma.tour.findUnique({
      where: { id: data.tourId },
      select: { title: true },
    });
    tourTitle = tour?.title ?? tourTitle;
  }

  await prisma.lead.create({
    data: {
      fullName: data.fullName,
      phone: data.phone,
      email: data.email || null,
      personCount: data.personCount ?? null,
      message: data.message || null,
      tourId: data.tourId || null,
      tourTitle: tourTitle || null,
      status: "Yeni",
    },
  });

  revalidatePath("/admin/leads");

  return {
    ok: true,
    message: "Başvurunuz başarıyla alındı. En kısa sürede sizinle iletişime geçeceğiz.",
  };
}

/** Başvuru durumunu günceller (admin) */
export async function updateLeadStatus(id: string, status: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Yetkisiz." };
  if (!LEAD_STATUSES.includes(status as (typeof LEAD_STATUSES)[number])) {
    return { ok: false, message: "Geçersiz durum." };
  }
  await prisma.lead.update({ where: { id }, data: { status } });
  revalidatePath("/admin/leads");
  return { ok: true, message: "Durum güncellendi." };
}

/** Başvuru siler (admin) */
export async function deleteLead(id: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Yetkisiz." };
  await prisma.lead.delete({ where: { id } });
  revalidatePath("/admin/leads");
  return { ok: true, message: "Başvuru silindi." };
}
