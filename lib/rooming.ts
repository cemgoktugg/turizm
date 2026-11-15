/**
 * Odalama (turda kimin hangi odada kalacağı) kuralları. Sunucu ve odalama ekranı ortak
 * kullanır; veritabanına dokunmaz.
 * - Oda tipleri 2, 3 ve 4 kişiliktir (yatak sayısı).
 * - 0-2 yaş bebek ailesinin odasında kalır, yatak kaplamaz; diğer herkes bir yatak kaplar.
 * - Aynı aile (satış grubu) birlikte yerleşir. Farklı ailelerden / tek kayıtlı kişiler
 *   yalnızca aynı cinsiyetten kişilerle aynı odayı paylaşır (ör. 3 kişilik odayı alan
 *   2 erkeğin yanına başka bir erkek).
 */

export const ROOM_SIZES = [2, 3, 4] as const;

export const GENDERS = { E: "Erkek", K: "Kadın" } as const;
export type Gender = keyof typeof GENDERS;

export function isGender(v: unknown): v is Gender {
  return v === "E" || v === "K";
}

export function isRoomSize(v: unknown): v is (typeof ROOM_SIZES)[number] {
  return v === 2 || v === 3 || v === 4;
}

/** Yatak kaplar mı? (0-2 yaş bebek kaplamaz) */
export function takesBed(passenger: string | null | undefined) {
  return passenger !== "0-2";
}

/** Odalamadaki bir kişi (iptal edilmemiş bir satış) */
export type RoomPerson = {
  saleId: number;
  customerId: number;
  name: string;
  gender: Gender | null;
  /** Yolcu tipi: null = yetişkin, "0-2" | "2-6" | "6-11" */
  passenger: string | null;
  /** Satışta seçilen (ücreti alınan) oda tipi */
  roomSize: number | null;
  groupId: number | null;
  groupName: string | null;
  roomId: number | null;
  /** Otel listesi ve Excel için */
  tc?: string | null;
  phone?: string | null;
};

export type Room = { id: number; size: number };

/** Satış ekranlarındaki oda seçimi: odanın numarası (odalama sırası) ve içindekiler */
export type RoomOption = { id: number; no: number; size: number; people: { saleId: number; name: string; bed: boolean }[] };
export type RoomOptionsByTour = Record<number, RoomOption[]>;

export function bedsUsed(people: RoomPerson[]) {
  return people.filter((p) => takesBed(p.passenger)).length;
}

/** Aile (satış grubu) ya da tek kayıt */
export function unitKey(p: RoomPerson) {
  return p.groupId ? `g${p.groupId}` : `s${p.saleId}`;
}

/** Soyadı: adın son kelimesi (küçük harf); tek kelimelik adlarda null */
export function surnameOf(name: string): string | null {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1].toLocaleLowerCase("tr") : null;
}

/**
 * Bir odaya sığmayan grubu odalara bölmek için kümeler: aynı soyadlılar (karı-koca, aile)
 * bir arada, soyadı tek olanlar tek başına. Odadan büyük küme tam odalara bölünür.
 * Karışık cinsiyetli kümeler önce (kendi odalarını alırlar), sonra büyükten küçüğe.
 */
function surnameClusters(people: RoomPerson[], size: number): RoomPerson[][] {
  const map = new Map<string, RoomPerson[]>();
  for (const p of people) {
    const key = surnameOf(p.name) ?? `#${p.saleId}`;
    map.set(key, [...(map.get(key) ?? []), p]);
  }
  const out: RoomPerson[][] = [];
  for (const cluster of map.values()) for (let i = 0; i < cluster.length; i += size) out.push(cluster.slice(i, i + size));
  return out.sort((a, b) => Number(roomGender(b) == null) - Number(roomGender(a) == null) || b.length - a.length);
}

/** Ekrandaki sıra ve numara: büyük odadan küçüğe, aynı tipte açılış sırasına göre */
export function sortRooms<T extends Room>(rooms: T[]): T[] {
  return [...rooms].sort((a, b) => b.size - a.size || a.id - b.id);
}

/** Odadaki kişilerin ortak cinsiyeti; karışık ya da girilmemişse null (bebekler sayılmaz) */
function roomGender(people: RoomPerson[]): Gender | null {
  const set = new Set(people.filter((p) => takesBed(p.passenger)).map((p) => p.gender));
  if (set.size !== 1) return null;
  const [g] = [...set];
  return g ?? null;
}

