import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { formatPrice } from "./utils";
import { seatsLeft } from "./capacity";

/** Para birimine göre toplam (ör. { USD: 12500, TRY: 40000 }) */
export type Money = Record<string, number>;

export function addMoney(m: Money, currency: string, value: number) {
  m[currency] = (m[currency] ?? 0) + value;
}

/** Tutarı para birimi sembolüyle yazar (ör. $1.850) */
export function money(value: number, currency: string) {
  return value < 0 ? `-${formatPrice(-value, currency)}` : formatPrice(value, currency, "—");
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

/** Parayı alabilecek kişiler: panel kullanıcıları, görevliler ve doğrudan kasa */
export const KASA = "Kasa";
/** Kişisi kaydedilmemiş eski tahsilatlar bu adla raporlanır */
export const UNKNOWN_PERSON = "Belirtilmemiş";
export async function getCashPeople(): Promise<string[]> {
  const [users, staff] = await Promise.all([
    prisma.user.findMany({ select: { name: true }, orderBy: { createdAt: "asc" } }),
    prisma.staff.findMany({ select: { fullName: true }, orderBy: { fullName: "asc" } }),
  ]);
  return [...new Set([...users.map((u) => u.name), ...staff.map((s) => s.fullName), KASA])];
}

/** "Ahmet Bey", "AHMET  BEY" gibi yazımlar tek referans sayılır */
export function refKey(reference: string | null | undefined) {
  return cleanRef(reference).toLocaleLowerCase("tr");
}

function cleanRef(reference: string | null | undefined) {
  return (reference ?? "").trim().replace(/\s+/g, " ");
}

/** Daha önce girilmiş referanslar (formdaki öneri ve süzgeç listesi) */
export async function getReferences(): Promise<string[]> {
  const rows = await prisma.sale.findMany({ where: { reference: { not: null } }, select: { reference: true }, distinct: ["reference"] });
  const map = new Map<string, string>();
  for (const r of rows) if (refKey(r.reference) && !map.has(refKey(r.reference))) map.set(refKey(r.reference), cleanRef(r.reference));
  return [...map.values()].sort((a, b) => a.localeCompare(b, "tr"));
}

export const SALE_STATUSES = { borclu: "Borçlu", odendi: "Ödendi", iade: "İade bekleyen", iptal: "İptal" } as const;

export type SaleFilter = { donem?: string; q?: string; durum?: string; personel?: string; referans?: string };

/** Satış listesi süzgeci: dönem + personel + serbest arama (müşteri, T.C., telefon, tur, referans, satış no) */
export function buildSaleWhere({ donem, q, personel }: SaleFilter): Prisma.SaleWhereInput {
  const term = q?.trim() ?? "";
  const or: Prisma.SaleWhereInput[] = [
    { customer: { fullName: { contains: term } } },
    { customer: { tc: { contains: term } } },
    { customer: { phone: { contains: term } } },
    { tour: { name: { contains: term } } },
    { reference: { contains: term } },
    { group: { name: { contains: term } } },
  ];
  if (/^\d{1,9}$/.test(term)) or.push({ id: Number(term) });
  return {
    ...(donem ? { tour: { period: donem } } : {}),
    ...(term ? { OR: or } : {}),
    ...(personel ? { AND: [{ OR: [{ createdByName: personel }, { payments: { some: { receivedByName: personel } } }] }] } : {}),
  };
}

const saleInclude = {
  tour: { select: { id: true, name: true, period: true, currency: true, departureDate: true, returnDate: true } },
  customer: { select: { id: true, fullName: true, tc: true, phone: true } },
  group: { select: { id: true, name: true } },
  payments: { select: { id: true, date: true, amount: true }, orderBy: { id: "asc" } },
} satisfies Prisma.SaleInclude;

/** Satışları ödenen / kalan hesaplanmış olarak getirir (iptal edilenlerde kalan 0) */
export async function loadSales(where: Prisma.SaleWhereInput = {}) {
  const sales = await prisma.sale.findMany({ where, include: saleInclude, orderBy: { id: "desc" } });
  return sales.map(({ payments, ...s }) => {
    const paid = payments.reduce((t, p) => t + p.amount, 0);
    return {
      ...s,
      currency: s.tour.currency,
      paid,
      // Tahsilat / iade kaydı sayısı: kaydı olan satış silinemez
      paymentCount: payments.length,
      /** Makbuz menüsü için tahsilat / iade kayıtları (eskiden yeniye) */
      payments,
      balance: s.isCancelled ? 0 : s.price - paid,
      refundDue: s.isCancelled ? Math.max(paid, 0) : 0,
    };
  });
}
export type SaleRow = Awaited<ReturnType<typeof loadSales>>[number];

/** Satış listesi: hesaplanan durum ve yazımı farklı olabilen referans burada süzülür */
export async function loadSaleList(f: SaleFilter) {
  const rows = await loadSales(buildSaleWhere(f));
  const ref = refKey(f.referans);
  return rows.filter((s) => {
    if (ref && refKey(s.reference) !== ref) return false;
    switch (f.durum) {
      case "borclu":
        return s.balance > 0;
      case "odendi":
        return !s.isCancelled && s.balance <= 0;
      case "iade":
        return s.refundDue > 0;
      case "iptal":
        return s.isCancelled;
      default:
        return true;
    }
  });
}

export type Totals = { count: number; price: Money; paid: Money; balance: Money; refundDue: Money };

/** İptal edilmemiş satışların toplamları */
export function totalsOf(rows: SaleRow[]): Totals {
  const t: Totals = { count: 0, price: {}, paid: {}, balance: {}, refundDue: {} };
  for (const s of rows) {
    if (s.refundDue > 0) addMoney(t.refundDue, s.currency, s.refundDue);
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
      group: { select: { id: true, name: true, _count: { select: { sales: true } } } },
      payments: { orderBy: [{ date: "asc" }, { id: "asc" }] },
    },
  });
  if (!sale) return null;
  const paid = sale.payments.reduce((t, p) => t + p.amount, 0);
  return { ...sale, currency: sale.tour.currency, paid, balance: sale.isCancelled ? 0 : sale.price - paid, refundDue: sale.isCancelled ? Math.max(paid, 0) : 0 };
}

