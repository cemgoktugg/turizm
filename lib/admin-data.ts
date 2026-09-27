import "server-only";
import { prisma } from "./prisma";

/** Tur formu için kategori ve otel seçenekleri */
export async function getTourFormOptions() {
  const [categories, hotels] = await Promise.all([
    prisma.tourCategory.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
    prisma.hotel.findMany({ orderBy: { name: "asc" }, select: { name: true, city: true, distance: true } }),
  ]);
  return { categories, hotels };
}

/** Blog formu için mevcut kategori adları */
export async function getBlogCategories(): Promise<string[]> {
  const rows = await prisma.blogPost.findMany({
    where: { category: { not: null } },
    distinct: ["category"],
    select: { category: true },
  });
  const set = new Set(["Rehber", "Bilgi", "Hac", "Umre", ...rows.map((r) => r.category as string)]);
  return [...set].sort((a, b) => a.localeCompare(b, "tr"));
}

export function toDateInput(d?: Date | null): string {
  if (!d) return "";
  const date = new Date(d);
  // Form tarihleri "YYYY-MM-DD" olarak UTC gece yarısında saklanır; aynı günü geri ver
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
