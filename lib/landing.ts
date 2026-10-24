import { cache } from "react";
import { prisma } from "./prisma";
import { activeTourWhere } from "./queries";
import { filterTours, parseTourFilters, sortTours, dominantCurrency, type SortKey, SORT_KEYS } from "./tour-search";
import type { TryRates } from "./currency";

/**
 * Sitede sabit sayfası olan kök adresler. Açılış sayfaları kök adreste
 * (ör. /sivas-umre) yayınlandığı için bu adlar kullanılamaz.
 */
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "uploads",
  "images",
  "blog",
  "cerez-politikasi",
  "ekibimiz",
  "gerekli-bilgiler",
  "hac",
  "hakkimizda",
  "iletisim",
  "iptal-ve-iade",
  "kvkk",
  "oteller",
  "rezervasyon",
  "sss",
  "turlar",
  "umre",
  "robots.txt",
  "sitemap.xml",
  "favicon.ico",
]);

export type LandingFaq = { question: string; answer: string };

export function parseFaqs(json: string | null | undefined): LandingFaq[] {
  if (!json) return [];
  try {
    const data: unknown = JSON.parse(json);
    if (!Array.isArray(data)) return [];
    return data
      .filter((f): f is LandingFaq => typeof f?.question === "string" && typeof f?.answer === "string")
      .map((f) => ({ question: f.question, answer: f.answer }));
  } catch {
    return [];
  }
}

export function splitCategories(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Yayındaki açılış sayfası */
export const getLandingBySlug = cache(async (slug: string) => {
  if (RESERVED_SLUGS.has(slug)) return null;
  return prisma.landingPage.findFirst({ where: { slug, isPublished: true } });
});

/** Açılış sayfasında listelenecek turlar (kategori + arama kelimesi + sıralama) */
export async function getLandingTours(
  page: { tourCategories: string | null; tourSearch: string | null; toursSort: string | null },
  rates: TryRates | null,
) {
  const categories = splitCategories(page.tourCategories);
  const tours = await prisma.tour.findMany({
    where: activeTourWhere(categories.length ? { category: { slug: { in: categories } } } : {}),
    include: { category: true },
  });
  const filters = parseTourFilters({ q: page.tourSearch ?? undefined });
  const sort: SortKey = (SORT_KEYS as readonly string[]).includes(page.toursSort ?? "") ? (page.toursSort as SortKey) : "onerilen";
  return sortTours(filterTours(tours, filters, rates, dominantCurrency(tours)), sort, rates);
}