/** Odadaki uyarılar (yerleştirmeyi engellemez, odanın altında gösterilir) */
export function roomIssues(room: Room, people: RoomPerson[]): string[] {
  const issues: string[] = [];
  const beds = bedsUsed(people);
  if (beds > room.size) issues.push(`${beds} kişi var, oda ${room.size} kişilik`);
  if (new Set(people.map(unitKey)).size > 1) {
    const genders = new Set(people.filter((p) => takesBed(p.passenger)).map((p) => p.gender));
    if (genders.has(null)) issues.push("Cinsiyeti girilmemiş kişi var");
    else if (genders.size > 1) issues.push("Farklı kayıtlardan kadın ve erkek aynı odada (aynı aileyse satışları gruplayın)");
  }
  const bySize = new Map<number, string[]>();
  for (const p of people)
    if (p.roomSize && p.roomSize !== room.size && takesBed(p.passenger)) bySize.set(p.roomSize, [...(bySize.get(p.roomSize) ?? []), p.name]);
  for (const [size, names] of bySize) issues.push(`Satışta ${size} kişilik oda alındı: ${names.join(", ")}`);
  return issues;
}

/** Otel bildirimi: kişi yerleşmiş odalar tipe göre (boş odalar bildirime girmez) */
export function hotelSummary(rooms: Room[], people: RoomPerson[]) {
  const byRoom = groupByRoom(people);
  const used = rooms.filter((r) => byRoom.get(r.id)?.length);
  const bySize: Record<number, number> = { 2: 0, 3: 0, 4: 0 };
  for (const r of used) bySize[r.size] = (bySize[r.size] ?? 0) + 1;
  const placed = people.filter((p) => p.roomId != null && used.some((r) => r.id === p.roomId));
  const guests = bedsUsed(placed);
  const beds = used.reduce((t, r) => t + r.size, 0);
  return {
    bySize,
    rooms: used.length,
    beds,
    guests,
    babies: placed.length - guests,
    emptyBeds: Math.max(beds - guests, 0),
    emptyRooms: rooms.length - used.length,
    unplaced: people.filter((p) => p.roomId == null).length,
  };
}

export function groupByRoom(people: RoomPerson[]) {
  const map = new Map<number, RoomPerson[]>();
  for (const p of people) if (p.roomId != null) map.set(p.roomId, [...(map.get(p.roomId) ?? []), p]);
  return map;
}

/* ------------------------------------------------------------------ */
/* Otomatik yerleştirme                                                 */
/* ------------------------------------------------------------------ */

export type AutoPlan = {
  /** Mevcut odalara eklenecekler */
  assign: { saleId: number; roomId: number }[];
  /** Açılacak yeni odalar ve içine yerleşecekler */
  create: { size: number; saleIds: number[] }[];
  /** Otomatik yerleştirilemeyenler (elle yerleştirilir) */
  skipped: { saleId: number; name: string; reason: string }[];
};

type PlanRoom = { id: number; size: number; people: RoomPerson[]; isNew: boolean; added: RoomPerson[] };

/** Ailenin / kişinin oda tipi: satışta en çok seçilen oda (yatak kaplayanlarda) */
function unitRoomSize(members: RoomPerson[]): number | null {
  const counts = new Map<number, number>();
  for (const p of members) if (isRoomSize(p.roomSize)) counts.set(p.roomSize, (counts.get(p.roomSize) ?? 0) + (takesBed(p.passenger) ? 2 : 1));
  let best: number | null = null;
  for (const [size, n] of counts) if (best == null || n > counts.get(best)! || (n === counts.get(best)! && size > best)) best = size;
  return best;
}

/**
 * Yerleşmemiş kişileri yerleştirme planı (mevcut yerleşimlere dokunmaz):
 * 1. Aileler / gruplar (büyükten küçüğe), satışta seçtikleri oda tipinde:
 *    - Grup tek odaya sığıyorsa hepsi aynı odaya (aile).
 *    - Sığmıyorsa: aynı soyadlılar (karı-koca, aile) aynı odaya, diğerleri cinsiyete göre;
 *      önce grubun zaten kaldığı odalardaki boş yataklar kullanılır.
 *    - Odayı dolduramayan tek cinsiyetli parça aynı cinsiyetten kişilerin odasına da girebilir.
 *    - Bebekler aynı soyadlı yetişkinin (yoksa grubun) odasına konur.
 * 2. Tek kayıtlar: aynı oda tipinde, aynı cinsiyetten kişilerin kaldığı ve boş yatağı
 *    olan odaya (en dolu olana); yoksa yeni oda açılır.
 * Cinsiyeti ya da oda tipi girilmemiş tek kayıtlar ve ailesiz bebekler atlanır.
 */
