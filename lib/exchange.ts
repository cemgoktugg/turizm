import "server-only";
import { prisma } from "./prisma";
import type { TryRates } from "./currency";

const TCMB_URL = "https://www.tcmb.gov.tr/kurlar/today.xml";
const FRESH = 3 * 60 * 60 * 1000; // 3 saatte bir yenile
const RETRY = 10 * 60 * 1000; // başarısız denemeden sonra 10 dk bekle
const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 günden eski kur gösterilmez
const TIMEOUT = 15_000; // TCMB zaman zaman 5–10 sn'de yanıt veriyor
/** Son alınan kur, sunucu yeniden başlasa da kaybolmasın diye site ayarlarında saklanır */
const STORE_KEY = "_fxRates";

let cache: { rates: TryRates; at: number } | null = null;
let loading: Promise<void> | null = null;
let refreshing: Promise<void> | null = null;
let lastAttempt = 0;

/** TCMB günlük bülteninden 1 birim dövizin TL karşılığı (döviz satış kuru) */
function parseTcmb(xml: string): TryRates {
  const rates: TryRates = {};
  const re = /<Currency[^>]*\bKod="([A-Z]{3})"[\s\S]*?<Unit>(\d+)<\/Unit>[\s\S]*?<ForexSelling>([\d.]+)<\/ForexSelling>/g;
  for (const [, code, unit, selling] of xml.matchAll(re)) {
    const value = Number(selling) / Number(unit);
    if (Number.isFinite(value) && value > 0) rates[code] = value;
  }
  return rates;
}

async function loadStored() {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: STORE_KEY } });
    const data = row ? (JSON.parse(row.value) as { rates?: TryRates; at?: number }) : null;
    if (data?.rates?.USD && typeof data.at === "number" && !cache) cache = { rates: data.rates, at: data.at };
  } catch {
    /* saklanan kur yoksa TCMB'den alınır */
  }
}

async function refresh() {
  lastAttempt = Date.now();
  try {
    const res = await fetch(TCMB_URL, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) throw new Error(`TCMB ${res.status}`);
    const rates = parseTcmb(await res.text());
    if (!rates.USD) throw new Error("TCMB yanıtında USD kuru yok");
    cache = { rates, at: Date.now() };
    const value = JSON.stringify(cache);
    await prisma.siteSetting.upsert({ where: { key: STORE_KEY }, update: { value }, create: { key: STORE_KEY, value } });
  } catch (err) {
    console.warn("[kur] TCMB'ye ulaşılamadı, son bilinen kur kullanılıyor:", err instanceof Error ? err.message : err);
  }
}

/**
 * Güncel döviz kurları (TL). Sayfa TCMB'yi beklemez: eldeki kur (gerekirse
 * veritabanında saklanan son kur) hemen döner, eskimişse arka planda yenilenir.
 * Hiç kur yoksa veya 7 günden eskiyse null döner (TL karşılığı gösterilmez).
 */
export async function getTryRates(): Promise<TryRates | null> {
  if (!cache) {
    loading ??= loadStored();
    await loading;
  }

  const now = Date.now();
  const stale = !cache || now - cache.at > FRESH;
  if (stale && !refreshing && now - lastAttempt > RETRY) {
    refreshing = refresh().finally(() => {
      refreshing = null;
    });
    // İlk kurulumda (hiç kur yokken) kısa bir süre bekle; gelmezse sonraki isteklerde görünür
    if (!cache) await Promise.race([refreshing, new Promise((r) => setTimeout(r, 2500))]);
  }

  return cache && now - cache.at < MAX_AGE ? cache.rates : null;
}
