import "server-only";
import { prisma } from "./prisma";
import { isGender, sortRooms, type Room, type RoomPerson } from "./rooming";

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
