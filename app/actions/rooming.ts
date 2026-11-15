"use server";

import { prisma } from "@/lib/prisma";
import { salesAction, type ActionResult } from "@/lib/action";
import { GENDERS, isGender, isRoomSize, planAutoPlacement, takesBed, type AutoPlan } from "@/lib/rooming";
import { getRooming } from "@/lib/rooming-server";

/** Odalama işlemleri: kişiler satış kaydı (Sale.roomId) üzerinden odaya yerleşir. */

function toId(v: unknown): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Ekrandan gelen satış numaraları (tekrarsız, en fazla 300) */
function toIds(v: unknown): number[] | null {
  if (!Array.isArray(v) || v.length === 0 || v.length > 300) return null;
  const ids = v.map(toId);
  return ids.every((n): n is number => n != null) ? [...new Set(ids)] : null;
}

const notFound = { ok: false, message: "Kayıt bulunamadı; sayfayı yenileyin." } as const;
const stale = { ok: false, message: "Kişilerden biri bulunamadı ya da satışı iptal edilmiş; sayfayı yenileyin." } as const;

const names = (rows: { customer: { fullName: string } }[]) => {
  const list = rows.map((r) => r.customer.fullName);
  return list.length > 4 ? `${list.slice(0, 4).join(", ")} ve ${list.length - 4} kişi daha` : list.join(", ");
};

/** Turun yerleştirilecek (iptal edilmemiş) satışları; biri eksikse null */
async function movingSales(tourId: number, saleIds: number[]) {
  const rows = await prisma.sale.findMany({
    where: { id: { in: saleIds }, tourId, isCancelled: false },
    select: { id: true, passenger: true, roomId: true, customer: { select: { fullName: true } } },
  });
  return rows.length === saleIds.length ? rows : null;
}

/** Kişiler taşınınca boşalan odalar silinir (boş oda otele bildirilmez; listelerde kalabalık yapmasın) */
async function dropEmptied(rows: { roomId: number | null }[], keep?: number) {
  const ids = [...new Set(rows.map((r) => r.roomId).filter((id): id is number => id != null && id !== keep))];
  if (ids.length) await prisma.tourRoom.deleteMany({ where: { id: { in: ids }, sales: { none: {} } } });
}

const bedsOf = (rows: { passenger: string | null }[]) => rows.filter((r) => takesBed(r.passenger)).length;

/** Seçilen kişileri mevcut bir odaya yerleştirir (başka odadaysa taşır) */
export async function placeInRoom(tourIdIn: number, saleIdsIn: number[], roomIdIn: number): Promise<ActionResult> {
  return salesAction(async (_me, audit) => {
    const tourId = toId(tourIdIn);
    const saleIds = toIds(saleIdsIn);
    const roomId = toId(roomIdIn);
    if (!tourId || !saleIds || !roomId) return notFound;
    const room = await prisma.tourRoom.findUnique({ where: { id: roomId }, select: { tourId: true, size: true } });
    if (!room || room.tourId !== tourId) return notFound;
    const moving = await movingSales(tourId, saleIds);
    if (!moving) return stale;
    const staying = await prisma.sale.findMany({
      where: { roomId, isCancelled: false, id: { notIn: saleIds } },
      select: { passenger: true },
    });
    const free = room.size - bedsOf(staying);
    const need = bedsOf(moving);
    if (need > free)
      return {
        ok: false,
        message: free <= 0 ? `Bu ${room.size} kişilik oda dolu.` : `Odada ${free} boş yatak var; ${need} kişi sığmaz. Yeni oda açın ya da başka oda seçin.`,
      };
    await prisma.sale.updateMany({ where: { id: { in: saleIds } }, data: { roomId } });
    await dropEmptied(moving, roomId);
    audit({ entity: "ServiceTour", entityId: tourId, detail: `Odalama: ${names(moving)} → ${room.size} kişilik oda` });
    return { ok: true, message: `${moving.length} kişi odaya yerleştirildi.` };
  });
}

