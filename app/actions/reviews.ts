"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validations";
import { adminAction, toFieldErrors, type ActionResult } from "@/lib/action";
import { clientIp, registerHit, retryAfter } from "@/lib/rate-limit";
import { revalidateSite } from "@/lib/revalidate";

const REVIEW_WINDOW = 60 * 60 * 1000; // 1 saat
const REVIEW_LIMIT = 3;

/** Ziyaretçi değerlendirmesi gönderir (public). Panelden onaylanınca yayınlanır. */
export async function createReview(input: unknown): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Lütfen formu kontrol edin.", fieldErrors: toFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  // Honeypot dolu ise sessizce başarılı gibi davran (spam)
  if (data.website) return { ok: true, message: "Değerlendirmeniz alındı." };

  const key = `review:${await clientIp()}`;
  if (retryAfter(key, REVIEW_LIMIT, REVIEW_WINDOW) > 0) {
    return { ok: false, message: "Kısa sürede çok sayıda değerlendirme gönderdiniz. Lütfen daha sonra tekrar deneyin." };
  }

  const tour = await prisma.tour.findFirst({ where: { id: data.tourId, isPublished: true }, select: { id: true } });
  if (!tour) return { ok: false, message: "Tur bulunamadı." };

  await prisma.review.create({
    data: {
      tourId: tour.id,
      title: data.title || null,
      rating: data.rating,
      comment: data.comment,
      fullName: data.fullName,
      email: data.email,
    },
  });
  registerHit(key);

  revalidatePath("/admin", "layout");
  return { ok: true, message: "Değerlendirmeniz alındı. Onaylandıktan sonra yayınlanacak." };
}

/** Değerlendirmeyi yayınlar / yayından kaldırır (admin) */
export async function toggleReviewApproval(id: string): Promise<ActionResult> {
  return adminAction(async () => {
    const review = await prisma.review.findUnique({ where: { id }, select: { isApproved: true } });
    if (!review) return { ok: false, message: "Değerlendirme bulunamadı." };
    const next = !review.isApproved;
    await prisma.review.update({ where: { id }, data: { isApproved: next } });
    revalidateSite();
    return { ok: true, message: next ? "Değerlendirme yayınlandı." : "Değerlendirme yayından kaldırıldı." };
  });
}

/** Değerlendirmeyi siler (admin) */
export async function deleteReview(id: string): Promise<ActionResult> {
  return adminAction(async () => {
    await prisma.review.delete({ where: { id } });
    revalidateSite();
    return { ok: true, message: "Değerlendirme silindi." };
  });
}
