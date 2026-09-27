import { cache } from "react";
import { prisma } from "./prisma";
import { splitLines } from "./utils";

export type SiteSettings = {
  siteName: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  workingHours: string;
  facebook: string;
  instagram: string;
  youtube: string;
  twitter: string;
  logo: string;
  mapEmbed: string;
  footerNote: string;
  heroSlides: string[];
  raw: Record<string, string>;
};

const DEFAULTS: Omit<SiteSettings, "raw" | "heroSlides"> = {
  siteName: "Rotamız Huzura",
  tagline: "Hac & Umre Turizm",
  phone: "+90 850 000 00 00",
  whatsapp: "905000000000",
  email: "info@rotamizhuzura.com",
  address: "Merkez Mah. Huzur Cad. No:1 Fatih / İstanbul",
  workingHours: "Hafta içi 09:00 - 18:00",
  facebook: "",
  instagram: "",
  youtube: "",
  twitter: "",
  logo: "/images/logo-mark.svg",
  mapEmbed: "",
  footerNote: "",
};

/** Site ayarlarını DB'den yükler (istek başına önbelleklenir) */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  let raw: Record<string, string> = {};
  try {
    const rows = await prisma.siteSetting.findMany();
    raw = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    raw = {};
  }

  return {
    siteName: raw.siteName || DEFAULTS.siteName,
    tagline: raw.tagline || DEFAULTS.tagline,
    phone: raw.phone || DEFAULTS.phone,
    whatsapp: raw.whatsapp || DEFAULTS.whatsapp,
    email: raw.email || DEFAULTS.email,
    address: raw.address || DEFAULTS.address,
    workingHours: raw.workingHours || DEFAULTS.workingHours,
    facebook: raw.facebook || DEFAULTS.facebook,
    instagram: raw.instagram || DEFAULTS.instagram,
    youtube: raw.youtube || DEFAULTS.youtube,
    twitter: raw.twitter || DEFAULTS.twitter,
    logo: raw.logo || DEFAULTS.logo,
    mapEmbed: raw.mapEmbed || DEFAULTS.mapEmbed,
    footerNote: raw.footerNote || DEFAULTS.footerNote,
    heroSlides: splitLines(raw.heroSlides).length
      ? splitLines(raw.heroSlides)
      : ["/images/hero-1.svg", "/images/hero-2.svg", "/images/hero-3.svg"],
    raw,
  };
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
