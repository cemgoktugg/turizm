"use server";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { recordActivity, type AuditEntry } from "@/lib/activity";
import type { CurrentUser } from "@/lib/auth";
import { splitProportional } from "@/lib/split";
import { discountOf, listPriceOf, percent, tourPriceMap } from "@/lib/sale-pricing";
import { ADMIN_ONLY, salesAction, invalid, type ActionResult } from "@/lib/action";
import { getCashPeople, getCashRows, money, shortDate } from "@/lib/sales";
import {
  customerSchema,
  groupPaymentSchema,
  groupSaleSchema,
  groupSchema,
  handoverSchema,
  paymentSchema,
  saleSchema,
  serviceTourSchema,
  staffSchema,
  type CustomerInput,
  type ServiceTourInput,
  type StaffInput,
} from "@/lib/validations";

/** Listelerden gelen metin kimliği sayıya çevirir */
function toId(id: string | number): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

const notFound = { ok: false, message: "Kayıt bulunamadı; silinmiş olabilir. Sayfayı yenileyin." } as const;

async function paidOf(saleId: number) {
  const agg = await prisma.payment.aggregate({ where: { saleId }, _sum: { amount: true } });
  return agg._sum.amount ?? 0;
}

/* ------------------------------------------------------------------ */
/* Görevliler                                                           */
/* ------------------------------------------------------------------ */

function staffData(d: StaffInput) {
  return { fullName: d.fullName, tc: d.tc || null, phone: d.phone, note: d.note || null };
}

export async function createStaff(input: unknown): Promise<ActionResult> {
  return salesAction(async (_me, audit) => {
    const parsed = staffSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const s = await prisma.staff.create({ data: staffData(parsed.data) });
    audit({ entity: "Staff", entityId: s.id, detail: `Görevli #${s.id} ${s.fullName} eklendi` });
    return { ok: true, message: "Görevli eklendi." };
  });
}

export async function updateStaff(id: string, input: unknown): Promise<ActionResult> {
  return salesAction(async (_me, audit) => {
    const staffId = toId(id);
    if (!staffId) return notFound;
    const parsed = staffSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const s = await prisma.staff.update({ where: { id: staffId }, data: staffData(parsed.data) });
    audit({ entity: "Staff", entityId: s.id, detail: `Görevli #${s.id} ${s.fullName} güncellendi` });
    return { ok: true, message: "Görevli güncellendi." };
  });
}

export async function deleteStaff(id: string): Promise<ActionResult> {
  return salesAction(async (_me, audit) => {
    const staffId = toId(id);
    if (!staffId) return notFound;
    const used = await prisma.serviceTour.count({ where: { OR: [{ guide1Id: staffId }, { guide2Id: staffId }] } });
    if (used) return { ok: false, message: `Bu görevli ${used} turda atanmış; önce turlardan çıkarın.` };
    const s = await prisma.staff.delete({ where: { id: staffId } });
    audit({ entity: "Staff", detail: `Görevli #${s.id} ${s.fullName} silindi` });
    return { ok: true, message: "Görevli silindi." };
  });
}

/* ------------------------------------------------------------------ */
/* Müşteriler                                                           */
/* ------------------------------------------------------------------ */

export type CustomerOption = { id: number; fullName: string; tc: string | null; phone: string | null };

function customerData(d: CustomerInput) {
  return { fullName: d.fullName, tc: d.tc || null, phone: d.phone || null, note: d.note || null };
}

async function tcTaken(tc: string | undefined, exceptId?: number) {
  if (!tc) return null;
  const other = await prisma.customer.findUnique({ where: { tc }, select: { id: true, fullName: true } });
  return other && other.id !== exceptId ? other : null;
}

export async function createCustomer(input: unknown): Promise<ActionResult<CustomerOption>> {
  return salesAction(async (_me, audit) => {
    const parsed = customerSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const other = await tcTaken(parsed.data.tc);
    if (other)
      return {
        ok: false,
        message: `Bu T.C. ile kayıtlı müşteri var: #${other.id} ${other.fullName}`,
        fieldErrors: { tc: "Bu T.C. ile kayıtlı müşteri var" },
      };
    const c = await prisma.customer.create({ data: customerData(parsed.data) });
    audit({ entity: "Customer", entityId: c.id, detail: `Müşteri #${c.id} ${c.fullName} eklendi` });
    return { ok: true, message: "Müşteri eklendi.", data: { id: c.id, fullName: c.fullName, tc: c.tc, phone: c.phone } };
  });
}

