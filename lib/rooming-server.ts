import "server-only";
import { prisma } from "./prisma";
import { isGender, sortRooms, takesBed, type Room, type RoomOptionsByTour, type RoomPerson } from "./rooming";

/** Turun odaları (ekran sırasıyla) ve odalamadaki kişiler: iptal edilmemiş satışlar */
export async function getRooming(tourId: number): Promise<{ rooms: Room[]; people: RoomPerson[] }> {
  const [rooms, sales] = await Promise.all([
    prisma.tourRoom.findMany({ where: { tourId }, select: { id: true, size: true } }),
    prisma.sale.findMany({
      where: { tourId, isCancelled: false },
      orderBy: { id: "asc" },
      select: {
        id: true,
        roomId: true,
        roomSize: true,
        passenger: true,
        groupId: true,
        group: { select: { name: true } },
        customer: { select: { id: true, fullName: true, gender: true, tc: true, phone: true } },
      },
    }),
  ]);
  return {
    rooms: sortRooms(rooms),
    people: sales.map((s) => ({
      saleId: s.id,
      customerId: s.customer.id,
      name: s.customer.fullName,
      gender: isGender(s.customer.gender) ? s.customer.gender : null,
      passenger: s.passenger,
      roomSize: s.roomSize,
      groupId: s.groupId,
      groupName: s.group?.name ?? null,
      roomId: s.roomId,
      tc: s.customer.tc,
      phone: s.customer.phone,
    })),
  };
}

/** Satış ekranlarındaki oda seçimi için turların odaları: numara (odalama sırası), tip, dolu yatak, kalanlar */
export async function getRoomOptions(tourIds: number[]): Promise<RoomOptionsByTour> {
  const ids = [...new Set(tourIds)];
  if (!ids.length) return {};
  const [rooms, placed] = await Promise.all([
    prisma.tourRoom.findMany({ where: { tourId: { in: ids } }, select: { id: true, size: true, tourId: true } }),
    prisma.sale.findMany({
      where: { tourId: { in: ids }, isCancelled: false, roomId: { not: null } },
      orderBy: { id: "asc" },
      select: { id: true, roomId: true, passenger: true, customer: { select: { fullName: true } } },
    }),
  ]);
  const out: RoomOptionsByTour = {};
  for (const tourId of ids)
    out[tourId] = sortRooms(rooms.filter((r) => r.tourId === tourId)).map((r, i) => ({
      id: r.id,
      no: i + 1,
      size: r.size,
      people: placed.filter((s) => s.roomId === r.id).map((s) => ({ saleId: s.id, name: s.customer.fullName, bed: takesBed(s.passenger) })),
    }));
  return out;
}
