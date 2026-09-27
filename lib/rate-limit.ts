import "server-only";
import { headers } from "next/headers";

/**
 * Basit, bellek içi hız sınırlayıcı (tek sunucu için yeterli).
 * Birden fazla sunucu örneğinde Redis gibi paylaşılan bir depo gerekir.
 */

type Bucket = { hits: number[] };

const globalForRl = globalThis as unknown as { __rateLimit?: Map<string, Bucket> };
const store = (globalForRl.__rateLimit ??= new Map<string, Bucket>());

function prune(bucket: Bucket, windowMs: number, now: number) {
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
}

/** Limit aşıldıysa kaç saniye beklenmesi gerektiğini, aşılmadıysa 0 döndürür */
export function retryAfter(key: string, limit: number, windowMs: number): number {
  const bucket = store.get(key);
  if (!bucket) return 0;
  const now = Date.now();
  prune(bucket, windowMs, now);
  if (bucket.hits.length < limit) return 0;
  return Math.ceil((bucket.hits[0] + windowMs - now) / 1000);
}

export function registerHit(key: string) {
  const bucket = store.get(key) ?? { hits: [] };
  bucket.hits.push(Date.now());
  store.set(key, bucket);
  // Bellek büyümesini sınırla
  if (store.size > 5000) {
    const first = store.keys().next().value;
    if (first) store.delete(first);
  }
}

export function clearHits(key: string) {
  store.delete(key);
}

/** İstemci IP adresi (proxy arkasında x-forwarded-for) */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip") ?? "local";
}

export function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds} saniye`;
  return `${Math.ceil(seconds / 60)} dakika`;
}