export async function updateCustomer(id: string, input: unknown): Promise<ActionResult> {
  return salesAction(async (_me, audit) => {
    const customerId = toId(id);
    if (!customerId) return notFound;
    const parsed = customerSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const other = await tcTaken(parsed.data.tc, customerId);
    if (other)
      return {
        ok: false,
        message: `Bu T.C. ile kayıtlı başka müşteri var: #${other.id} ${other.fullName}`,
        fieldErrors: { tc: "Bu T.C. ile kayıtlı müşteri var" },
      };
    const c = await prisma.customer.update({ where: { id: customerId }, data: customerData(parsed.data) });
    audit({ entity: "Customer", entityId: c.id, detail: `Müşteri #${c.id} ${c.fullName} güncellendi` });
    return { ok: true, message: "Müşteri güncellendi." };
  });
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  return salesAction(async (_me, audit) => {
    const customerId = toId(id);
    if (!customerId) return notFound;
    const sales = await prisma.sale.count({ where: { customerId } });
    if (sales) return { ok: false, message: `Bu müşterinin ${sales} satışı var; silinemez.` };
    const c = await prisma.customer.delete({ where: { id: customerId } });
    audit({ entity: "Customer", detail: `Müşteri #${c.id} ${c.fullName} silindi` });
    return { ok: true, message: "Müşteri silindi." };
  });
}

/** Satış formundaki müşteri araması (ad, T.C., telefon veya müşteri no) */
export async function searchCustomers(q: string): Promise<ActionResult<CustomerOption[]>> {
  return salesAction(async () => {
    const term = String(q ?? "").trim().slice(0, 50);
    if (term.length < 2 && !/^\d+$/.test(term)) return { ok: true, message: "", data: [] };
    const rows = await prisma.customer.findMany({
      where: {
        OR: [
          { fullName: { contains: term } },
          { tc: { startsWith: term } },
          { phone: { contains: term } },
          ...(/^\d{1,9}$/.test(term) ? [{ id: Number(term) }] : []),
        ],
      },
      orderBy: { fullName: "asc" },
      take: 10,
      select: { id: true, fullName: true, tc: true, phone: true },
    });
    return { ok: true, message: "", data: rows };
  });
}

/* ------------------------------------------------------------------ */
/* Turlar                                                               */
/* ------------------------------------------------------------------ */

function tourData(d: ServiceTourInput) {
  return {
    name: d.name,
    period: d.period,
    departureDate: new Date(d.departureDate),
    returnDate: new Date(d.returnDate),
    price2: d.price2 ?? null,
    price3: d.price3 ?? null,
    price4: d.price4 ?? null,
    accommodation: d.accommodation || null,
    guide1Id: d.guide1Id,
    guide2Id: d.guide2Id ?? null,
    days: d.days,
    note: d.note || null,
    isActive: d.isActive,
  };
}

export async function createServiceTour(input: unknown): Promise<ActionResult> {
  return salesAction(async (_me, audit) => {
    const parsed = serviceTourSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const t = await prisma.serviceTour.create({ data: tourData(parsed.data) });
    audit({ entity: "ServiceTour", entityId: t.id, detail: `Tur #${t.id} ${t.name} eklendi` });
    return { ok: true, message: "Tur eklendi." };
  });
}

export async function updateServiceTour(id: string, input: unknown): Promise<ActionResult> {
  return salesAction(async (_me, audit) => {
    const tourId = toId(id);
    if (!tourId) return notFound;
    const parsed = serviceTourSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const t = await prisma.serviceTour.update({ where: { id: tourId }, data: tourData(parsed.data) });
    audit({ entity: "ServiceTour", entityId: t.id, detail: `Tur #${t.id} ${t.name} güncellendi` });
    return { ok: true, message: "Tur güncellendi." };
  });
}

export async function deleteServiceTour(id: string): Promise<ActionResult> {
  return salesAction(async (_me, audit) => {
    const tourId = toId(id);
    if (!tourId) return notFound;
    const sales = await prisma.sale.count({ where: { tourId } });
    if (sales) return { ok: false, message: `Bu turun ${sales} satışı var; silmek yerine pasif yapın.` };
    const t = await prisma.serviceTour.delete({ where: { id: tourId } });
    audit({ entity: "ServiceTour", detail: `Tur #${t.id} ${t.name} silindi` });
    return { ok: true, message: "Tur silindi." };
  });
}

export async function toggleServiceTour(id: string): Promise<ActionResult> {
  return salesAction(async (_me, audit) => {
    const tourId = toId(id);
    if (!tourId) return notFound;
    const tour = await prisma.serviceTour.findUnique({ where: { id: tourId }, select: { isActive: true, name: true } });
    if (!tour) return notFound;
    await prisma.serviceTour.update({ where: { id: tourId }, data: { isActive: !tour.isActive } });
    audit({ entity: "ServiceTour", entityId: tourId, detail: `Tur #${tourId} ${tour.name} ${tour.isActive ? "pasif" : "aktif"} yapıldı` });
    return { ok: true, message: tour.isActive ? "Tur pasif yapıldı; yeni satışta listelenmez." : "Tur aktif yapıldı." };
  });
}

/* ------------------------------------------------------------------ */
/* Satışlar                                                             */
/* ------------------------------------------------------------------ */

/** İşlem geçmişi için eski → yeni değerler ("Ücret: $1.000 → $1.200; Oda: 2 → 3") */
function saleChanges(rows: [string, string | number | null | undefined, string | number | null | undefined][]) {
  return rows
    .filter(([, a, b]) => (a || "") !== (b || ""))
    .map(([label, a, b]) => `${label}: ${a || "—"} → ${b || "—"}`)
    .join("; ");
}

