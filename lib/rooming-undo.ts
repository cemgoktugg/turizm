import "server-only";
import { prisma } from "./prisma";

/**
 * Odalamada "Geri al": her odalama işleminden önce turun durumu (odalar + kim hangi odada)
 * saklanır; geri alınınca son işlemden önceki duruma dönülür. Turda en fazla KEEP kayıt tutulur.
 */

type Snapshot = {
  rooms: { id: number; size: number; meccaNo: string | null; medinaNo: string | null }[];
  /** [satış no, oda no] */
  placements: [number, number][];
};

const KEEP = 30;

/** İşlemden önce çağrılır */
export async function saveUndo(tourId: number, label: string, byName: string) {
  const [rooms, placed] = await Promise.all([
    prisma.tourRoom.findMany({ where: { tourId }, select: { id: true, size: true, meccaNo: true, medinaNo: true } }),
    prisma.sale.findMany({ where: { tourId, isCancelled: false, roomId: { not: null } }, select: { id: true, roomId: true } }),
  ]);
  const snapshot: Snapshot = { rooms, placements: placed.map((s) => [s.id, s.roomId!]) };
  await prisma.roomingUndo.create({ data: { tourId, label, snapshot: JSON.stringify(snapshot), createdByName: byName } });
  const old = await prisma.roomingUndo.findMany({ where: { tourId }, orderBy: { id: "desc" }, skip: KEEP, select: { id: true } });
  if (old.length) await prisma.roomingUndo.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });
}

/** Geri alınabilecek son işlem (düğmede gösterilir) */
export function getLastUndo(tourId: number) {
  return prisma.roomingUndo.findFirst({
    where: { tourId },
    orderBy: { id: "desc" },
    select: { id: true, label: true, createdByName: true, createdAt: true },
  });
}

/**
 * Son işlemi geri alır. Otel oda numaraları sonradan yazılmış olabileceğinden mevcut odalarda
 * korunur; yalnızca silinmiş odalar numaralarıyla geri gelir. O arada iptal edilen ya da başka
 * tura taşınan satışlar yeniden yerleştirilmez.
 */
export async function restoreLastUndo(tourId: number): Promise<{ label: string } | null> {
  const last = await prisma.roomingUndo.findFirst({ where: { tourId }, orderBy: { id: "desc" } });
  if (!last) return null;
  const snap = JSON.parse(last.snapshot) as Snapshot;
  await prisma.$transaction(
    async (tx) => {
      const current = await tx.tourRoom.findMany({ where: { tourId }, select: { id: true } });
      const wanted = new Set(snap.rooms.map((r) => r.id));
      const existing = new Set(current.map((r) => r.id));
      // Önce herkes odasından çıkar, sonra kayıttaki yerleşim kurulur
      await tx.sale.updateMany({ where: { tourId, roomId: { not: null } }, data: { roomId: null } });
      const extra = current.map((r) => r.id).filter((id) => !wanted.has(id));
      if (extra.length) await tx.tourRoom.deleteMany({ where: { id: { in: extra } } });
      for (const r of snap.rooms) {
        if (existing.has(r.id)) await tx.tourRoom.update({ where: { id: r.id }, data: { size: r.size } });
        else await tx.tourRoom.create({ data: { id: r.id, tourId, size: r.size, meccaNo: r.meccaNo, medinaNo: r.medinaNo } });
      }
      const byRoom = new Map<number, number[]>();
      for (const [saleId, roomId] of snap.placements) byRoom.set(roomId, [...(byRoom.get(roomId) ?? []), saleId]);
      for (const [roomId, saleIds] of byRoom)
        await tx.sale.updateMany({ where: { id: { in: saleIds }, tourId, isCancelled: false }, data: { roomId } });
      await tx.roomingUndo.delete({ where: { id: last.id } });
    },
    { timeout: 30_000 },
  );
  return { label: last.label };
}