/* ------------------------------------------------------------------ */
/* Aile / grup                                                          */
/* ------------------------------------------------------------------ */

/** Grup: kişilerin satışları (ekleniş sırasıyla), toplamlar ve grup tahsilatları */
export async function getGroup(id: number) {
  const group = await prisma.saleGroup.findUnique({ where: { id } });
  if (!group) return null;
  const sales = (await loadSales({ groupId: id })).sort((a, b) => a.id - b.id);
  return { ...group, sales, totals: totalsOf(sales) };
}
export type GroupData = NonNullable<Awaited<ReturnType<typeof getGroup>>>;

/** Grup tahsilatları: aynı batchId'li parçalar tek satır (en yeni önce) */
export async function getGroupBatches(groupId: number) {
  const parts = await prisma.payment.findMany({
    where: { batchId: { not: null }, sale: { groupId } },
    orderBy: [{ date: "desc" }, { id: "desc" }],
    include: { sale: { select: { id: true, customer: { select: { fullName: true } }, tour: { select: { currency: true } } } } },
  });
  const map = new Map<string, { batchId: string; paymentId: number; date: Date; method: string; receivedByName: string | null; note: string | null; createdByName: string | null; currency: string; total: number; parts: { saleId: number; name: string; amount: number }[] }>();
  for (const p of parts) {
    const b = map.get(p.batchId!) ?? {
      batchId: p.batchId!,
      paymentId: p.id,
      date: p.date,
      method: p.method,
      receivedByName: p.receivedByName,
      note: p.note,
      createdByName: p.createdByName,
      currency: p.sale.tour.currency,
      total: 0,
      parts: [],
    };
    b.total += p.amount;
    b.parts.push({ saleId: p.sale.id, name: p.sale.customer.fullName, amount: p.amount });
    map.set(p.batchId!, b);
  }
  return [...map.values()];
}

/* ------------------------------------------------------------------ */
/* Raporlar                                                             */
/* ------------------------------------------------------------------ */