const tourPriceSelect = { price2: true, price3: true, price4: true } as const;

/** İşlem geçmişi için ", liste $1.690, indirim $140 (%8,3)" */
function discountNote(listPrice: number | null, price: number, currency: string) {
  const d = discountOf(listPrice, price);
  return d ? `, liste ${money(listPrice!, currency)}, indirim ${money(d.amount, currency)} (${percent(d.rate)})` : "";
}

export async function createSale(input: unknown): Promise<ActionResult<{ id: number }>> {
  return salesAction(async (me, audit) => {
    const parsed = saleSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const d = parsed.data;
    const [tour, customer] = await Promise.all([
      prisma.serviceTour.findUnique({ where: { id: d.tourId }, select: { isActive: true, name: true, currency: true, ...tourPriceSelect } }),
      prisma.customer.findUnique({ where: { id: d.customerId }, select: { id: true, fullName: true } }),
    ]);
    if (!tour) return { ok: false, message: "Tur bulunamadı.", fieldErrors: { tourId: "Tur seçiniz" } };
    if (!tour.isActive) return { ok: false, message: "Seçilen tur pasif; yeni satış yapılamaz.", fieldErrors: { tourId: "Tur pasif" } };
    if (!customer) return { ok: false, message: "Müşteri bulunamadı.", fieldErrors: { customerId: "Müşteri seçiniz" } };
    if (d.downPayment && d.downPayment > d.price)
      return { ok: false, message: "Peşinat ücretten fazla olamaz.", fieldErrors: { downPayment: "Ücretten fazla olamaz" } };
    if (d.downPayment && !(d.downPaymentBy && (await getCashPeople()).includes(d.downPaymentBy)))
      return { ok: false, message: "Peşinatı alan kişiyi seçin.", fieldErrors: { downPaymentBy: "Kişi seçiniz" } };

    const date = new Date(d.date);
    const listPrice = listPriceOf(tourPriceMap(tour), d.roomSize);
    const sale = await prisma.sale.create({
      data: {
        date,
        tourId: d.tourId,
        customerId: d.customerId,
        note: d.note || null,
        reference: d.reference || null,
        roomSize: d.roomSize ?? null,
        listPrice,
        price: d.price,
        createdByName: me.name,
        ...(d.downPayment
          ? { payments: { create: { date, amount: d.downPayment, method: d.downPaymentMethod ?? "Nakit", note: "Peşinat", receivedByName: d.downPaymentBy, createdByName: me.name } } }
          : {}),
      },
    });
    audit({
      entity: "Sale",
      entityId: sale.id,
      detail:
        `Satış #${sale.id} eklendi: ${customer.fullName}, ${tour.name}, ${money(d.price, tour.currency)}` +
        discountNote(listPrice, d.price, tour.currency) +
        (d.downPayment ? `, peşinat ${money(d.downPayment, tour.currency)} (${d.downPaymentMethod ?? "Nakit"}, alan: ${d.downPaymentBy})` : ""),
    });
    return { ok: true, message: `Satış kaydedildi (No: ${sale.id}).`, data: { id: sale.id } };
  });
}

export async function updateSale(id: string, input: unknown): Promise<ActionResult> {
  return salesAction(async (_me, audit) => {
    const saleId = toId(id);
    if (!saleId) return notFound;
    const parsed = saleSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const d = parsed.data;
    const current = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { tour: { select: { name: true, currency: true } }, customer: { select: { fullName: true } } },
    });
    if (!current) return notFound;
    const [tour, customer, paid] = await Promise.all([
      prisma.serviceTour.findUnique({ where: { id: d.tourId }, select: { name: true, currency: true, ...tourPriceSelect } }),
      prisma.customer.findUnique({ where: { id: d.customerId }, select: { id: true, fullName: true } }),
      paidOf(saleId),
    ]);
    if (!tour) return { ok: false, message: "Tur bulunamadı.", fieldErrors: { tourId: "Tur seçiniz" } };
    if (!customer) return { ok: false, message: "Müşteri bulunamadı.", fieldErrors: { customerId: "Müşteri seçiniz" } };
    if (paid && tour.currency !== current.tour.currency)
      return { ok: false, message: "Tahsilatı olan satış, farklı para birimli bir tura taşınamaz.", fieldErrors: { tourId: "Para birimi farklı" } };
    if (d.price < paid)
      return { ok: false, message: `Ücret, tahsil edilen tutardan (${paid}) az olamaz.`, fieldErrors: { price: "Tahsil edilenden az olamaz" } };

    // Tur ve oda aynı kaldıysa satış anındaki liste fiyatı korunur; değiştiyse turun güncel fiyatı alınır
    const sameRoom = d.tourId === current.tourId && (d.roomSize ?? null) === current.roomSize;
    const listPrice = sameRoom ? current.listPrice : listPriceOf(tourPriceMap(tour), d.roomSize);
    await prisma.sale.update({
      where: { id: saleId },
      data: {
        date: new Date(d.date),
        tourId: d.tourId,
        customerId: d.customerId,
        note: d.note || null,
        reference: d.reference || null,
        roomSize: d.roomSize ?? null,
        listPrice,
        price: d.price,
      },
    });
    const changes = saleChanges([
      ["Ücret", money(current.price, current.tour.currency), money(d.price, tour.currency)],
      [
        "Liste fiyatı",
        current.listPrice == null ? null : money(current.listPrice, current.tour.currency),
        listPrice == null ? null : money(listPrice, tour.currency),
      ],
      ["Tarih", shortDate(current.date), shortDate(d.date)],
      ["Müşteri", current.customer.fullName, customer.fullName],
      ["Tur", current.tour.name, tour.name],
      ["Oda", current.roomSize, d.roomSize],
      ["Referans", current.reference, d.reference],
      ["Açıklama", current.note, d.note],
    ]);
    audit({ entity: "Sale", entityId: saleId, detail: `Satış #${saleId} düzenlendi${changes ? `: ${changes}` : " (değişiklik yok)"}` });
    return { ok: true, message: "Satış güncellendi." };
  });
}

