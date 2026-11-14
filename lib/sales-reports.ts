import "server-only";
import { formatDateTime } from "./utils";
import { SALES_BASE } from "./sales-base";
import { DISCOUNT_WARN_RATE, discountOf, percent } from "./sale-pricing";
import {
  addMoney,
  debtorReport,
  getKasa,
  loadSaleList,
  loadSales,
  moneyList,
  paymentReport,
  periodReport,
  personReport,
  referenceReport,
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

/** base: satır bağlantılarının adresi (/satis veya eski /admin/satis) */
export type ReportParams = { donem?: string; q?: string; bas?: string; bit?: string; durum?: string; personel?: string; referans?: string; base?: string };

const m = (amount: number, currency: string): MoneyCell => ({ amount, currency });
const R = "right" as const;
const C = "center" as const;

export function isMoneyCell(c: Cell): c is MoneyCell {
  return typeof c === "object" && c !== null;
}

/** Excel'e aktarılan satış listesi (ekrandaki Satışlar tablosuyla aynı sütunlar) */
async function salesTable(p: ReportParams): Promise<ReportTable> {
  const sales = await loadSaleList(p);
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
      { label: "Liste Fiyatı", align: R },
      { label: "İndirim", align: R },
      { label: "Ücret", align: R },
      { label: "Ödenen", align: R },
      { label: "Kalan", align: R },
      { label: "Durum" },
      { label: "Kaydeden" },
      { label: "Kayıt Zamanı" },
    ],
    rows: sales.map((s) => ({
      href: `${p.base ?? SALES_BASE}/${s.id}`,
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
        s.listPrice == null ? null : m(s.listPrice, s.currency),
        s.listPrice == null ? null : m(discountOf(s.listPrice, s.price)?.amount ?? 0, s.currency),
        m(s.price, s.currency),
        m(s.paid, s.currency),
        m(s.balance, s.currency),
        s.refundDue > 0 ? "İade bekliyor" : s.isCancelled ? "İptal" : s.balance > 0 ? "Borçlu" : "Ödendi",
        s.createdByName,
        formatDateTime(s.createdAt),
      ],
    })),
    footer: [`Toplam (${t.count} satış)`, "", "", "", "", "", "", "", "", "", "", "", moneyList(t.price), moneyList(t.paid), moneyList(t.balance), "", "", ""],
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
      ...(Object.keys(t.refundDue).length ? [{ label: "İade bekleyen", value: moneyList(t.refundDue), tone: "red" as const }] : []),
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
      href: `${p.base ?? SALES_BASE}?donem=${encodeURIComponent(r.period)}`,
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
  // Toplam kontenjan / boş yer yalnızca kontenjanı girilmiş turlardan
  let capacity = 0;
  let free = 0;
  for (const r of rows) {
    count += r.count;
    price[r.currency] = (price[r.currency] ?? 0) + r.price;
    paid[r.currency] = (paid[r.currency] ?? 0) + r.paid;
    balance[r.currency] = (balance[r.currency] ?? 0) + r.balance;
    if (r.capacity != null && r.left != null) {
      capacity += r.capacity;
      free += Math.max(r.left, 0);
    }
  }
  const hasCapacity = rows.some((r) => r.capacity != null);
  return {
    columns: [
      { label: "Tur ID" },
      { label: "Tur Adı" },
      { label: "Dönem" },
      { label: "Gidiş – Dönüş" },
      { label: "Durum" },
      { label: "Satış Adedi", align: C },
      { label: "Kontenjan", align: C },
      { label: "Boş Yer", align: C },
      { label: "Ciro", align: R },
      { label: "Tahsil Edilen", align: R },
      { label: "Kalan Alacak", align: R },
    ],
    rows: rows.map((r) => ({
      href: `${p.base ?? SALES_BASE}?donem=${encodeURIComponent(r.period)}&q=${encodeURIComponent(r.name)}`,
      muted: !r.isActive,
      cells: [
        r.id,
        r.name,
        r.period,
        `${shortDate(r.departureDate)} – ${shortDate(r.returnDate)}`,
        r.isActive ? "Aktif" : "Pasif",
        r.count,
        r.capacity ?? "—",
        r.left == null ? "—" : r.left <= 0 ? "Dolu" : r.left,
        m(r.price, r.currency),
        m(r.paid, r.currency),
        m(r.balance, r.currency),
      ],
    })),
    footer: [
      "Toplam",
      "",
      "",
      "",
      "",
      String(count),
      hasCapacity ? String(capacity) : "",
      hasCapacity ? String(free) : "",
      moneyList(price),
      moneyList(paid),
      moneyList(balance),
    ],
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
      href: `${p.base ?? SALES_BASE}/musteriler/${r.customer.id}`,
      cells: [r.customer.id, r.customer.fullName, r.customer.tc ?? "—", r.customer.phone ?? "—", r.count, m(r.balance, r.currency)],
    })),
    footer: ["Toplam", "", "", "", "", moneyList(total)],
  };
}