/** Yeni oda açar; kişi seçildiyse onları da içine yerleştirir */
export async function createRoom(tourIdIn: number, sizeIn: number, saleIdsIn: number[] = []): Promise<ActionResult> {
  return salesAction(async (_me, audit) => {
    const tourId = toId(tourIdIn);
    if (!tourId || !isRoomSize(sizeIn)) return { ok: false, message: "Oda tipi 2, 3 ya da 4 kişilik olmalı." };
    const tour = await prisma.serviceTour.findUnique({ where: { id: tourId }, select: { id: true } });
    if (!tour) return notFound;
    const saleIds = saleIdsIn.length ? toIds(saleIdsIn) : [];
    if (!saleIds) return stale;
    const moving = saleIds.length ? await movingSales(tourId, saleIds) : [];
    if (!moving) return stale;
    if (bedsOf(moving) > sizeIn) return { ok: false, message: `${bedsOf(moving)} kişi ${sizeIn} kişilik odaya sığmaz.` };
    await prisma.$transaction(async (tx) => {
      const room = await tx.tourRoom.create({ data: { tourId, size: sizeIn } });
      if (saleIds.length) await tx.sale.updateMany({ where: { id: { in: saleIds } }, data: { roomId: room.id } });
    });
    await dropEmptied(moving);
    audit({
      entity: "ServiceTour",
      entityId: tourId,
      detail: `Odalama: ${sizeIn} kişilik oda açıldı${moving.length ? `: ${names(moving)}` : ""}`,
    });
    return { ok: true, message: moving.length ? `${sizeIn} kişilik oda açıldı, ${moving.length} kişi yerleştirildi.` : `${sizeIn} kişilik oda açıldı.` };
  });
}

/** Seçilen kişileri odalarından çıkarır (yerleşmemişler listesine döner) */
export async function unplaceSales(tourIdIn: number, saleIdsIn: number[]): Promise<ActionResult> {
  return salesAction(async (_me, audit) => {
    const tourId = toId(tourIdIn);
    const saleIds = toIds(saleIdsIn);
    if (!tourId || !saleIds) return notFound;
    const moving = await movingSales(tourId, saleIds);
    if (!moving) return stale;
    await prisma.sale.updateMany({ where: { id: { in: saleIds } }, data: { roomId: null } });
    await dropEmptied(moving);
    audit({ entity: "ServiceTour", entityId: tourId, detail: `Odalama: ${names(moving)} odadan çıkarıldı` });
    return { ok: true, message: `${moving.length} kişi odadan çıkarıldı.` };
  });
}

/** Oda tipini değiştirir (içindekiler yeni tipe sığmalı) */
export async function resizeRoom(roomIdIn: number, sizeIn: number): Promise<ActionResult> {
  return salesAction(async (_me, audit) => {
    const roomId = toId(roomIdIn);
    if (!roomId || !isRoomSize(sizeIn)) return { ok: false, message: "Oda tipi 2, 3 ya da 4 kişilik olmalı." };
    const room = await prisma.tourRoom.findUnique({
      where: { id: roomId },
      select: { tourId: true, size: true, sales: { where: { isCancelled: false }, select: { passenger: true } } },
    });
    if (!room) return notFound;
    const beds = bedsOf(room.sales);
    if (beds > sizeIn) return { ok: false, message: `Odada ${beds} kişi var; ${sizeIn} kişilik yapılamaz.` };
    await prisma.tourRoom.update({ where: { id: roomId }, data: { size: sizeIn } });
    audit({ entity: "ServiceTour", entityId: room.tourId, detail: `Odalama: ${room.size} kişilik oda ${sizeIn} kişilik yapıldı` });
    return { ok: true, message: `Oda ${sizeIn} kişilik yapıldı.` };
  });
}