/** İptal eder / iptali geri alır (iptal edilen satış toplamlara girmez) */
export async function toggleSaleCancel(id: string): Promise<ActionResult> {
  return salesAction(async (_me, audit) => {
    const saleId = toId(id);
    if (!saleId) return notFound;
    const sale = await prisma.sale.findUnique({ where: { id: saleId }, select: { isCancelled: true } });
    if (!sale) return notFound;
    await prisma.sale.update({ where: { id: saleId }, data: { isCancelled: !sale.isCancelled } });
    audit({ entity: "Sale", entityId: saleId, detail: `Satış #${saleId} ${sale.isCancelled ? "iptali geri alındı" : "iptal edildi"}` });
    return { ok: true, message: sale.isCancelled ? "İptal geri alındı." : "Satış iptal edildi." };
  });
}

export async function deleteSale(id: string): Promise<ActionResult> {
  return salesAction(async (_me, audit) => {
    const saleId = toId(id);
    if (!saleId) return notFound;
    const payments = await prisma.payment.count({ where: { saleId } });
    if (payments) return { ok: false, message: "Tahsilatı olan satış silinemez; iptal edebilirsiniz." };
    const s = await prisma.sale.delete({
      where: { id: saleId },
      include: { tour: { select: { name: true, currency: true } }, customer: { select: { fullName: true } } },
    });
    audit({ entity: "Sale", detail: `Satış #${s.id} silindi: ${s.customer.fullName}, ${s.tour.name}, ${money(s.price, s.tour.currency)}` });
    return { ok: true, message: "Satış silindi." };
  });
}

/* ------------------------------------------------------------------ */
/* Tahsilatlar                                                          */
/* ------------------------------------------------------------------ */

export async function addPayment(saleId: string, input: unknown): Promise<ActionResult> {
  return salesAction(async (me, audit) => {
    const id = toId(saleId);
    if (!id) return notFound;
    const parsed = paymentSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const sale = await prisma.sale.findUnique({ where: { id }, select: { price: true, isCancelled: true, tour: { select: { currency: true } } } });
    if (!sale) return notFound;
    if (sale.isCancelled) return { ok: false, message: "İptal edilmiş satışa tahsilat girilemez." };
    if (!(await getCashPeople()).includes(parsed.data.receivedBy))
      return { ok: false, message: "Parayı alan kişiyi listeden seçin.", fieldErrors: { receivedBy: "Kişi seçiniz" } };
    const balance = sale.price - (await paidOf(id));
    if (parsed.data.amount > balance)
      return {
        ok: false,
        message: balance > 0 ? `Tutar kalan borçtan (${balance}) fazla olamaz.` : "Bu satışın kalan borcu yok.",
        fieldErrors: { amount: "Kalan borçtan fazla" },
      };
    await prisma.payment.create({
      data: { saleId: id, date: new Date(parsed.data.date), amount: parsed.data.amount, method: parsed.data.method, note: parsed.data.note || null, receivedByName: parsed.data.receivedBy, createdByName: me.name },
    });
    audit({ entity: "Sale", entityId: id, detail: `Satış #${id}: ${money(parsed.data.amount, sale.tour.currency)} tahsilat eklendi (${parsed.data.method}, alan: ${parsed.data.receivedBy})` });
    return { ok: true, message: "Tahsilat kaydedildi." };
  });
}

