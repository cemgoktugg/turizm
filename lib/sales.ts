import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { formatPrice } from "./utils";

/** Para birimine göre toplam (ör. { USD: 12500, TRY: 40000 }) */
export type Money = Record<string, number>;

export function addMoney(m: Money, currency: string, value: number) {
  m[currency] = (m[currency] ?? 0) + value;
}

/** Tutarı para birimi sembolüyle yazar (ör. $1.850) */
export function money(value: number, currency: string) {
  return formatPrice(value, currency, "—");
}

/** Birden çok para birimindeki toplamı tek satırda yazar ("$12.500 · ₺40.000") */
export function moneyList(m: Money) {
  const parts = Object.entries(m).map(([cur, v]) => money(v, cur));
  return parts.length ? parts.join(" · ") : "—";
}

/** 28.10.2026 */
export function shortDate(d: Date | string | null | undefined) {
  return d ? new Date(d).toLocaleDateString("tr-TR") : "";
}

/** <input type="date"> değeri (YYYY-MM-DD) */
export function inputDate(d: Date | string = new Date()) {
  return new Date(d).toISOString().slice(0, 10);
}

/** Satış listesinde ve raporlarda kullanılan dönemler (en yeni tur önce) */
export async function getPeriods(): Promise<string[]> {
  const rows = await prisma.serviceTour.findMany({ select: { period: true }, orderBy: { departureDate: "desc" } });
  return [...new Set(rows.map((r) => r.period))];
}

/** Satış listesi süzgeci: dönem + serbest arama (müşteri, T.C., telefon, tur, referans, satış no) */
export function buildSaleWhere({ donem, q }: { donem?: string; q?: string }): Prisma.SaleWhereInput {
  const term = q?.trim() ?? "";
  const or: Prisma.SaleWhereInput[] = [
    { customer: { fullName: { contains: term } } },
    { customer: { tc: { contains: term } } },
    { customer: { phone: { contains: term } } },
    { tour: { name: { contains: term } } },
    { reference: { contains: term } },
  ];
  if (/^\d{1,9}$/.test(term)) or.push({ id: Number(term) });
  return {
    ...(donem ? { tour: { period: donem } } : {}),
    ...(term ? { OR: or } : {}),
  };
}

const saleInclude = {
  tour: { select: { id: true, name: true, period: true, currency: true, departureDate: true, returnDate: true } },
  customer: { select: { id: true, fullName: true, tc: true, phone: true } },
  payments: { select: { amount: true } },
} satisfies Prisma.SaleInclude;

/** Satışları ödenen / kalan hesaplanmış olarak getirir (iptal edilenlerde kalan 0) */
export async function loadSales(where: Prisma.SaleWhereInput = {}) {
  const sales = await prisma.sale.findMany({ where, include: saleInclude, orderBy: { id: "desc" } });
  return sales.map(({ payments, ...s }) => {
    const paid = payments.reduce((t, p) => t + p.amount, 0);
    return { ...s, currency: s.tour.currency, paid, balance: s.isCancelled ? 0 : s.price - paid };
  });
}
export type SaleRow = Awaited<ReturnType<typeof loadSales>>[number];

export type Totals = { count: number; price: Money; paid: Money; balance: Money };

/** İptal edilmemiş satışların toplamları */
export function totalsOf(rows: SaleRow[]): Totals {
  const t: Totals = { count: 0, price: {}, paid: {}, balance: {} };
  for (const s of rows) {
    if (s.isCancelled) continue;
    t.count++;
    addMoney(t.price, s.currency, s.price);
    addMoney(t.paid, s.currency, s.paid);
    addMoney(t.balance, s.currency, s.balance);
  }
  return t;
}

/** Tek satış: tahsilatlarıyla birlikte */
export async function getSale(id: number) {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      tour: { include: { guide1: { select: { fullName: true } }, guide2: { select: { fullName: true } } } },
      customer: true,
      payments: { orderBy: [{ date: "asc" }, { id: "asc" }] },
    },
  });
  if (!sale) return null;
  const paid = sale.payments.reduce((t, p) => t + p.amount, 0);
  return { ...sale, currency: sale.tour.currency, paid, balance: sale.isCancelled ? 0 : sale.price - paid };
}

