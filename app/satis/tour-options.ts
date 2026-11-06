import "server-only";
import { prisma } from "@/lib/prisma";
import { shortDate } from "@/lib/sales";
import type { SaleTourOption } from "@/components/admin/sales/sale-form";

/** Satış formundaki tur listesi: aktif turlar (+ düzenlenen satışın mevcut turu) */
export async function getSaleTourOptions(includeId?: number): Promise<SaleTourOption[]> {
  const tours = await prisma.serviceTour.findMany({
    where: includeId ? { OR: [{ isActive: true }, { id: includeId }] } : { isActive: true },
    orderBy: [{ departureDate: "desc" }, { name: "asc" }],
    select: { id: true, name: true, period: true, price2: true, price3: true, price4: true, currency: true, departureDate: true, isActive: true },
  });
  return tours.map(({ price2, price3, price4, departureDate, ...t }) => ({
    ...t,
    departure: shortDate(departureDate),
    // Oda kişi sayısı → kişi başı ücret (fiyatı girilmemiş oda tipleri yok)
    prices: Object.fromEntries(
      ([[2, price2], [3, price3], [4, price4]] as const).filter(([, p]) => p != null),
    ) as Record<number, number>,
  }));
}