/** İptal edilen satışın parasını müşteriye iade eder (eksi tutarlı tahsilat olarak tutulur) */
export async function addRefund(saleId: string, input: unknown): Promise<ActionResult> {
  return salesAction(async (me, audit) => {
    const id = toId(saleId);
    if (!id) return notFound;
    const parsed = paymentSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const sale = await prisma.sale.findUnique({ where: { id }, select: { isCancelled: true, tour: { select: { currency: true } } } });
    if (!sale) return notFound;
    if (!sale.isCancelled) return { ok: false, message: "İade yalnızca iptal edilmiş satışa yapılır." };
    if (!(await getCashPeople()).includes(parsed.data.receivedBy))
      return { ok: false, message: "İadeyi yapan kişiyi listeden seçin.", fieldErrors: { receivedBy: "Kişi seçiniz" } };
    const paid = await paidOf(id);
    if (parsed.data.amount > paid)
      return {
        ok: false,
        message: paid > 0 ? `Tutar iade edilecek paradan (${paid}) fazla olamaz.` : "Bu satışta iade edilecek para yok.",
        fieldErrors: { amount: "İade edilecek paradan fazla" },
      };
    await prisma.payment.create({
      data: { saleId: id, date: new Date(parsed.data.date), amount: -parsed.data.amount, method: parsed.data.method, note: parsed.data.note || null, receivedByName: parsed.data.receivedBy, createdByName: me.name },
    });
    audit({ entity: "Sale", entityId: id, detail: `Satış #${id}: ${money(parsed.data.amount, sale.tour.currency)} iade edildi (${parsed.data.method}, yapan: ${parsed.data.receivedBy})` });
    return { ok: true, message: "İade kaydedildi." };
  });
}

export async function deletePayment(id: string): Promise<ActionResult> {
  return salesAction(async (me, audit) => {
    if (me.role !== "ADMIN") return ADMIN_ONLY;
    const paymentId = toId(id);
    if (!paymentId) return notFound;
    const current = await prisma.payment.findUnique({ where: { id: paymentId }, select: { saleId: true, amount: true, batchId: true, sale: { select: { price: true, isCancelled: true } } } });
    if (!current) return notFound;
    // Grup tahsilatının bir parçası: bütün parçalar birlikte silinir
    if (current.batchId) return deleteBatch(current.batchId, me, audit);
    // Silinince iade, alınan paradan fazla kalmamalı; iadesi silinen satış da ücretini aşmamalı
    const paidAfter = (await paidOf(current.saleId)) - current.amount;
    if (paidAfter < 0) return { ok: false, message: "Bu tahsilatın iadesi kayıtlı; önce iadeyi silin." };
    if (!current.sale.isCancelled && paidAfter > current.sale.price) return { ok: false, message: "İade silinirse ödenen tutar ücreti aşar; önce ücreti düzeltin." };
    const p = await prisma.payment.delete({ where: { id: paymentId }, include: { sale: { select: { tour: { select: { currency: true } } } } } });
    const label = p.amount < 0 ? "iade" : "tahsilat";
    audit({ entity: "Sale", entityId: p.saleId, detail: `Satış #${p.saleId}: ${money(Math.abs(p.amount), p.sale.tour.currency)} ${label} silindi (${p.method}, ${p.receivedByName ?? "kişi yok"})` });
    return { ok: true, message: p.amount < 0 ? "İade silindi." : "Tahsilat silindi." };
  });
}

/* ------------------------------------------------------------------ */
/* Kasa teslimleri                                                      */
/* ------------------------------------------------------------------ */

export async function addHandover(input: unknown): Promise<ActionResult> {
  return salesAction(async (me, audit) => {
    if (me.role !== "ADMIN") return ADMIN_ONLY;
    const parsed = handoverSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const d = parsed.data;
    const held = (await getCashRows()).find((r) => r.person === d.fromName && r.currency === "USD")?.held ?? 0;
    if (d.amount > held)
      return {
        ok: false,
        message: held > 0 ? `Tutar kişinin elindeki nakitten (${money(held, "USD")}) fazla olamaz.` : "Bu kişinin elinde nakit görünmüyor.",
        fieldErrors: { amount: "Elindeki nakitten fazla" },
      };
    const h = await prisma.cashHandover.create({
      data: { date: new Date(d.date), fromName: d.fromName, amount: d.amount, note: d.note || null, createdByName: me.name },
    });
    audit({ detail: `Kasa teslimi #${h.id}: ${h.fromName}, ${money(h.amount, "USD")}` });
    return { ok: true, message: "Kasa teslimi kaydedildi." };
  });
}

export async function deleteHandover(id: string): Promise<ActionResult> {
  return salesAction(async (me, audit) => {
    if (me.role !== "ADMIN") return ADMIN_ONLY;
    const handoverId = toId(id);
    if (!handoverId) return notFound;
    const h = await prisma.cashHandover.delete({ where: { id: handoverId } });
    audit({ detail: `Kasa teslimi #${h.id} silindi: ${h.fromName}, ${money(h.amount, "USD")}` });
    return { ok: true, message: "Kasa teslimi silindi." };
  });
}

/* ------------------------------------------------------------------ */
/* Aile / grup                                                          */
/* ------------------------------------------------------------------ */

type Audit = (entry: AuditEntry) => void;

/** Grup işlemi her kişinin satış geçmişine de yazılır (asıl kayıt grubun geçmişinde) */
async function logToSales(me: CurrentUser, entries: { saleId: number; detail: string }[]) {
  for (const e of entries) await recordActivity(me, { entity: "Sale", entityId: e.saleId, detail: e.detail });
}

