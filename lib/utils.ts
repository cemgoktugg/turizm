import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Para birimi sembolü */
export function currencySymbol(currency?: string | null) {
  switch (currency) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "TRY":
      return "₺";
    default:
      return currency ? `${currency} ` : "";
  }
}

/** Fiyatı okunaklı biçimde formatla (ör. $1.850) */
export function formatPrice(
  price?: number | null,
  currency: string = "USD",
): string {
  if (price === null || price === undefined) return "Fiyat için arayınız";
  const formatted = new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 0,
  }).format(price);
  return `${currencySymbol(currency)}${formatted}`;
}

/** Tarih aralığını Türkçe biçimde göster */
export function formatDateRange(
  start?: Date | string | null,
  end?: Date | string | null,
): string | null {
  if (!start) return null;
  const s = new Date(start);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
  const fmt = (d: Date) => d.toLocaleDateString("tr-TR", opts);
  if (!end) return `${fmt(s)} ${s.getFullYear()}`;
  const e = new Date(end);
  return `${fmt(s)} - ${fmt(e)} ${e.getFullYear()}`;
}

export function formatDate(date?: Date | string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Veritabanında çok satırlı metinleri "\n" ile ayrılmış string olarak
 * saklıyoruz. Bunu diziye çevirmek için yardımcı.
 */
export function splitLines(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Görsel alanları "\n" ile ayrılmış URL listesi olarak saklanır */
export function parseImages(value?: string | null): string[] {
  return splitLines(value);
}

/** Basit slug oluşturucu (Türkçe karakter desteği) */
export function toSlug(input: string): string {
  const map: Record<string, string> = {
    ç: "c",
    ğ: "g",
    ı: "i",
    İ: "i",
    ö: "o",
    ş: "s",
    ü: "u",
    Ç: "c",
    Ğ: "g",
    Ö: "o",
    Ş: "s",
    Ü: "u",
  };
  return input
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