export const REPORTS = {
  ozet: "Dönem Özeti",
  tur: "Tur Bazlı",
  borclu: "Borçlu Müşteriler",
  tahsilat: "Tahsilat Listesi",
  personel: "Personel",
  referans: "Referans",
  indirim: "İndirimler",
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
      select: { id: true, name: true, period: true, currency: true, departureDate: true, returnDate: true, isActive: true, capacity: true },
    }),
    loadSales(donem ? { tour: { period: donem } } : {}),
  ]);
  return tours.map((t) => {
    const sales = rows.filter((s) => s.tourId === t.id && !s.isCancelled);
    return {
      ...t,
      count: sales.length,
      /** Boş yer (kontenjan girilmemişse null) */
      left: seatsLeft(t.capacity, sales.length),
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

/** Tarih aralığındaki tahsilat ve iadeler (bitiş günü dahil) */
export async function paymentReport({ bas, bit, donem, personel }: { bas?: string; bit?: string; donem?: string; personel?: string }) {
  const from = bas ? new Date(bas) : undefined;
  const to = bit ? new Date(new Date(bit).getTime() + 86_400_000) : undefined;
  const payments = await prisma.payment.findMany({
    where: {
      date: { ...(from && !Number.isNaN(from.getTime()) ? { gte: from } : {}), ...(to && !Number.isNaN(to.getTime()) ? { lt: to } : {}) },
      ...(donem ? { sale: { tour: { period: donem } } } : {}),
      ...(personel ? { receivedByName: personel === UNKNOWN_PERSON ? null : personel } : {}),
    },
    orderBy: [{ date: "desc" }, { id: "desc" }],
    include: {
      sale: {
        select: {
          id: true,
          isCancelled: true,
          customer: { select: { id: true, fullName: true } },
          tour: { select: { name: true, period: true, currency: true } },
        },
      },
    },
  });
  const total: Money = {};
  const collected: Money = {};
  const refunded: Money = {};
  const byMethod: Record<string, Money> = {};
  for (const p of payments) {
    const cur = p.sale.tour.currency;
    addMoney(total, cur, p.amount);
    if (p.amount < 0) addMoney(refunded, cur, -p.amount);
    else addMoney(collected, cur, p.amount);
    addMoney((byMethod[p.method] ??= {}), cur, p.amount);
  }
  return { payments, total, collected, refunded, byMethod };
}

/** Kişi başı tahsilat: ödeme şekline göre alınan, iade ve net (tarih aralığında) */
export async function personReport(f: { bas?: string; bit?: string; donem?: string }) {
  const { payments } = await paymentReport(f);
  const map = new Map<string, { person: string; currency: string; count: number; cash: number; transfer: number; card: number; collected: number; refunded: number }>();
  for (const p of payments) {
    const person = p.receivedByName ?? UNKNOWN_PERSON;
    const currency = p.sale.tour.currency;
    const key = `${person}|${currency}`;
    const r = map.get(key) ?? { person, currency, count: 0, cash: 0, transfer: 0, card: 0, collected: 0, refunded: 0 };
    if (p.amount < 0) r.refunded -= p.amount;
    else {
      r.count++;
      r.collected += p.amount;
      if (p.method === "Nakit") r.cash += p.amount;
      else if (p.method === "Havale") r.transfer += p.amount;
      else r.card += p.amount;
    }
    map.set(key, r);
  }
  return [...map.values()].sort((a, b) => b.collected - a.collected);
}

/** Referans başı satış adedi, ciro, tahsil edilen ve kalan (iptaller hariç) */
export function referenceReport(rows: SaleRow[]) {
  const map = new Map<string, { reference: string; currency: string; count: number; price: number; paid: number; balance: number }>();
  for (const s of rows) {
    if (s.isCancelled) continue;
    const key = `${refKey(s.reference)}|${s.currency}`;
    const r = map.get(key) ?? { reference: cleanRef(s.reference), currency: s.currency, count: 0, price: 0, paid: 0, balance: 0 };
    r.count++;
    r.price += s.price;
    r.paid += s.paid;
    r.balance += s.balance;
    map.set(key, r);
  }
  return [...map.values()].sort((a, b) => b.price - a.price);
}

/**
 * Kişilerin elindeki nakit: alınan nakit - nakit iade - kasaya teslim.
 * Havale ve kart doğrudan hesaba girdiğinden kişide kalmaz. Tarih süzgeci yoktur; bakiye baştan hesaplanır.
 */
export async function getCashRows() {
  const [payments, handovers] = await Promise.all([
    prisma.payment.findMany({ where: { method: "Nakit" }, select: { amount: true, receivedByName: true, sale: { select: { tour: { select: { currency: true } } } } } }),
    prisma.cashHandover.findMany({ select: { fromName: true, amount: true } }),
  ]);
  const map = new Map<string, { person: string; currency: string; received: number; refunded: number; handedOver: number; held: number }>();
  const row = (person: string, currency: string) => {
    const key = `${person}|${currency}`;
    const r = map.get(key) ?? { person, currency, received: 0, refunded: 0, handedOver: 0, held: 0 };
    map.set(key, r);
    return r;
  };
  for (const p of payments) {
    const r = row(p.receivedByName ?? UNKNOWN_PERSON, p.sale.tour.currency);
    if (p.amount < 0) r.refunded -= p.amount;
    else r.received += p.amount;
    r.held += p.amount;
  }
  for (const h of handovers) {
    const r = row(h.fromName, "USD");
    r.handedOver += h.amount;
    r.held -= h.amount;
  }
  return [...map.values()].sort((a, b) => b.held - a.held);
}

export function getHandovers() {
  return prisma.cashHandover.findMany({ orderBy: [{ date: "desc" }, { id: "desc" }], take: 200 });
}

/** Kontrol paneli için: iptal edilmemiş satışlardaki toplam alacak */
export async function totalReceivable(): Promise<Money> {
  return totalsOf(await loadSales({ isCancelled: false })).balance;
}
