/**
 * Dönüşüm olayları. Ölçüm araçları yüklü değilse (kimlik girilmemiş veya
 * çerez onayı verilmemiş) sessizce hiçbir şey yapmaz.
 */
type Gtag = (...args: unknown[]) => void;
type Fbq = (...args: unknown[]) => void;

export type TrackEvent = "lead" | "whatsapp" | "phone";

export function track(event: TrackEvent, params: Record<string, string | number | undefined> = {}) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: Gtag; fbq?: Fbq };
  try {
    if (event === "lead") {
      w.gtag?.("event", "generate_lead", params);
      w.fbq?.("track", "Lead", params);
    } else {
      w.gtag?.("event", "contact", { method: event, ...params });
      w.fbq?.("track", "Contact", { method: event });
    }
  } catch {
    /* ölçüm hataları siteyi etkilemez */
  }
}
