import { cache } from "react";
import { prisma } from "./prisma";

/** Yayındaki turları (opsiyonel kategori slug'ı ile) getirir */
export const getTours = cache(async (categorySlug?: string) => {
  return prisma.tour.findMany({
    where: {
      isPublished: true,
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    },
    include: { category: true },
    orderBy: [{ isFeatured: "desc" }, { departureDate: "asc" }],
  });
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

/** Rezervasyon formu için tur seçenekleri */
export const getTourOptions = cache(async () => {
  return prisma.tour.findMany({
    where: { isPublished: true },
    select: { id: true, title: true, slug: true },
    orderBy: { title: "asc" },
  });
});

export const getHotelsByCity = cache(async (city: string) => {
  return prisma.hotel.findMany({
    where: { isPublished: true, city },
    orderBy: { stars: "desc" },
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
