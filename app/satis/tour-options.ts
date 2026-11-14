import "server-only";
import { prisma } from "@/lib/prisma";
import { shortDate } from "@/lib/sales";
import { childPriceMap } from "@/lib/sale-pricing";
import type { SaleTourOption } from "@/components/admin/sales/sale-form";

/** Satış formundaki tur listesi: aktif turlar (+ düzenlenen satışın mevcut turu) */
export async function getSaleTourOptions(includeId?: number): Promise<SaleTourOption[]> {
  const tours = await prisma.serviceTour.findMany({
    where: includeId ? { OR: [{ isActive: true }, { id: includeId }] } : { isActive: true },
    orderBy: [{ departureDate: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      period: true,
      price2: true,
      price3: true,
      price4: true,
      priceAge0to2: true,
      priceAge2to6: true,
      priceAge6to11: true,
      currency: true,
      departureDate: true,
      isActive: true,
      capacity: true,
      // Dolu yer: iptal edilmemiş satışlar
      _count: { select: { sales: { where: { isCancelled: false } } } },
    },
  });
  return tours.map(({ price2, price3, price4, priceAge0to2, priceAge2to6, priceAge6to11, departureDate, _count, ...t }) => ({
    ...t,
    // Yaş grubu → çocuk ücreti (girilmemiş yaş grupları yok)
    childPrices: childPriceMap({ priceAge0to2, priceAge2to6, priceAge6to11 }),
    departure: shortDate(departureDate),
    sold: _count.sales,
    // Oda kişi sayısı → kişi başı ücret (fiyatı girilmemiş oda tipleri yok)
    prices: Object.fromEntries(
      ([[2, price2], [3, price3], [4, price4]] as const).filter(([, p]) => p != null),
    ) as Record<number, number>,
  }));
}