/** Odayı siler; içindekiler yerleşmemişler listesine döner */
export async function deleteRoom(roomIdIn: number): Promise<ActionResult> {
  return salesAction(async (_me, audit) => {
    const roomId = toId(roomIdIn);
    if (!roomId) return notFound;
    const room = await prisma.tourRoom.findUnique({ where: { id: roomId }, select: { tourId: true, size: true, _count: { select: { sales: true } } } });
    if (!room) return notFound;
    await prisma.$transaction([
      prisma.sale.updateMany({ where: { roomId }, data: { roomId: null } }),
      prisma.tourRoom.delete({ where: { id: roomId } }),
    ]);
    audit({ entity: "ServiceTour", entityId: room.tourId, detail: `Odalama: ${room.size} kişilik oda silindi (${room._count.sales} kişi çıkarıldı)` });
    return { ok: true, message: room._count.sales ? `Oda silindi; ${room._count.sales} kişi yerleşmemişler listesine döndü.` : "Oda silindi." };
  });
}

/** Yerleşmemiş herkesi kurallara göre yerleştirir (bkz. planAutoPlacement); mevcut yerleşime dokunmaz */
export async function autoPlaceRooms(tourIdIn: number): Promise<ActionResult<{ skipped: AutoPlan["skipped"] }>> {
  return salesAction(async (_me, audit) => {
    const tourId = toId(tourIdIn);
    if (!tourId) return notFound;
    const { rooms, people } = await getRooming(tourId);
    if (!people.some((p) => p.roomId == null)) return { ok: true, message: "Yerleştirilecek kimse yok; herkes bir odada.", data: { skipped: [] } };
    const plan = planAutoPlacement(rooms, people);
    await prisma.$transaction(
      async (tx) => {
        for (const r of plan.create) {
          const room = await tx.tourRoom.create({ data: { tourId, size: r.size } });
          await tx.sale.updateMany({ where: { id: { in: r.saleIds }, tourId, isCancelled: false }, data: { roomId: room.id } });
        }
        for (const a of plan.assign) await tx.sale.updateMany({ where: { id: a.saleId, tourId, isCancelled: false }, data: { roomId: a.roomId } });
      },
      { timeout: 30_000 },
    );
    const placed = plan.assign.length + plan.create.reduce((t, r) => t + r.saleIds.length, 0);
    const summary = `${placed} kişi yerleştirildi${plan.create.length ? `, ${plan.create.length} yeni oda açıldı` : ""}`;
    audit({ entity: "ServiceTour", entityId: tourId, detail: `Odalama: otomatik yerleştirme, ${summary}${plan.skipped.length ? `; ${plan.skipped.length} kişi atlandı` : ""}` });
    return {
      ok: true,
      message: plan.skipped.length ? `${summary}. ${plan.skipped.length} kişiyi elle yerleştirmeniz gerekiyor.` : `${summary}.`,
      data: { skipped: plan.skipped },
    };
  });
}

/** Turun bütün odalarını siler, herkes yerleşmemişler listesine döner */
export async function resetRooms(tourIdIn: number): Promise<ActionResult> {
  return salesAction(async (_me, audit) => {
    const tourId = toId(tourIdIn);
    if (!tourId) return notFound;
    const [, deleted] = await prisma.$transaction([
      prisma.sale.updateMany({ where: { tourId, roomId: { not: null } }, data: { roomId: null } }),
      prisma.tourRoom.deleteMany({ where: { tourId } }),
    ]);
    audit({ entity: "ServiceTour", entityId: tourId, detail: `Odalama sıfırlandı (${deleted.count} oda silindi)` });
    return { ok: true, message: `Odalama sıfırlandı; ${deleted.count} oda silindi.` };
  });
}

/** Odalama ekranından müşterinin cinsiyetini girer */
export async function setCustomerGender(customerIdIn: number, gender: string): Promise<ActionResult> {
  return salesAction(async (_me, audit) => {
    const customerId = toId(customerIdIn);
    if (!customerId || !isGender(gender)) return { ok: false, message: "Geçersiz cinsiyet." };
    const c = await prisma.customer.update({ where: { id: customerId }, data: { gender }, select: { fullName: true } });
    audit({ entity: "Customer", entityId: customerId, detail: `Müşteri #${customerId} ${c.fullName}: cinsiyet ${GENDERS[gender]}` });
    return { ok: true, message: `${c.fullName}: ${GENDERS[gender]}` };
  });
}
