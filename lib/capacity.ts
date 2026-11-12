/**
 * Tur kontenjanı (sunucu ve formlar ortak kullanır). İptal edilmemiş her satış
 * bir kişilik yer kaplar; kontenjan girilmemiş turda sınır yoktur.
 */

/** Bu kadar veya daha az boş yer kalınca uyarı rengi gösterilir */
export const FEW_SEATS = 5;

/** Boş yer; kontenjan girilmemişse null (sınır yok) */
export function seatsLeft(capacity: number | null | undefined, sold: number): number | null {
  return capacity == null ? null : capacity - sold;
}

/** Eklenecek kişiler kontenjanı aşıyorsa hata metni, aşmıyorsa null */
export function capacityError(tourName: string, capacity: number | null | undefined, sold: number, adding = 1): string | null {
  const left = seatsLeft(capacity, sold);
  if (left == null || adding <= left) return null;
  if (left <= 0) return `Kontenjan dolu: ${tourName} (${sold}/${capacity} kişi). Gerekirse tur kaydından kontenjanı artırın.`;
  return `${tourName}: ${left} boş yer var, ${adding} kişi eklenemez.`;
}

/** Tur seçim listesindeki kısa doluluk etiketi (" · 13 yer" / " · DOLU") */
export function seatLabel(capacity: number | null | undefined, sold: number): string {
  const left = seatsLeft(capacity, sold);
  if (left == null) return "";
  return left <= 0 ? " · DOLU" : ` · ${left} yer`;
}
