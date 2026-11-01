import "server-only";
import { formatDateTime } from "./utils";
import {
  buildSaleWhere,
  debtorReport,
  loadSales,
  moneyList,
  paymentReport,
  periodReport,
  shortDate,
  totalsOf,
  tourReport,
  type Money,
} from "./sales";

/** Tutar hücresi: ekranda sembolle, CSV'de düz sayı olarak yazılır */
export type MoneyCell = { amount: number; currency: string };
export type Cell = string | number | null | undefined | MoneyCell;

export type ReportTable = {
  columns: { label: string; align?: "right" | "center" }[];
  rows: { cells: Cell[]; href?: string; muted?: boolean }[];
  /** Toplam satırı (para birimleri karışık olabileceğinden metin) */
  footer?: string[];
  /** Tablo üstündeki özet kutuları */
  summary?: { label: string; value: string; tone?: "green" | "red" }[];
};

export type ReportParams = { donem?: string; q?: string; bas?: string; bit?: string };

const m = (amount: number, currency: string): MoneyCell => ({ amount, currency });
const R = "right" as const;
const C = "center" as const;

export function isMoneyCell(c: Cell): c is MoneyCell {
  return typeof c === "object" && c !== null;
}

/** Excel'e aktarılan satış listesi (ekrandaki Satışlar tablosuyla aynı sütunlar) */
async function salesTable(p: ReportParams): Promise<ReportTable> {
  const sales = await loadSales(buildSaleWhere(p));
  const t = totalsOf(sales);
  return {
    columns: [
      { label: "Sıra No" },
      { label: "Tarih" },
      { label: "Dönem" },
      { label: "Tur ID" },
      { label: "Tur Adı" },
      { label: "Müşteri ID" },
      { label: "Müşteri Adı" },
      { label: "Açıklama" },
      { label: "Referans" },
      { label: "Oda Kişi Sayısı", align: C },
      { label: "Ücret", align: R },
      { label: "Ödenen", align: R },
      { label: "Kalan", align: R },
      { label: "Durum" },
      { label: "Kaydeden" },
      { label: "Kayıt Zamanı" },
    ],
    rows: sales.map((s) => ({
      href: `/admin/satis/${s.id}`,
      muted: s.isCancelled,
      cells: [
        s.id,
        shortDate(s.date),
        s.tour.period,
        s.tour.id,
        s.tour.name,
        s.customer.id,
        s.customer.fullName,
        s.note,
        s.reference,
        s.roomSize,
        m(s.price, s.currency),
        m(s.paid, s.currency),
        m(s.balance, s.currency),
        s.isCancelled ? "İptal" : s.balance > 0 ? "Borçlu" : "Ödendi",
        s.createdByName,
        formatDateTime(s.createdAt),
      ],
    })),
    footer: [`Toplam (${t.count} satış)`, "", "", "", "", "", "", "", "", "", moneyList(t.price), moneyList(t.paid), moneyList(t.balance), "", "", ""],
  };
}

async function summaryTable(p: ReportParams): Promise<ReportTable> {
  const sales = await loadSales(p.donem ? { tour: { period: p.donem } } : {});
  const t = totalsOf(sales);
  const rows = periodReport(sales);
  return {
    summary: [
      { label: "Satış adedi", value: String(t.count) },
      { label: "Toplam ciro", value: moneyList(t.price) },
      { label: "Tahsil edilen", value: moneyList(t.paid), tone: "green" },
      { label: "Kalan alacak", value: moneyList(t.balance), tone: "red" },
    ],
    columns: [
      { label: "Dönem" },
      { label: "Para Birimi" },
      { label: "Satış Adedi", align: C },
      { label: "Ciro", align: R },
      { label: "Tahsil Edilen", align: R },
      { label: "Kalan Alacak", align: R },
      { label: "Tahsilat Oranı", align: R },
    ],
    rows: rows.map((r) => ({
      href: `/admin/satis?donem=${encodeURIComponent(r.period)}`,
      cells: [
        r.period,
        r.currency,
        r.count,
        m(r.price, r.currency),
        m(r.paid, r.currency),
        m(r.balance, r.currency),
        r.price ? `%${Math.round((r.paid / r.price) * 100)}` : "—",
      ],
    })),
    footer: ["Toplam", "", String(t.count), moneyList(t.price), moneyList(t.paid), moneyList(t.balance), ""],
  };
}

