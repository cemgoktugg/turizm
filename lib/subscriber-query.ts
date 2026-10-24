import type { Prisma } from "@prisma/client";

/** Aboneler listesi ve dışa aktarma için ortak filtre */
export function buildSubscriberWhere({ tur, q }: { tur?: string; q?: string }): Prisma.SubscriberWhereInput {
  const term = q?.trim();
  const digits = term?.replace(/\D/g, "");
  return {
    ...(tur === "phone" || tur === "email" ? { type: tur } : {}),
    ...(term
      ? {
          OR: [
            { contact: { contains: term.toLowerCase() } },
            ...(digits && digits.length >= 3 ? [{ contact: { contains: digits.replace(/^0/, "") } }] : []),
            { fullName: { contains: term } },
          ],
        }
      : {}),
  };
}