async function paymentTable(p: ReportParams): Promise<ReportTable> {
  const { payments, total, collected, refunded, byMethod } = await paymentReport(p);
  return {
    summary: [
      { label: "Tahsilat adedi", value: String(payments.filter((x) => x.amount > 0).length) },
      { label: "Toplam tahsilat", value: moneyList(collected), tone: "green" },
      ...(Object.keys(refunded).length
        ? [
            { label: "İade", value: moneyList(refunded), tone: "red" as const },
            { label: "Net", value: moneyList(total) },
          ]
        : []),
      ...Object.entries(byMethod).map(([method, v]) => ({ label: method, value: moneyList(v) })),
    ],
    columns: [
      { label: "Sıra No" },
      { label: "Tarih" },
      { label: "Satış No" },
      { label: "Müşteri" },
      { label: "Tur" },
      { label: "Dönem" },
      { label: "Tür" },
      { label: "Ödeme Şekli" },
      { label: "Parayı Alan / Veren" },
      { label: "Açıklama" },
      { label: "Kaydeden" },
      { label: "Kayıt Zamanı" },
      { label: "Tutar", align: R },
    ],
    rows: payments.map((x) => ({
      href: `${p.base ?? SALES_BASE}/${x.sale.id}`,
      cells: [
        x.id,
        shortDate(x.date),
        x.sale.id,
        x.sale.customer.fullName,
        x.sale.tour.name,
        x.sale.tour.period,
        x.amount < 0 ? "İade" : x.sale.isCancelled ? "Tahsilat (satış iptal)" : "Tahsilat",
        x.method,
        x.receivedByName,
        x.note,
        x.createdByName,
        formatDateTime(x.createdAt),
        m(x.amount, x.sale.tour.currency),
      ],
    })),
    footer: ["Net toplam", "", "", "", "", "", "", "", "", "", "", "", moneyList(total)],
  };
}

async function personTable(p: ReportParams): Promise<ReportTable> {
  const rows = await personReport(p);
  const collected: Money = {};
  const refunded: Money = {};
  for (const r of rows) {
    addMoney(collected, r.currency, r.collected);
    addMoney(refunded, r.currency, r.refunded);
  }
  return {
    summary: [
      { label: "Toplam tahsilat", value: moneyList(collected), tone: "green" },
      { label: "İade", value: moneyList(refunded), tone: "red" },
    ],
    columns: [
      { label: "Parayı Alan" },
      { label: "Tahsilat Adedi", align: C },
      { label: "Nakit", align: R },
      { label: "Havale", align: R },
      { label: "Kredi Kartı", align: R },
      { label: "Toplam Alınan", align: R },
      { label: "İade", align: R },
      { label: "Net", align: R },
    ],
    rows: rows.map((r) => ({
      href: `${p.base ?? SALES_BASE}/raporlar?${new URLSearchParams({ rapor: "tahsilat", personel: r.person, donem: p.donem ?? "", bas: p.bas ?? "", bit: p.bit ?? "" })}`,
      cells: [
        r.person,
        r.count,
        m(r.cash, r.currency),
        m(r.transfer, r.currency),
        m(r.card, r.currency),
        m(r.collected, r.currency),
        m(r.refunded, r.currency),
        m(r.collected - r.refunded, r.currency),
      ],
    })),
  };
}

async function referenceTable(p: ReportParams): Promise<ReportTable> {
  const rows = referenceReport(await loadSales(p.donem ? { tour: { period: p.donem } } : {}));
  const t = { price: {} as Money, paid: {} as Money, balance: {} as Money };
  let count = 0;
  for (const r of rows) {
    count += r.count;
    addMoney(t.price, r.currency, r.price);
    addMoney(t.paid, r.currency, r.paid);
    addMoney(t.balance, r.currency, r.balance);
  }
  return {
    columns: [
      { label: "Referans" },
      { label: "Satış Adedi", align: C },
      { label: "Ciro", align: R },
      { label: "Tahsil Edilen", align: R },
      { label: "Kalan", align: R },
    ],
    rows: rows.map((r) => ({
      href: r.reference ? `${p.base ?? SALES_BASE}?${new URLSearchParams({ referans: r.reference, donem: p.donem ?? "" })}` : undefined,
      cells: [r.reference || "Referanssız", r.count, m(r.price, r.currency), m(r.paid, r.currency), m(r.balance, r.currency)],
    })),
    footer: ["Toplam", String(count), moneyList(t.price), moneyList(t.paid), moneyList(t.balance)],
  };
}