async function tourTable(p: ReportParams): Promise<ReportTable> {
  const rows = await tourReport(p.donem);
  const price: Money = {};
  const paid: Money = {};
  const balance: Money = {};
  let count = 0;
  for (const r of rows) {
    count += r.count;
    price[r.currency] = (price[r.currency] ?? 0) + r.price;
    paid[r.currency] = (paid[r.currency] ?? 0) + r.paid;
    balance[r.currency] = (balance[r.currency] ?? 0) + r.balance;
  }
  return {
    columns: [
      { label: "Tur ID" },
      { label: "Tur Adı" },
      { label: "Dönem" },
      { label: "Gidiş – Dönüş" },
      { label: "Durum" },
      { label: "Satış Adedi", align: C },
      { label: "Ciro", align: R },
      { label: "Tahsil Edilen", align: R },
      { label: "Kalan Alacak", align: R },
    ],
    rows: rows.map((r) => ({
      href: `/admin/satis?donem=${encodeURIComponent(r.period)}&q=${encodeURIComponent(r.name)}`,
      muted: !r.isActive,
      cells: [
        r.id,
        r.name,
        r.period,
        `${shortDate(r.departureDate)} – ${shortDate(r.returnDate)}`,
        r.isActive ? "Aktif" : "Pasif",
        r.count,
        m(r.price, r.currency),
        m(r.paid, r.currency),
        m(r.balance, r.currency),
      ],
    })),
    footer: ["Toplam", "", "", "", "", String(count), moneyList(price), moneyList(paid), moneyList(balance)],
  };
}

async function debtorTable(p: ReportParams): Promise<ReportTable> {
  const rows = debtorReport(await loadSales(p.donem ? { tour: { period: p.donem } } : {}));
  const total: Money = {};
  for (const r of rows) total[r.currency] = (total[r.currency] ?? 0) + r.balance;
  return {
    summary: [
      { label: "Borçlu müşteri", value: String(new Set(rows.map((r) => r.customer.id)).size) },
      { label: "Toplam alacak", value: moneyList(total), tone: "red" },
    ],
    columns: [
      { label: "Müşteri ID" },
      { label: "Ad Soyad" },
      { label: "T.C." },
      { label: "Telefon" },
      { label: "Borçlu Satış", align: C },
      { label: "Kalan Borç", align: R },
    ],
    rows: rows.map((r) => ({
      href: `/admin/satis/musteriler/${r.customer.id}`,
      cells: [r.customer.id, r.customer.fullName, r.customer.tc, r.customer.phone, r.count, m(r.balance, r.currency)],
    })),
    footer: ["Toplam", "", "", "", "", moneyList(total)],
  };
}

async function paymentTable(p: ReportParams): Promise<ReportTable> {
  const { payments, total, byMethod } = await paymentReport(p);
  return {
    summary: [
      { label: "Tahsilat adedi", value: String(payments.length) },
      { label: "Toplam tahsilat", value: moneyList(total), tone: "green" },
      ...Object.entries(byMethod).map(([method, v]) => ({ label: method, value: moneyList(v) })),
    ],
    columns: [
      { label: "Sıra No" },
      { label: "Tarih" },
      { label: "Satış No" },
      { label: "Müşteri" },
      { label: "Tur" },
      { label: "Dönem" },
      { label: "Ödeme Şekli" },
      { label: "Açıklama" },
      { label: "Kaydeden" },
      { label: "Kayıt Zamanı" },
      { label: "Tutar", align: R },
    ],
    rows: payments.map((x) => ({
      href: `/admin/satis/${x.sale.id}`,
      cells: [
        x.id,
        shortDate(x.date),
        x.sale.id,
        x.sale.customer.fullName,
        x.sale.tour.name,
        x.sale.tour.period,
        x.method,
        x.note,
        x.createdByName,
        formatDateTime(x.createdAt),
        m(x.amount, x.sale.tour.currency),
      ],
    })),
    footer: ["Toplam", "", "", "", "", "", "", "", "", "", moneyList(total)],
  };
}

export const REPORT_BUILDERS = {
  satislar: salesTable,
  ozet: summaryTable,
  tur: tourTable,
  borclu: debtorTable,
  tahsilat: paymentTable,
} as const;
export type ReportName = keyof typeof REPORT_BUILDERS;

export function isReportName(v: string | undefined | null): v is ReportName {
  return !!v && Object.hasOwn(REPORT_BUILDERS, v);
}
