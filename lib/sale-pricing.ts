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