/** Aile / grup satışı: grup + her kişi için satış + (varsa) peşinatın ücretlere göre dağıtımı */
export async function createGroupSale(input: unknown): Promise<ActionResult<{ groupId: number }>> {
  return salesAction(async (me, audit) => {
    const parsed = groupSaleSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const d = parsed.data;
    const [tour, customers, group] = await Promise.all([
      prisma.serviceTour.findUnique({ where: { id: d.tourId }, select: { isActive: true, name: true, currency: true, ...tourPriceSelect } }),
      prisma.customer.findMany({ where: { id: { in: d.members.map((m) => m.customerId) } }, select: { id: true, fullName: true } }),
      d.groupId ? prisma.saleGroup.findUnique({ where: { id: d.groupId }, select: { id: true, name: true } }) : null,
    ]);
    if (!tour) return { ok: false, message: "Tur bulunamadı.", fieldErrors: { tourId: "Tur seçiniz" } };
    if (!tour.isActive) return { ok: false, message: "Seçilen tur pasif; yeni satış yapılamaz.", fieldErrors: { tourId: "Tur pasif" } };
    if (customers.length !== d.members.length) return { ok: false, message: "Kişilerden biri bulunamadı; listeyi kontrol edin." };
    if (d.groupId && !group) return { ok: false, message: "Grup bulunamadı; silinmiş olabilir." };
    const totalPrice = d.members.reduce((t, m) => t + m.price, 0);
    if (d.downPayment && d.downPayment > totalPrice)
      return { ok: false, message: "Peşinat toplam ücretten fazla olamaz.", fieldErrors: { downPayment: "Toplam ücretten fazla olamaz" } };
    if (d.downPayment && !(d.downPaymentBy && (await getCashPeople()).includes(d.downPaymentBy)))
      return { ok: false, message: "Peşinatı alan kişiyi seçin.", fieldErrors: { downPaymentBy: "Kişi seçiniz" } };

    const date = new Date(d.date);
    const names = new Map(customers.map((c) => [c.id, c.fullName]));
    const downParts = d.downPayment ? splitProportional(d.downPayment, d.members.map((m) => m.price)) : [];
    const batchId = d.downPayment ? randomUUID() : null;
    const method = d.downPaymentMethod ?? "Nakit";
    const listPrice = listPriceOf(tourPriceMap(tour), d.roomSize);

    const { groupId, groupName, saleIds } = await prisma.$transaction(async (tx) => {
      const g = group ?? (await tx.saleGroup.create({ data: { name: d.groupName!, createdByName: me.name } }));
      const ids: number[] = [];
      for (const [i, m] of d.members.entries()) {
        const sale = await tx.sale.create({
          data: {
            date,
            tourId: d.tourId,
            customerId: m.customerId,
            groupId: g.id,
            note: d.note || null,
            reference: d.reference || null,
            roomSize: d.roomSize ?? null,
            listPrice,
            price: m.price,
            createdByName: me.name,
            ...(downParts[i]
              ? { payments: { create: { date, amount: downParts[i], method, note: "Peşinat (grup)", receivedByName: d.downPaymentBy, createdByName: me.name, batchId } } }
              : {}),
          },
        });
        ids.push(sale.id);
      }
      return { groupId: g.id, groupName: g.name, saleIds: ids };
    });

    await logToSales(
      me,
      d.members.map((m, i) => ({
        saleId: saleIds[i],
        detail:
          `Satış #${saleIds[i]} eklendi (${groupName}): ${names.get(m.customerId)}, ${tour.name}, ${money(m.price, tour.currency)}` +
          discountNote(listPrice, m.price, tour.currency) +
          (downParts[i] ? `, peşinat payı ${money(downParts[i], tour.currency)}` : ""),
      })),
    );
    audit({
      entity: "SaleGroup",
      entityId: groupId,
      detail:
        `${groupName}: ${d.members.length} kişilik satış (${saleIds.map((s) => `#${s}`).join(", ")}), ${tour.name}, toplam ${money(totalPrice, tour.currency)}` +
        (d.downPayment ? `, peşinat ${money(d.downPayment, tour.currency)} (${method}, alan: ${d.downPaymentBy})` : ""),
    });
    return { ok: true, message: `${d.members.length} kişilik satış kaydedildi (${groupName}).`, data: { groupId } };
  });
}