/* ------------------------------------------------------------------ */
/* Raporlar                                                             */
/* ------------------------------------------------------------------ */

export const REPORTS = {
  ozet: "Dönem Özeti",
  tur: "Tur Bazlı",
  borclu: "Borçlu Müşteriler",
  tahsilat: "Tahsilat Listesi",
} as const;
export type ReportKey = keyof typeof REPORTS;

/** Dönem + para birimi bazında satış adedi, ciro, tahsilat, alacak */
export function periodReport(rows: SaleRow[]) {
  const map = new Map<string, { period: string; currency: string; count: number; price: number; paid: number; balance: number }>();
  for (const s of rows) {
    if (s.isCancelled) continue;
    const key = `${s.tour.period}|${s.currency}`;
    const r = map.get(key) ?? { period: s.tour.period, currency: s.currency, count: 0, price: 0, paid: 0, balance: 0 };
    r.count++;
    r.price += s.price;
    r.paid += s.paid;
    r.balance += s.balance;
    map.set(key, r);
  }
  return [...map.values()];
}

/** Tur bazında satış adedi, ciro, tahsilat, alacak (satışı olmayan turlar da listelenir) */
export async function tourReport(donem?: string) {
  const [tours, rows] = await Promise.all([
    prisma.serviceTour.findMany({
      where: donem ? { period: donem } : {},
      orderBy: { departureDate: "desc" },
      select: { id: true, name: true, period: true, currency: true, departureDate: true, returnDate: true, isActive: true },
    }),
    loadSales(donem ? { tour: { period: donem } } : {}),
  ]);
  return tours.map((t) => {
    const sales = rows.filter((s) => s.tourId === t.id && !s.isCancelled);
    return {
      ...t,
      count: sales.length,
      price: sales.reduce((a, s) => a + s.price, 0),
      paid: sales.reduce((a, s) => a + s.paid, 0),
      balance: sales.reduce((a, s) => a + s.balance, 0),
    };
  });
}

/** Kalan borcu olan müşteriler (para birimi bazında, borcu büyük olan önce) */
export function debtorReport(rows: SaleRow[]) {
  const map = new Map<string, { customer: SaleRow["customer"]; currency: string; count: number; balance: number }>();
  for (const s of rows) {
    if (s.isCancelled || s.balance <= 0) continue;
    const key = `${s.customerId}|${s.currency}`;
    const r = map.get(key) ?? { customer: s.customer, currency: s.currency, count: 0, balance: 0 };
    r.count++;
    r.balance += s.balance;
    map.set(key, r);
  }
  return [...map.values()].sort((a, b) => b.balance - a.balance);
}

/** Tarih aralığındaki tahsilatlar (bitiş günü dahil) */
export async function paymentReport({ bas, bit, donem }: { bas?: string; bit?: string; donem?: string }) {
  const from = bas ? new Date(bas) : undefined;
  const to = bit ? new Date(new Date(bit).getTime() + 86_400_000) : undefined;
  const payments = await prisma.payment.findMany({
    where: {
      date: { ...(from && !Number.isNaN(from.getTime()) ? { gte: from } : {}), ...(to && !Number.isNaN(to.getTime()) ? { lt: to } : {}) },
      ...(donem ? { sale: { tour: { period: donem } } } : {}),
    },
    orderBy: [{ date: "desc" }, { id: "desc" }],
    include: {
      sale: {
        select: {
          id: true,
          customer: { select: { id: true, fullName: true } },
          tour: { select: { name: true, period: true, currency: true } },
        },
      },
    },
  });
  const total: Money = {};
  const byMethod: Record<string, Money> = {};
  for (const p of payments) {
    addMoney(total, p.sale.tour.currency, p.amount);
    addMoney((byMethod[p.method] ??= {}), p.sale.tour.currency, p.amount);
  }
  return { payments, total, byMethod };
}

/** Kontrol paneli için: iptal edilmemiş satışlardaki toplam alacak */
export async function totalReceivable(): Promise<Money> {
  return totalsOf(await loadSales({ isCancelled: false })).balance;
}
