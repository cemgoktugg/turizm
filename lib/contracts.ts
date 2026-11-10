import { prisma } from "./prisma";

/** Satışın umre sözleşmesi için gereken bilgileri (müşteri, tur, ücret) */
export async function getContract(saleId: number) {
  return prisma.sale.findUnique({
    where: { id: saleId },
    select: {
      id: true,
      date: true,
      price: true,
      roomSize: true,
      isCancelled: true,
      customer: { select: { fullName: true, tc: true, phone: true } },
      tour: {
        select: { name: true, period: true, departureDate: true, returnDate: true, days: true, currency: true, accommodation: true },
      },
      group: { select: { id: true, name: true } },
    },
  });
}

export type ContractData = NonNullable<Awaited<ReturnType<typeof getContract>>>;
