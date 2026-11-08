import { prisma } from "./prisma";

/**
 * Makbuz verisi. Tek tahsilatta bir satır, grup tahsilatında (aynı batchId)
 * kişi başına bir satır. Önceki ödemeler ve kalan, makbuzun kesildiği ana
 * göre (o tahsilat dahil, ondan önce girilen tahsilatlarla) hesaplanır; böylece
 * makbuz sonradan yeniden basıldığında da aynı rakamları gösterir.
 */
export async function getReceipt(paymentId: number) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, select: { id: true, batchId: true } });
  if (!payment) return null;

  const parts = await prisma.payment.findMany({
    where: payment.batchId ? { batchId: payment.batchId } : { id: payment.id },
    orderBy: { id: "asc" },
    include: {
      sale: {
        include: {
          customer: true,
          tour: { select: { id: true, name: true, period: true, departureDate: true, returnDate: true, days: true, currency: true } },
          group: { select: { id: true, name: true } },
          payments: { select: { id: true, amount: true } },
        },
      },
    },
  });
  if (parts.length === 0) return null;

  const lines = parts.map((p) => {
    const s = p.sale;
    const paidAfter = s.payments.filter((x) => x.id <= p.id).reduce((t, x) => t + x.amount, 0);
    return {
      paymentId: p.id,
      saleId: s.id,
      customer: { id: s.customer.id, fullName: s.customer.fullName, tc: s.customer.tc, phone: s.customer.phone },
      tour: s.tour,
      roomSize: s.roomSize,
      price: s.price,
      currency: s.tour.currency,
      isCancelled: s.isCancelled,
      amount: p.amount,
      /** Bu tahsilattan önce ödenen (iadeler düşülmüş) */
      previous: paidAfter - p.amount,
      paidAfter,
      /** Tahsilatta kalan borç; iadede hâlâ iade edilecek para */
      remaining: p.amount < 0 ? Math.max(paidAfter, 0) : s.price - paidAfter,
    };
  });

  const first = parts[0];
  const total = lines.reduce((t, l) => t + l.amount, 0);
  return {
    /** Makbuz numarası: tahsilatın (grupta ilk parçanın) sıra numarası */
    no: first.id,
    date: first.date,
    method: first.method,
    note: first.note,
    receivedByName: first.receivedByName,
    createdByName: first.createdByName,
    createdAt: first.createdAt,
    isRefund: total < 0,
    isGroup: Boolean(first.batchId),
    group: first.batchId ? first.sale.group : null,
    currency: first.sale.tour.currency,
    total,
    lines,
  };
}

export type ReceiptData = NonNullable<Awaited<ReturnType<typeof getReceipt>>>;
