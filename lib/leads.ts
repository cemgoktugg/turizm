import type { Prisma } from "@prisma/client";
import { LEAD_STATUSES } from "./validations";

/** Başvuru listesi ve CSV dışa aktarımında ortak filtre */
export function buildLeadWhere({ q, durum }: { q?: string; durum?: string }): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {};
  if (durum && (LEAD_STATUSES as readonly string[]).includes(durum)) where.status = durum;
  const term = q?.trim();
  if (term) {
    where.OR = [
      { fullName: { contains: term } },
      { phone: { contains: term } },
      { email: { contains: term } },
      { tourTitle: { contains: term } },
      { message: { contains: term } },
    ];
  }
  return where;
}
