/**
 * Dönüşüm olayları. Ölçüm araçları yüklü değilse (kimlik girilmemiş veya
 * çerez onayı verilmemiş) sessizce hiçbir şey yapmaz.
 */
type Gtag = (...args: unknown[]) => void;
type Fbq = (...args: unknown[]) => void;

export type TrackEvent = "lead" | "signup" | "whatsapp" | "phone";

export function track(event: TrackEvent, params: Record<string, string | number | undefined> = {}) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: Gtag; fbq?: Fbq };
  try {
    if (event === "lead") {
      w.gtag?.("event", "generate_lead", params);
      w.fbq?.("track", "Lead", params);
    } else if (event === "signup") {
      w.gtag?.("event", "sign_up", { method: "newsletter", ...params });
      w.fbq?.("track", "CompleteRegistration", { content_name: "newsletter" });
    } else {
      w.gtag?.("event", "contact", { method: event, ...params });
      w.fbq?.("track", "Contact", { method: event });
    }
  } catch {
    /* ölçüm hataları siteyi etkilemez */
  }
}
