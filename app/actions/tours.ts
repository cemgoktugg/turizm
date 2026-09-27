"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { uniqueSlug } from "@/lib/slug";
import { adminTourSchema } from "@/lib/validations";
import type { ActionResult } from "./leads";

function toDate(v?: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Yetkisiz erişim.");
  return user;
}

function scalarData(data: Record<string, unknown>) {
  const d = data as Record<string, string | number | boolean | undefined>;
  return {
    title: d.title as string,
    shortDescription: (d.shortDescription as string) || null,
    description: (d.description as string) || null,
    categoryId: d.categoryId as string,
    departureDate: toDate(d.departureDate as string),
    returnDate: toDate(d.returnDate as string),
    durationDays: d.durationDays != null ? Number(d.durationDays) : null,
    durationNights: d.durationNights != null ? Number(d.durationNights) : null,
    departureCity: (d.departureCity as string) || null,
    airline: (d.airline as string) || null,
    makkahHotel: (d.makkahHotel as string) || null,
    madinahHotel: (d.madinahHotel as string) || null,
    makkahDistance: (d.makkahDistance as string) || null,
    madinahDistance: (d.madinahDistance as string) || null,
    startingPrice: d.startingPrice != null ? Number(d.startingPrice) : null,
    currency: (d.currency as string) || "USD",
    coverImage: (d.coverImage as string) || null,
    includedServices: (d.includedServices as string) || null,
    excludedServices: (d.excludedServices as string) || null,
    requiredDocuments: (d.requiredDocuments as string) || null,
    isFeatured: Boolean(d.isFeatured),
    isPublished: Boolean(d.isPublished),
    seoTitle: (d.seoTitle as string) || null,
    seoDescription: (d.seoDescription as string) || null,
  };
}

export async function createTour(input: unknown): Promise<ActionResult> {
  await assertAdmin();
  const parsed = adminTourSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  }
  const data = parsed.data;
  const slug = await uniqueSlug("tour", data.slug || data.title);
  const images = (data.images || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  await prisma.tour.create({
    data: {
      ...scalarData(data),
      slug,
      images: { create: images.map((url, i) => ({ url, order: i })) },
      prices: {
        create: (data.prices ?? []).map((p, i) => ({
          roomType: p.roomType,
          price: p.price,
          currency: data.currency || "USD",
          order: i,
        })),
      },
      dayPrograms: {
        create: (data.dayPrograms ?? []).map((p) => ({
          dayNumber: p.dayNumber,
          title: p.title,
          description: p.description,
        })),
      },
      faqs: {
        create: (data.faqs ?? []).map((f, i) => ({
          question: f.question,
          answer: f.answer,
          order: i,
        })),
      },
    },
  });

  revalidatePath("/admin/tours");
  revalidatePath("/turlar");
  revalidatePath("/");
  return { ok: true, message: "Tur oluşturuldu." };
}

export async function updateTour(id: string, input: unknown): Promise<ActionResult> {
  await assertAdmin();
  const parsed = adminTourSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  }
  const data = parsed.data;
  const slug = await uniqueSlug("tour", data.slug || data.title, id);
  const images = (data.images || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  await prisma.$transaction([
    prisma.tourImage.deleteMany({ where: { tourId: id } }),
    prisma.tourPrice.deleteMany({ where: { tourId: id } }),
    prisma.tourDayProgram.deleteMany({ where: { tourId: id } }),
    prisma.fAQ.deleteMany({ where: { tourId: id } }),
    prisma.tour.update({
      where: { id },
      data: {
        ...scalarData(data),
        slug,
        images: { create: images.map((url, i) => ({ url, order: i })) },
        prices: {
          create: (data.prices ?? []).map((p, i) => ({
            roomType: p.roomType,
            price: p.price,
            currency: data.currency || "USD",
            order: i,
          })),
        },
        dayPrograms: {
          create: (data.dayPrograms ?? []).map((p) => ({
            dayNumber: p.dayNumber,
            title: p.title,
            description: p.description,
          })),
        },
        faqs: {
          create: (data.faqs ?? []).map((f, i) => ({
            question: f.question,
            answer: f.answer,
            order: i,
          })),
        },
      },
    }),
  ]);

  revalidatePath("/admin/tours");
  revalidatePath(`/turlar/${slug}`);
  revalidatePath("/turlar");
  revalidatePath("/");
  return { ok: true, message: "Tur güncellendi." };
}

export async function deleteTour(id: string): Promise<ActionResult> {
  await assertAdmin();
  await prisma.tour.delete({ where: { id } });
  revalidatePath("/admin/tours");
  revalidatePath("/turlar");
  return { ok: true, message: "Tur silindi." };
}

/** Yayın / öne çıkarma durumunu değiştirir */
export async function toggleTourFlag(
  id: string,
  field: "isPublished" | "isFeatured",
): Promise<ActionResult> {
  await assertAdmin();
  const tour = await prisma.tour.findUnique({
    where: { id },
    select: { isPublished: true, isFeatured: true },
  });
  if (!tour) return { ok: false, message: "Tur bulunamadı." };
  await prisma.tour.update({
    where: { id },
    data: { [field]: !tour[field] },
  });
  revalidatePath("/admin/tours");
  revalidatePath("/turlar");
  revalidatePath("/");
  return { ok: true, message: "Güncellendi." };
}
