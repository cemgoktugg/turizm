import { fill } from "./content/template";

/** 1 birim dövizin TL karşılığı (ör. { USD: 49.65, EUR: 57.8 }) */
export type TryRates = Partial<Record<string, number>>;

/** Fiyatı TL'ye çevirir; TL fiyatlar olduğu gibi döner, kur yoksa null */
export function toTry(price: number, currency: string | null | undefined, rates: TryRates | null): number | null {
  const cur = currency || "USD";
  if (cur === "TRY") return price;
  const rate = rates?.[cur];
  return rate ? price * rate : null;
}

/**
 * Döviz fiyatının yaklaşık TL karşılığı, panelde tanımlı biçimle ("≈ {tutar}").
 * Fiyat zaten TL ise, kur alınamadıysa veya biçim boş bırakıldıysa null döner.
 */
export function formatTry(
  price: number | null | undefined,
  currency: string | null | undefined,
  rates: TryRates | null,
  format: string,
): string | null {
  if (price == null || !format.trim() || (currency || "USD") === "TRY") return null;
  const tl = toTry(price, currency, rates);
  if (tl == null) return null;
  const rounded = Math.round(tl / 10) * 10;
  return fill(format, { tutar: `${new Intl.NumberFormat("tr-TR").format(rounded)} ₺` });
}
