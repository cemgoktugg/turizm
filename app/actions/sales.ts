"use server";

import { prisma } from "@/lib/prisma";
import { ADMIN_ONLY, salesAction, invalid, type ActionResult } from "@/lib/action";
import { getCashPeople, getCashRows, money, shortDate } from "@/lib/sales";
import {
  customerSchema,
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

export type CustomerOption = { id: number; fullName: string; tc: string; phone: string };

function customerData(d: CustomerInput) {
  return { fullName: d.fullName, tc: d.tc, phone: d.phone, note: d.note || null };
}

async function tcTaken(tc: string, exceptId?: number) {
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

export async function createSale(input: unknown): Promise<ActionResult<{ id: number }>> {
  return salesAction(async (me, audit) => {
    const parsed = saleSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const d = parsed.data;
    const [tour, customer] = await Promise.all([
      prisma.serviceTour.findUnique({ where: { id: d.tourId }, select: { isActive: true, name: true, currency: true } }),
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
    const sale = await prisma.sale.create({
      data: {
        date,
        tourId: d.tourId,
        customerId: d.customerId,
        note: d.note || null,
        reference: d.reference || null,
        roomSize: d.roomSize ?? null,
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
      prisma.serviceTour.findUnique({ where: { id: d.tourId }, select: { name: true, currency: true } }),
      prisma.customer.findUnique({ where: { id: d.customerId }, select: { id: true, fullName: true } }),
      paidOf(saleId),
    ]);
    if (!tour) return { ok: false, message: "Tur bulunamadı.", fieldErrors: { tourId: "Tur seçiniz" } };
    if (!customer) return { ok: false, message: "Müşteri bulunamadı.", fieldErrors: { customerId: "Müşteri seçiniz" } };
    if (paid && tour.currency !== current.tour.currency)
      return { ok: false, message: "Tahsilatı olan satış, farklı para birimli bir tura taşınamaz.", fieldErrors: { tourId: "Para birimi farklı" } };
    if (d.price < paid)
      return { ok: false, message: `Ücret, tahsil edilen tutardan (${paid}) az olamaz.`, fieldErrors: { price: "Tahsil edilenden az olamaz" } };

    await prisma.sale.update({
      where: { id: saleId },
      data: {
        date: new Date(d.date),
        tourId: d.tourId,
        customerId: d.customerId,
        note: d.note || null,
        reference: d.reference || null,
        roomSize: d.roomSize ?? null,
        price: d.price,
      },
    });
    const changes = saleChanges([
      ["Ücret", money(current.price, current.tour.currency), money(d.price, tour.currency)],
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
    const current = await prisma.payment.findUnique({ where: { id: paymentId }, select: { saleId: true, amount: true, sale: { select: { price: true, isCancelled: true } } } });
    if (!current) return notFound;
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
