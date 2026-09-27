import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

/** Bugünün başlangıcı (yerel saat) */
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Tarihi geçmiş mi? (tarihi olmayan turlar "açık tarihli" sayılır) */
export function isPastTour(departureDate: Date | string | null | undefined): boolean {
  if (!departureDate) return false;
  return new Date(departureDate) < startOfToday();
}

/**
 * Sitede listelenecek turlar: yayında + tarihi geçmemiş (veya tarihsiz).
 * Tarihi geçen turlar listelerden otomatik düşer; detay sayfası "tarihi geçti"
 * uyarısıyla erişilebilir kalır.
 */
export function activeTourWhere(extra: Prisma.TourWhereInput = {}): Prisma.TourWhereInput {
  return {
    ...extra,
    isPublished: true,
    OR: [{ departureDate: null }, { departureDate: { gte: startOfToday() } }],
  };
}

const listOrder: Prisma.TourOrderByWithRelationInput[] = [
  { isFeatured: "desc" },
  { departureDate: "asc" },
];

/** Yayındaki aktif turlar (opsiyonel kategori slug'ları ile) */
export const getTours = cache(async (categorySlugs?: string[], requireDate = false) => {
  const where = activeTourWhere(
    categorySlugs?.length ? { category: { slug: { in: categorySlugs } } } : {},
  );
  if (requireDate) where.departureDate = { not: null };
  return prisma.tour.findMany({ where, include: { category: true }, orderBy: listOrder });
});

/** Tek tur (tüm ilişkileriyle) */
export const getTourBySlug = cache(async (slug: string) => {
  return prisma.tour.findFirst({
    where: { slug, isPublished: true },
    include: {
      category: true,
      images: { orderBy: { order: "asc" } },
      prices: { orderBy: { order: "asc" } },
      dayPrograms: { orderBy: { dayNumber: "asc" } },
      faqs: { orderBy: { order: "asc" } },
    },
  });
});

/** Rezervasyon formu için tur seçenekleri (yalnızca kayıt alınabilen turlar) */
export const getTourOptions = cache(async () => {
  return prisma.tour.findMany({
    where: activeTourWhere(),
    select: { id: true, title: true, slug: true },
    orderBy: { title: "asc" },
  });
});

export const getHotelsByCity = cache(async (city: string) => {
  return prisma.hotel.findMany({
    where: { isPublished: true, city },
    orderBy: [{ stars: "desc" }, { name: "asc" }],
  });
});

export const getCertificates = cache(async () => {
  return prisma.documentCertificate.findMany({
    where: { isPublished: true },
    orderBy: { order: "asc" },
  });
});

export const getBlogPosts = cache(async () => {
  return prisma.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
  });
});

export const getBlogPostBySlug = cache(async (slug: string) => {
  return prisma.blogPost.findFirst({ where: { slug, isPublished: true } });
});
