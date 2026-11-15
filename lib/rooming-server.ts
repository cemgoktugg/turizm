import "server-only";
import { prisma } from "./prisma";
import { isGender, sortRooms, takesBed, type Room, type RoomOptionsByTour, type RoomPerson } from "./rooming";

/** Turun odaları (ekran sırasıyla) ve odalamadaki kişiler: iptal edilmemiş satışlar */
export async function getRooming(tourId: number): Promise<{ rooms: Room[]; people: RoomPerson[] }> {
  const [rooms, sales] = await Promise.all([
    prisma.tourRoom.findMany({ where: { tourId }, select: { id: true, size: true, meccaNo: true, medinaNo: true } }),
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
    prisma.tourRoom.findMany({ where: { tourId: { in: ids } }, select: { id: true, size: true, tourId: true, meccaNo: true, medinaNo: true } }),
    prisma.sale.findMany({
      where: { tourId: { in: ids }, isCancelled: false, roomId: { not: null } },
      orderBy: { id: "asc" },
      select: { id: true, roomId: true, passenger: true, groupId: true, customer: { select: { fullName: true, gender: true } } },
    }),
  ]);
  const out: RoomOptionsByTour = {};
  for (const tourId of ids)
    out[tourId] = sortRooms(rooms.filter((r) => r.tourId === tourId)).map((r, i) => ({
      id: r.id,
      no: i + 1,
      size: r.size,
      meccaNo: r.meccaNo,
      medinaNo: r.medinaNo,
      people: placed
        .filter((s) => s.roomId === r.id)
        .map((s) => ({
          saleId: s.id,
          name: s.customer.fullName,
          bed: takesBed(s.passenger),
          gender: isGender(s.customer.gender) ? s.customer.gender : null,
          groupId: s.groupId,
        })),
    }));
  return out;
}

/**
 * Görevli ekranı (/oda/<gizli bağlantı>): bağlantıdaki tur, odaları ve kişileri.
 * Kişilerde yalnızca ad, cinsiyet, yolcu tipi ve aile adı gönderilir (T.C., telefon, fiyat yok).
 */
export async function getGuideView(token: string) {
  if (!token || token.length < 20 || token.length > 64) return null;
  const tour = await prisma.serviceTour.findUnique({
    where: { guideToken: token },
    select: { id: true, name: true, period: true, departureDate: true, returnDate: true, days: true, accommodation: true },
  });
  if (!tour) return null;
  const { rooms, people } = await getRooming(tour.id);
  return {
    tour,
    rooms,
    people: people.map((p) => ({
      saleId: p.saleId,
      customerId: 0,
      name: p.name,
      gender: p.gender,
      passenger: p.passenger,
      roomSize: p.roomSize,
      groupId: p.groupId,
      groupName: p.groupName,
      roomId: p.roomId,
    })),
  };
}
