/**
 * Satışta liste fiyatı / anlaşılan fiyat (pazarlık) hesapları.
 * Hem sunucuda hem formda kullanılır; veritabanına dokunmaz.
 */

/** Bu orandan büyük indirimde uyarı gösterilir (engellemez) */
export const DISCOUNT_WARN_RATE = 0.1;

/**
 * Turun liste fiyatı: oda tipi seçildiyse o odanın kişi başı ücreti.
 * Oda seçilmediyse ve turun tek oda fiyatı varsa o; birden çok fiyat varsa
 * hangisinin geçerli olduğu bilinmediğinden null (indirim hesaplanmaz).
 */
export function listPriceOf(prices: Record<number, number | null | undefined>, roomSize?: number | null): number | null {
  if (roomSize) return prices[roomSize] ?? null;
  const defined = Object.values(prices).filter((p): p is number => p != null);
  return defined.length === 1 ? defined[0] : null;
}

/** Turun price2/3/4 alanlarından oda → fiyat haritası */
export function tourPriceMap(t: { price2: number | null; price3: number | null; price4: number | null }) {
  return { 2: t.price2, 3: t.price3, 4: t.price4 };
}

/** Yolcu tipleri: boş = yetişkin (oda fiyatı), diğerleri yaşa göre çocuk ücreti */
export const PASSENGER_TYPES = { "0-2": "0-2 yaş bebek", "2-6": "2-6 yaş çocuk", "6-11": "6-11 yaş çocuk" } as const;
export type PassengerType = keyof typeof PASSENGER_TYPES;
export const PASSENGER_KEYS = Object.keys(PASSENGER_TYPES) as PassengerType[];

export function isPassengerType(v: unknown): v is PassengerType {
  return typeof v === "string" && Object.hasOwn(PASSENGER_TYPES, v);
}

/** Oda ve çocuk yaş grubu tek satırda: "3 kişilik oda · 2-6 yaş çocuk" (yetişkinde yalnızca oda; ikisi de yoksa boş) */
export function roomAndPassenger(roomSize: number | null | undefined, passenger: string | null | undefined) {
  return [roomSize ? `${roomSize} kişilik oda` : null, isPassengerType(passenger) ? PASSENGER_TYPES[passenger] : null].filter(Boolean).join(" · ");
}

/** "Yetişkin" / "2-6 yaş çocuk" */
export function passengerLabel(passenger: string | null | undefined) {
  return isPassengerType(passenger) ? PASSENGER_TYPES[passenger] : "Yetişkin";
}

/** Turun çocuk ücretleri: yaş grubu → ücret (girilmemiş olanlar yok) */
export function childPriceMap(t: { priceAge0to2: number | null; priceAge2to6: number | null; priceAge6to11: number | null }) {
  const map: Partial<Record<PassengerType, number>> = {};
  if (t.priceAge0to2 != null) map["0-2"] = t.priceAge0to2;
  if (t.priceAge2to6 != null) map["2-6"] = t.priceAge2to6;
  if (t.priceAge6to11 != null) map["6-11"] = t.priceAge6to11;
  return map;
}

/** Satışın liste fiyatı: çocukta yaş grubunun ücreti, yetişkinde oda fiyatı (bkz. listPriceOf) */
export function saleListPrice(
  rooms: Record<number, number | null | undefined>,
  children: Partial<Record<PassengerType, number>>,
  roomSize?: number | null,
  passenger?: string | null,
): number | null {
  if (isPassengerType(passenger)) return children[passenger] ?? null;
  return listPriceOf(rooms, roomSize);
}

/** Liste fiyatının altında satıldıysa indirim tutarı ve oranı; değilse null */
export function discountOf(listPrice: number | null | undefined, price: number | null | undefined) {
  if (listPrice == null || price == null || !Number.isFinite(price) || listPrice <= 0 || price >= listPrice) return null;
  const amount = listPrice - price;
  const rate = amount / listPrice;
  return { amount, rate, warn: rate > DISCOUNT_WARN_RATE };
}

/** %8,3 biçiminde oran */
export function percent(rate: number) {
  return `%${(rate * 100).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`;
}
