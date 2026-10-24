import "server-only";
import type { TryRates } from "./currency";

const TCMB_URL = "https://www.tcmb.gov.tr/kurlar/today.xml";
const TTL = 3 * 60 * 60 * 1000; // 3 saat
const RETRY_AFTER_FAIL = 10 * 60 * 1000; // hata sonrası 10 dk bekle

let cache: { rates: TryRates | null; fetchedAt: number; ok: boolean } | null = null;
let inflight: Promise<TryRates | null> | null = null;

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

async function fetchRates(): Promise<TryRates | null> {
  try {
    const res = await fetch(TCMB_URL, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`TCMB ${res.status}`);
    const rates = parseTcmb(await res.text());
    if (!rates.USD) throw new Error("TCMB yanıtında USD kuru yok");
    cache = { rates, fetchedAt: Date.now(), ok: true };
  } catch (err) {
    console.error("[kur]", err instanceof Error ? err.message : err);
    // Son bilinen kur varsa onu kullanmaya devam et
    cache = { rates: cache?.rates ?? null, fetchedAt: Date.now(), ok: false };
  }
  return cache.rates;
}

/**
 * Güncel döviz kurları (TL). Sonuç bellekte tutulur; TCMB'ye ulaşılamazsa son
 * bilinen kur, hiç alınamadıysa null döner (TL karşılığı o zaman gösterilmez).
 */
export async function getTryRates(): Promise<TryRates | null> {
  if (cache) {
    const age = Date.now() - cache.fetchedAt;
    if (age < (cache.ok ? TTL : RETRY_AFTER_FAIL)) return cache.rates;
  }
  inflight ??= fetchRates().finally(() => {
    inflight = null;
  });
  return inflight;
}
