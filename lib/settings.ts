import { cache } from "react";
import { prisma } from "./prisma";
import type { SettingsInput } from "./validations";

export type SiteSettings = SettingsInput & { raw: Record<string, string> };

/** Veritabanında değer yoksa kullanılan varsayılanlar */
export const SETTING_DEFAULTS: SettingsInput = {
  siteName: "Nemira Turizm",
  tagline: "En Güzele, En İyiyle",
  logo: "/images/nemira-logo.png",
  logoLight: "/images/nemira-logo-light.png",
  footerNote: "Yetkili acenta güvencesiyle hac, umre ve kültür turları düzenliyoruz.",
  phone: "0501 565 58 44",
  whatsapp: "905015655844",
  email: "info@nemiraturizm.com",
  workingHours: "Hafta içi 09:00 - 18:00",
  address: "Camii Kebir Mah. Ulu Cami Sok. Ulu Çarşı No:4/A Merkez / Sivas",
  facebook: "",
  instagram: "",
  youtube: "",
  twitter: "",
  tiktok: "",
  linkedin: "",
  telegram: "",
  mapEmbed:
    "https://maps.google.com/maps?q=Nemira%20Turizm%2C%20Cami-i%20Kebir%2C%20Ulu%20Camii%20Sk.%20No%3A4%2C%20Sivas%20Merkez%2C%20Sivas&z=17&hl=tr&output=embed",
  companyTitle: "Hayrabat Turizm",
  tursabNo: "11883",
  mersisNo: "",
  taxInfo: "",
  gaId: "",
  metaPixelId: "",
  googleVerification: "",
  seoTitle: "En Güzele, En İyiyle | Nemira Turizm",
  seoDescription:
    "Yetkili acenta güvencesiyle premium hac ve umre programları, lüks umre, Ramazan umresi ve kültür turları. Merkezi oteller, tecrübeli rehberlik ve şeffaf fiyat.",
  seoKeywords:
    "umre, hac, umre turları, sivas umre turları, lüks umre, ramazan umresi, hac programları, mekke otelleri, medine otelleri, kültür turları",
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
  "companyTitle",
  "tursabNo",
  "mersisNo",
  "taxInfo",
  "gaId",
  "metaPixelId",
  "googleVerification",
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
