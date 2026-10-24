import { toTry, type TryRates } from "./currency";
import { currencySymbol } from "./utils";
import { fill } from "./content/template";

/** /turlar sayfasındaki arama ve filtre seçimleri (adres çubuğundaki ?q=…&ay=… değerleri) */
export type TourFilters = {
  kategori?: string;
  q?: string;
  /** Kalkış ayı: "2026-11" */
  ay?: string;
  /** Gün sayısı */
  sure?: number;
  kalkis?: string;
  /** Üst bütçe (en yaygın para biriminde) */
  butce?: number;
  sirala: SortKey;
};

export const SORT_KEYS = ["onerilen", "tarih", "fiyat-artan", "fiyat-azalan"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export type SearchableTour = {
  code: string | null;
  title: string;
  badge?: string | null;
  shortDescription?: string | null;
  departureDate: Date | null;
  durationDays: number | null;
  departureCity: string | null;
  startingPrice: number | null;
  currency: string;
  isFeatured: boolean;
  category: { slug: string; name: string };
};

type Params = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string | undefined {
  const v = (Array.isArray(value) ? value[0] : value)?.trim();
  return v ? v.slice(0, 100) : undefined;
}

function positiveInt(value: string | undefined): number | undefined {
  const n = value ? Number.parseInt(value, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function parseTourFilters(sp: Params): TourFilters {
  const ay = one(sp.ay);
  const sirala = one(sp.sirala);
  return {
    kategori: one(sp.kategori),
    q: one(sp.q),
    ay: ay && /^\d{4}-\d{2}$/.test(ay) ? ay : undefined,
    sure: positiveInt(one(sp.sure)),
    kalkis: one(sp.kalkis),
    butce: positiveInt(one(sp.butce)),
    sirala: (SORT_KEYS as readonly string[]).includes(sirala ?? "") ? (sirala as SortKey) : "onerilen",
  };
}

/** Filtreleri adres parametrelerine çevirir (boş/varsayılan değerler yazılmaz) */
export function filtersToQuery(f: Partial<TourFilters>): Record<string, string> {
  const out: Record<string, string> = {};
  if (f.kategori) out.kategori = f.kategori;
  if (f.q) out.q = f.q;
  if (f.ay) out.ay = f.ay;
  if (f.sure) out.sure = String(f.sure);
  if (f.kalkis) out.kalkis = f.kalkis;
  if (f.butce) out.butce = String(f.butce);
  if (f.sirala && f.sirala !== "onerilen") out.sirala = f.sirala;
  return out;
}

/** Türkçe karakter ve büyük/küçük harf farkını yok sayan arama metni */
export function normalizeSearch(text: string): string {
  return text
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşüâîû]/g, (ch) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" })[ch] ?? ch)
    .replace(/\s+/g, " ")
    .trim();
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Listede en çok kullanılan para birimi (bütçe seçenekleri bu birimde gösterilir) */
export function dominantCurrency(tours: SearchableTour[]): string {
  const counts = new Map<string, number>();
  for (const t of tours) if (t.startingPrice != null) counts.set(t.currency, (counts.get(t.currency) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "USD";
}

/** Fiyatı başka bir para birimine çevirir; kur yoksa olduğu gibi döner */
function convert(price: number, from: string, to: string, rates: TryRates | null): number {
  if (from === to) return price;
  const tl = toTry(price, from, rates);
  const target = to === "TRY" ? 1 : rates?.[to];
  return tl != null && target ? tl / target : price;
}

/** Bütçe adımları için yuvarlak üst sınır (1.320 → 1.500, 3.150 → 3.500) */
function niceCeil(v: number): number {
  const step = v < 1000 ? 100 : v < 2000 ? 250 : v < 5000 ? 500 : v < 20000 ? 1000 : 5000;
  return Math.ceil(v / step) * step;
}

export type FilterChoices = {
  months: { value: string; label: string }[];
  durations: number[];
  cities: string[];
  budgets: { value: number; label: string }[];
};

function monthLabel(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
}

/**
 * Mevcut turlardan seçenek listeleri — yalnız sonuç verecek seçenekler sunulur.
 * Seçili değer listede yoksa (ör. kategori değişince) yine de eklenir ki seçim görünür kalsın.
 */
export function buildFilterChoices(
  tours: SearchableTour[],
  rates: TryRates | null,
  currency: string,
  budgetFormat: string,
  selected?: TourFilters,
): FilterChoices {
  const months = new Map<string, string>();
  const durations = new Set<number>();
  const cities = new Set<string>();
  const prices: number[] = [];

  for (const t of tours) {
    if (t.departureDate) {
      const d = new Date(t.departureDate);
      months.set(monthKey(d), monthLabel(d.getFullYear(), d.getMonth()));
    }
    if (t.durationDays) durations.add(t.durationDays);
    if (t.departureCity?.trim()) cities.add(t.departureCity.trim());
    if (t.startingPrice != null) prices.push(convert(t.startingPrice, t.currency, currency, rates));
  }

  // Bütçe: fiyat dağılımının çeyreklerine denk gelen yuvarlak sınırlar
  const budgets: number[] = [];
  prices.sort((a, b) => a - b);
  if (prices.length >= 3) {
    const max = prices[prices.length - 1];
    for (const q of [0.25, 0.5, 0.75, 0.9]) {
      const v = niceCeil(prices[Math.floor(q * (prices.length - 1))]);
      if (v < max && !budgets.includes(v)) budgets.push(v);
    }
  }
  if (selected?.ay && !months.has(selected.ay)) {
    const [y, m] = selected.ay.split("-").map(Number);
    months.set(selected.ay, monthLabel(y, m - 1));
  }
  if (selected?.sure) durations.add(selected.sure);
  if (selected?.kalkis && ![...cities].some((c) => normalizeSearch(c) === normalizeSearch(selected.kalkis!))) {
    cities.add(selected.kalkis);
  }
  if (selected?.butce && !budgets.includes(selected.butce)) {
    budgets.push(selected.butce);
    budgets.sort((a, b) => a - b);
  }
  const money = (v: number) => `${currencySymbol(currency)}${new Intl.NumberFormat("tr-TR").format(v)}`;

  return {
    months: [...months].sort(([a], [b]) => a.localeCompare(b)).map(([value, label]) => ({ value, label })),
    durations: [...durations].sort((a, b) => a - b),
    cities: [...cities].sort((a, b) => a.localeCompare(b, "tr")),
    budgets: budgets.map((v) => ({ value: v, label: fill(budgetFormat, { tutar: money(v) }) })),
  };
}

/** Kategori dışındaki filtreleri uygular */
export function filterTours<T extends SearchableTour>(
  tours: T[],
  f: TourFilters,
  rates: TryRates | null,
  currency: string,
): T[] {
  const terms = f.q ? normalizeSearch(f.q).split(" ") : [];
  const city = f.kalkis ? normalizeSearch(f.kalkis) : null;

  return tours.filter((t) => {
    if (terms.length) {
      const haystack = normalizeSearch(
        [t.code, t.title, t.badge, t.category.name, t.departureCity, t.shortDescription].filter(Boolean).join(" "),
      );
      if (!terms.every((term) => haystack.includes(term))) return false;
    }
    if (f.ay && (!t.departureDate || monthKey(new Date(t.departureDate)) !== f.ay)) return false;
    if (f.sure && t.durationDays !== f.sure) return false;
    if (city && normalizeSearch(t.departureCity ?? "") !== city) return false;
    if (f.butce && (t.startingPrice == null || convert(t.startingPrice, t.currency, currency, rates) > f.butce)) return false;
    return true;
  });
}

/** Sıralama: önerilen (öne çıkanlar önce), tarih veya fiyat */
export function sortTours<T extends SearchableTour>(tours: T[], sort: SortKey, rates: TryRates | null): T[] {
  const time = (t: T) => (t.departureDate ? new Date(t.departureDate).getTime() : Number.POSITIVE_INFINITY);
  const price = (t: T) =>
    t.startingPrice == null ? null : (toTry(t.startingPrice, t.currency, rates) ?? t.startingPrice);
  const byPrice = (dir: 1 | -1) => (a: T, b: T) => {
    const pa = price(a);
    const pb = price(b);
    if (pa == null || pb == null) return pa == null ? (pb == null ? 0 : 1) : -1; // fiyatsızlar sona
    return (pa - pb) * dir || time(a) - time(b);
  };

  const sorted = [...tours];
  if (sort === "fiyat-artan") sorted.sort(byPrice(1));
  else if (sort === "fiyat-azalan") sorted.sort(byPrice(-1));
  else if (sort === "tarih") sorted.sort((a, b) => time(a) - time(b));
  else sorted.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || time(a) - time(b));
  return sorted;
}
