import "server-only";
import { prisma } from "@/lib/prisma";
import { shortDate } from "@/lib/sales";
import type { SaleTourOption } from "@/components/admin/sales/sale-form";

/** Satış formundaki tur listesi: aktif turlar (+ düzenlenen satışın mevcut turu) */
export async function getSaleTourOptions(includeId?: number): Promise<SaleTourOption[]> {
  const tours = await prisma.serviceTour.findMany({
    where: includeId ? { OR: [{ isActive: true }, { id: includeId }] } : { isActive: true },
    orderBy: [{ departureDate: "desc" }, { name: "asc" }],
    select: { id: true, name: true, period: true, price: true, currency: true, departureDate: true, isActive: true },
  });
  return tours.map((t) => ({ ...t, departure: shortDate(t.departureDate) }));
}
