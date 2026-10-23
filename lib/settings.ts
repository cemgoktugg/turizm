import { cache } from "react";
import { prisma } from "./prisma";
import type { SettingsInput } from "./validations";

export type SiteSettings = SettingsInput & { raw: Record<string, string> };

/** Veritabanında değer yoksa kullanılan varsayılanlar */
export const SETTING_DEFAULTS: SettingsInput = {
  siteName: "Rotamız Huzura",
  tagline: "Hac & Umre Turizm",
  logo: "/images/nemira-logo.png",
  logoLight: "/images/nemira-logo-light.png",
  footerNote: "Yetkili acenta güvencesiyle hac, umre ve kültür turları düzenliyoruz.",
  phone: "+90 850 000 00 00",
  whatsapp: "905000000000",
  email: "info@rotamizhuzura.com",
  workingHours: "Hafta içi 09:00 - 18:00",
  address: "Merkez Mah. Huzur Cad. No:1 Fatih / İstanbul",
  facebook: "",
  instagram: "",
  youtube: "",
  twitter: "",
  tiktok: "",
  linkedin: "",
  telegram: "",
  mapEmbed: "",
  seoTitle: "Rotamız Huzura | Hac & Umre Turizm",
  seoDescription:
    "Yetkili acenta güvencesiyle premium hac ve umre programları, lüks umre, Ramazan umresi ve kültür turları. Merkezi oteller, tecrübeli rehberlik ve şeffaf fiyat.",
  seoKeywords:
    "umre, hac, umre turları, lüks umre, ramazan umresi, hac programları, mekke otelleri, medine otelleri, kültür turları",
  ogImage: "/images/nemira-og.png",
  favicon: "/images/nemira-icon.png",
};

/** Boş bırakıldığında varsayılana dönmemesi gereken (isteğe bağlı) alanlar */
const OPTIONAL_KEYS = new Set<keyof SettingsInput>([
  "facebook",
  "instagram",
  "youtube",
  "twitter",
  "tiktok",
  "linkedin",
  "telegram",
  "mapEmbed",
]);

/** Site ayarlarını DB'den yükler (istek başına önbelleklenir) */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  let raw: Record<string, string> = {};
  try {
    const rows = await prisma.siteSetting.findMany();
    raw = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    raw = {};
  }

  const out = { ...SETTING_DEFAULTS } as SettingsInput;
  for (const key of Object.keys(SETTING_DEFAULTS) as (keyof SettingsInput)[]) {
    const value = raw[key];
    if (value === undefined) continue;
    if (value.trim() === "" && !OPTIONAL_KEYS.has(key)) continue;
    out[key] = value;
  }
  return { ...out, raw };
});

/** WhatsApp linki üretir */
export function whatsappLink(number: string, text?: string): string {
  const clean = number.replace(/\D/g, "");
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${clean}${q}`;
}

/** Telefon linki */
export function telLink(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