export function planAutoPlacement(rooms: Room[], people: RoomPerson[]): AutoPlan {
  const placedBy = groupByRoom(people);
  const state: PlanRoom[] = sortRooms(rooms).map((r) => ({ ...r, people: [...(placedBy.get(r.id) ?? [])], isNew: false, added: [] }));
  let tempId = -1;
  const skipped: AutoPlan["skipped"] = [];
  const free = (r: PlanRoom) => r.size - bedsUsed(r.people);
  const put = (r: PlanRoom, ps: RoomPerson[]) => {
    r.people.push(...ps);
    r.added.push(...ps);
  };
  const newRoom = (size: number) => {
    const r: PlanRoom = { id: tempId--, size, people: [], isNew: true, added: [] };
    state.push(r);
    return r;
  };
  /** Aynı cinsiyetten kişilerin kaldığı (veya boş) ve yeterli boş yatağı olan oda: aynı gruptakiler, sonra en dolu olan önce */
  const openRoom = (size: number, gender: Gender, need: number, groupId: number | null = null) => {
    const ownGroup = (r: PlanRoom) => (groupId != null && r.people.some((p) => p.groupId === groupId) ? 0 : 1);
    return state
      .filter((r) => r.size === size && free(r) >= need && (r.people.length === 0 || roomGender(r.people) === gender))
      .sort((a, b) => ownGroup(a) - ownGroup(b) || free(a) - free(b) || Number(a.people.length === 0) - Number(b.people.length === 0))[0];
  };

  const units = new Map<string, RoomPerson[]>();
  for (const p of people) if (p.roomId == null) units.set(unitKey(p), [...(units.get(unitKey(p)) ?? []), p]);
  const families = [...units.values()].filter((u) => u[0].groupId != null).sort((a, b) => bedsUsed(b) - bedsUsed(a));
  const singles = [...units.values()].filter((u) => u[0].groupId == null).map((u) => u[0]);

  for (const members of families) {
    const groupId = members[0].groupId;
    const adults = members.filter((p) => takesBed(p.passenger));
    const babies = members.filter((p) => !takesBed(p.passenger));
    const familyRooms = () => state.filter((r) => r.people.some((p) => p.groupId === groupId));
    const size = unitRoomSize(members);
    if (adults.length && !size) {
      for (const p of members) skipped.push({ saleId: p.saleId, name: p.name, reason: "Satışta oda tipi seçilmemiş" });
      continue;
    }
    const kinOf = (p: RoomPerson) => surnameOf(p.name);

    if (adults.length && adults.length <= size! && familyRooms().length === 0) {
      // Grup tek odaya sığıyor: hepsi birlikte (odayı doldurmuyorsa ve tek cinsiyetliyse aynı cinsiyetten kişilerin odasına da girebilir)
      const gender = roomGender(adults);
      put((adults.length < size! && gender ? openRoom(size!, gender, adults.length, groupId) : undefined) ?? newRoom(size!), adults);
    } else if (adults.length) {
      // Grubun zaten kaldığı odalardaki boş yataklar: önce aynı soyadlılar, oda tek cinsiyetliyse aynı cinsiyetten olanlar
      const rest = [...adults];
      for (const r of familyRooms()) {
        const kin = new Set(r.people.filter((p) => p.groupId === groupId).map(kinOf).filter(Boolean));
        const gender = roomGender(r.people);
        const picks = [...rest.filter((p) => kin.has(kinOf(p))), ...(gender ? rest.filter((p) => p.gender === gender && !kin.has(kinOf(p))) : [])].slice(0, free(r));
        if (!picks.length) continue;
        put(r, picks);
        for (const p of picks) rest.splice(rest.indexOf(p), 1);
      }
      // Kalanlar: aynı soyadlılar birlikte, tek cinsiyetli kümeler aynı cinsiyetten kişilerin odasına
      for (const cluster of surnameClusters(rest, size!)) {
        const gender = roomGender(cluster);
        put((gender ? openRoom(size!, gender, cluster.length, groupId) : undefined) ?? newRoom(size!), cluster);
      }
    }
    if (babies.length) {
      for (const b of babies) {
        const rooms = familyRooms();
        const home = rooms.find((r) => r.people.some((p) => p.groupId === groupId && takesBed(p.passenger) && kinOf(p) && kinOf(p) === kinOf(b))) ?? rooms[0];
        if (home) put(home, [b]);
        else skipped.push({ saleId: b.saleId, name: b.name, reason: "Bebek: ailesinden yetişkin yok" });
      }
    }
  }

  for (const p of singles) {
    if (!takesBed(p.passenger)) {
      skipped.push({ saleId: p.saleId, name: p.name, reason: "Bebek: ailesiyle aynı gruba alın ya da elle yerleştirin" });
      continue;
    }
    if (!isRoomSize(p.roomSize)) {
      skipped.push({ saleId: p.saleId, name: p.name, reason: "Satışta oda tipi seçilmemiş" });
      continue;
    }
    if (!p.gender) {
      skipped.push({ saleId: p.saleId, name: p.name, reason: "Cinsiyeti girilmemiş" });
      continue;
    }
    put(openRoom(p.roomSize, p.gender, 1) ?? newRoom(p.roomSize), [p]);
  }

  return {
    assign: state.filter((r) => !r.isNew).flatMap((r) => r.added.map((p) => ({ saleId: p.saleId, roomId: r.id }))),
    create: state.filter((r) => r.isNew).map((r) => ({ size: r.size, saleIds: r.added.map((p) => p.saleId) })),
    skipped,
  };
}