/**
 * Pazarlık / indirim raporu: satışı kaydeden kişi bazında liste fiyatı ile
 * anlaşılan ücret farkı. Liste fiyatı kayıtlı olmayan (eski) satışlar dahil edilmez.
 */
async function discountTable(p: ReportParams): Promise<ReportTable> {
  const sales = (await loadSales(p.donem ? { tour: { period: p.donem } } : {})).filter((s) => !s.isCancelled && s.listPrice != null);
  type Row = { person: string; currency: string; count: number; discounted: number; warned: number; list: number; price: number; discount: number };
  const map = new Map<string, Row>();
  const total = { discount: {} as Money, discounted: 0, warned: 0 };
  for (const s of sales) {
    const person = s.createdByName || "Belirtilmemiş";
    const key = `${person}|${s.currency}`;
    const r = map.get(key) ?? { person, currency: s.currency, count: 0, discounted: 0, warned: 0, list: 0, price: 0, discount: 0 };
    const d = discountOf(s.listPrice, s.price);
    r.count++;
    r.list += s.listPrice!;
    r.price += s.price;
    if (d) {
      r.discounted++;
      r.discount += d.amount;
      total.discounted++;
      addMoney(total.discount, s.currency, d.amount);
      if (d.warn) {
        r.warned++;
        total.warned++;
      }
    }
    map.set(key, r);
  }
  const rows = [...map.values()].sort((a, b) => b.discount - a.discount);
  return {
    summary: [
      { label: "Liste fiyatlı satış", value: String(sales.length) },
      { label: "İndirimli satış", value: String(total.discounted) },
      { label: "Toplam indirim", value: moneyList(total.discount), tone: "red" },
      { label: `%${DISCOUNT_WARN_RATE * 100} üstü indirim`, value: String(total.warned), tone: total.warned ? "red" : undefined },
    ],
    columns: [
      { label: "Satışı Kaydeden" },
      { label: "Para Birimi" },
      { label: "Satış Adedi", align: C },
      { label: "İndirimli", align: C },
      { label: `%${DISCOUNT_WARN_RATE * 100} Üstü`, align: C },
      { label: "Liste Toplamı", align: R },
      { label: "Anlaşılan Toplam", align: R },
      { label: "Toplam İndirim", align: R },
      { label: "Ort. İndirim", align: R },
    ],
    rows: rows.map((r) => ({
      cells: [
        r.person,
        r.currency,
        r.count,
        r.discounted,
        r.warned,
        m(r.list, r.currency),
        m(r.price, r.currency),
        m(r.discount, r.currency),
        r.list ? percent(r.discount / r.list) : "—",
      ],
    })),
    footer: ["Toplam", "", String(sales.length), String(total.discounted), String(total.warned), "", "", moneyList(total.discount), ""],
  };
}

/** Kasa: ödeme şekline göre alınan, iade ve kasada kalan (Kasa sayfası ve Excel) */
async function cashTable(): Promise<ReportTable> {
  const kasa = await getKasa();
  return {
    summary: [
      { label: "Kasadaki toplam", value: moneyList(kasa.total), tone: "green" },
      { label: "Bugün giren", value: moneyList(kasa.today) },
      { label: "Bu ay giren", value: moneyList(kasa.month) },
    ],
    columns: [
      { label: "Ödeme Şekli" },
      { label: "Para Birimi" },
      { label: "Tahsilat Adedi", align: C },
      { label: "Alınan", align: R },
      { label: "İade", align: R },
      { label: "Kasada", align: R },
    ],
    rows: kasa.rows.map((r) => ({
      cells: [r.method, r.currency, r.count, m(r.collected, r.currency), m(r.refunded, r.currency), m(r.net, r.currency)],
    })),
    footer: ["Kasadaki toplam", "", "", "", "", moneyList(kasa.total)],
  };
}

export const REPORT_BUILDERS = {
  satislar: salesTable,
  ozet: summaryTable,
  tur: tourTable,
  borclu: debtorTable,
  tahsilat: paymentTable,
  personel: personTable,
  referans: referenceTable,
  indirim: discountTable,
  kasa: cashTable,
} as const;
export type ReportName = keyof typeof REPORT_BUILDERS;

export function isReportName(v: string | undefined | null): v is ReportName {
  return !!v && Object.hasOwn(REPORT_BUILDERS, v);
}