/** Seçilen satışları gruplar: groupId verilirse o gruba ekler, yoksa yeni grup açar */
export async function groupSales(input: { saleIds: number[]; groupId?: number; name?: string }): Promise<ActionResult<{ groupId: number }>> {
  return salesAction(async (me, audit) => {
    const saleIds = [...new Set((input.saleIds ?? []).map(Number).filter((n) => Number.isInteger(n) && n > 0))];
    if (saleIds.length === 0) return { ok: false, message: "Satış seçin." };
    let group: { id: number; name: string } | null = null;
    let newName = "";
    if (input.groupId) {
      group = await prisma.saleGroup.findUnique({ where: { id: Number(input.groupId) }, select: { id: true, name: true } });
      if (!group) return { ok: false, message: "Grup bulunamadı; silinmiş olabilir." };
    } else {
      const parsed = groupSchema.safeParse({ name: input.name });
      if (!parsed.success) return invalid(parsed.error);
      if (saleIds.length < 2) return { ok: false, message: "Grup için en az iki satış seçin." };
      newName = parsed.data.name;
    }
    const sales = await prisma.sale.findMany({ where: { id: { in: saleIds } }, select: { id: true, groupId: true, group: { select: { name: true } } } });
    if (sales.length !== saleIds.length) return notFound;
    const elsewhere = sales.filter((s) => s.groupId && s.groupId !== group?.id);
    if (elsewhere.length) return { ok: false, message: `#${elsewhere[0].id} zaten "${elsewhere[0].group?.name}" grubunda; önce o gruptan çıkarın.` };

    const g = group ?? (await prisma.saleGroup.create({ data: { name: newName, createdByName: me.name } }));
    await prisma.sale.updateMany({ where: { id: { in: saleIds } }, data: { groupId: g.id } });
    await logToSales(me, saleIds.map((id) => ({ saleId: id, detail: `Satış #${id} "${g.name}" grubuna eklendi` })));
    audit({ entity: "SaleGroup", entityId: g.id, detail: `${g.name}: ${saleIds.map((s) => `#${s}`).join(", ")} gruba eklendi` });
    return { ok: true, message: group ? `${saleIds.length} satış "${g.name}" grubuna eklendi.` : `"${g.name}" grubu oluşturuldu.`, data: { groupId: g.id } };
  });
}

/** Grup seçim listesi (listeden "Gruba ekle" için; en yeni önce) */
export async function listGroups(): Promise<ActionResult<{ id: number; name: string; count: number }[]>> {
  return salesAction(async () => {
    const groups = await prisma.saleGroup.findMany({ orderBy: { id: "desc" }, take: 200, select: { id: true, name: true, _count: { select: { sales: true } } } });
    return { ok: true, message: "", data: groups.map((g) => ({ id: g.id, name: g.name, count: g._count.sales })) };
  });
}

/** Satışı gruptan çıkarır (satış ve tahsilatları olduğu gibi kalır) */
export async function removeFromGroup(saleId: string): Promise<ActionResult> {
  return salesAction(async (me, audit) => {
    const id = toId(saleId);
    if (!id) return notFound;
    const sale = await prisma.sale.findUnique({ where: { id }, select: { groupId: true, group: { select: { name: true } } } });
    if (!sale?.groupId) return notFound;
    await prisma.sale.update({ where: { id }, data: { groupId: null } });
    await logToSales(me, [{ saleId: id, detail: `Satış #${id} "${sale.group?.name}" grubundan çıkarıldı` }]);
    audit({ entity: "SaleGroup", entityId: sale.groupId, detail: `${sale.group?.name}: #${id} gruptan çıkarıldı` });
    return { ok: true, message: "Satış gruptan çıkarıldı." };
  });
}

export async function updateGroup(id: string, input: unknown): Promise<ActionResult> {
  return salesAction(async (_me, audit) => {
    const groupId = toId(id);
    if (!groupId) return notFound;
    const parsed = groupSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const before = await prisma.saleGroup.findUnique({ where: { id: groupId }, select: { name: true } });
    if (!before) return notFound;
    await prisma.saleGroup.update({ where: { id: groupId }, data: { name: parsed.data.name, note: parsed.data.note || null } });
    audit({
      entity: "SaleGroup",
      entityId: groupId,
      detail: before.name === parsed.data.name ? `${parsed.data.name}: bilgiler güncellendi` : `Grup adı değişti: ${before.name} → ${parsed.data.name}`,
    });
    return { ok: true, message: "Grup güncellendi." };
  });
}

/** Grubu dağıtır: satışlar ve tahsilatlar kalır, yalnızca gruplama kalkar */
export async function deleteGroup(id: string): Promise<ActionResult> {
  return salesAction(async (me, audit) => {
    const groupId = toId(id);
    if (!groupId) return notFound;
    const g = await prisma.saleGroup.findUnique({ where: { id: groupId }, select: { name: true, sales: { select: { id: true } } } });
    if (!g) return notFound;
    await prisma.saleGroup.delete({ where: { id: groupId } });
    await logToSales(me, g.sales.map((s) => ({ saleId: s.id, detail: `"${g.name}" grubu dağıtıldı; satış #${s.id} grupsuz kaldı` })));
    audit({ entity: "SaleGroup", detail: `"${g.name}" grubu dağıtıldı (${g.sales.length} satış grupsuz kaldı)` });
    return { ok: true, message: "Grup dağıtıldı; satışlar olduğu gibi duruyor." };
  });
}

/** Grup tahsilatı: tek ödeme, kişilerin satışlarına dağıtılmış parçalarla (ortak batchId) */
export async function addGroupPayment(groupId: string, input: unknown): Promise<ActionResult> {
  return salesAction(async (me, audit) => {
    const id = toId(groupId);
    if (!id) return notFound;
    const parsed = groupPaymentSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const d = parsed.data;
    const group = await prisma.saleGroup.findUnique({ where: { id }, select: { name: true } });
    if (!group) return notFound;
    if (!(await getCashPeople()).includes(d.receivedBy))
      return { ok: false, message: "Parayı alan kişiyi listeden seçin.", fieldErrors: { receivedBy: "Kişi seçiniz" } };

    const parts = d.parts.filter((p) => p.amount > 0);
    if (new Set(parts.map((p) => p.saleId)).size !== parts.length) return { ok: false, message: "Aynı kişi iki kez yazılmış." };
    const sales = await prisma.sale.findMany({
      where: { id: { in: parts.map((p) => p.saleId) }, groupId: id },
      select: { id: true, price: true, isCancelled: true, customer: { select: { fullName: true } }, tour: { select: { currency: true } }, payments: { select: { amount: true } } },
    });
    if (sales.length !== parts.length) return { ok: false, message: "Kişilerden biri artık bu grupta değil; sayfayı yenileyin." };
    if (new Set(sales.map((s) => s.tour.currency)).size > 1)
      return { ok: false, message: "Farklı para birimli satışlara tek tahsilat dağıtılamaz; ayrı ayrı girin." };
    for (const p of parts) {
      const s = sales.find((x) => x.id === p.saleId)!;
      const balance = s.price - s.payments.reduce((t, x) => t + x.amount, 0);
      if (s.isCancelled) return { ok: false, message: `${s.customer.fullName}: satış iptal edilmiş; ona tahsilat dağıtılamaz.` };
      if (p.amount > balance) return { ok: false, message: `${s.customer.fullName}: pay (${p.amount}) kalan borçtan (${Math.max(balance, 0)}) fazla.` };
    }

    const currency = sales[0].tour.currency;
    const total = parts.reduce((t, p) => t + p.amount, 0);
    const batchId = randomUUID();
    const date = new Date(d.date);
    await prisma.$transaction(
      parts.map((p) =>
        prisma.payment.create({
          data: { saleId: p.saleId, date, amount: p.amount, method: d.method, note: d.note || "Grup tahsilatı", receivedByName: d.receivedBy, createdByName: me.name, batchId },
        }),
      ),
    );
    const name = (saleId: number) => sales.find((s) => s.id === saleId)!.customer.fullName;
    await logToSales(
      me,
      parts.map((p) => ({
        saleId: p.saleId,
        detail: `Satış #${p.saleId}: ${money(p.amount, currency)} tahsilat eklendi (${group.name} grup tahsilatından, ${d.method}, alan: ${d.receivedBy})`,
      })),
    );
    audit({
      entity: "SaleGroup",
      entityId: id,
      detail: `${group.name}: ${money(total, currency)} grup tahsilatı (${d.method}, alan: ${d.receivedBy}) — ${parts.map((p) => `${name(p.saleId)} ${money(p.amount, currency)}`).join(", ")}`,
    });
    return { ok: true, message: `${money(total, currency)} tahsilat ${parts.length} kişiye dağıtıldı.` };
  });
}

/** Grup tahsilatını (bütün parçalarıyla) siler — yalnızca yönetici (deletePayment üzerinden) */
async function deleteBatch(batchId: string, me: CurrentUser, audit: Audit): Promise<ActionResult> {
  const parts = await prisma.payment.findMany({
    where: { batchId },
    select: {
      id: true,
      saleId: true,
      amount: true,
      method: true,
      receivedByName: true,
      sale: { select: { groupId: true, group: { select: { name: true } }, customer: { select: { fullName: true } }, tour: { select: { currency: true } } } },
    },
  });
  if (parts.length === 0) return notFound;
  for (const p of parts) {
    if ((await paidOf(p.saleId)) - p.amount < 0) return { ok: false, message: `${p.sale.customer.fullName}: bu tahsilatın iadesi kayıtlı; önce iadeyi silin.` };
  }
  await prisma.payment.deleteMany({ where: { batchId } });
  const currency = parts[0].sale.tour.currency;
  const total = parts.reduce((t, p) => t + p.amount, 0);
  const groupName = parts[0].sale.group?.name ?? "Grup";
  await logToSales(me, parts.map((p) => ({ saleId: p.saleId, detail: `Satış #${p.saleId}: ${money(p.amount, currency)} tahsilat silindi (${groupName} grup tahsilatı)` })));
  audit({
    entity: parts[0].sale.groupId ? "SaleGroup" : "Sale",
    entityId: parts[0].sale.groupId ?? parts[0].saleId,
    detail: `${groupName}: ${money(total, currency)} grup tahsilatı silindi (${parts[0].method}, ${parts[0].receivedByName ?? "kişi yok"}; ${parts.length} parça)`,
  });
  return { ok: true, message: `Grup tahsilatı silindi (${parts.length} kişiden düşüldü).` };
}
