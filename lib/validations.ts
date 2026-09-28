import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Yardımcılar                                                          */
/* ------------------------------------------------------------------ */

/** Boş bırakılabilen e-posta */
const optionalEmail = z
  .string()
  .trim()
  .email("Geçerli bir e-posta giriniz")
  .optional()
  .or(z.literal(""));

/**
 * Boş bırakılabilen sayı alanı.
 * `z.coerce.number()` boş metni 0'a çevirdiği için (ör. fiyat "0 $" görünür)
 * boş değerleri açıkça `undefined` yapıyoruz.
 */
function optionalNumber(opts: { min?: number; max?: number; int?: boolean } = {}) {
  let n = z.number({ error: "Geçerli bir sayı giriniz" });
  if (opts.int) n = n.int("Tam sayı giriniz");
  if (opts.min != null) n = n.min(opts.min, `En az ${opts.min} olmalı`);
  if (opts.max != null) n = n.max(opts.max, `En fazla ${opts.max} olmalı`);
  return z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    if (typeof v === "number") return Number.isNaN(v) ? undefined : v;
    const num = Number(String(v).replace(",", "."));
    return Number.isNaN(num) ? v : num;
  }, n.optional());
}

const optionalText = (max = 5000) => z.string().trim().max(max, `En fazla ${max} karakter`).optional();

/** Görsel yolu: site içi (/...) veya https:// adres */
const imagePath = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//i.test(v), {
    message: "Görsel yolu '/' ile veya 'https://' ile başlamalı",
  });

const slugField = z
  .string()
  .trim()
  .max(120)
  .optional()
  .refine((v) => !v || /^[a-z0-9-]+$/.test(v), {
    message: "Slug yalnızca küçük harf, rakam ve tire içerebilir",
  });

/* ------------------------------------------------------------------ */
/* Başvuru                                                              */
/* ------------------------------------------------------------------ */

export const LEAD_SOURCES = {
  "tur-detay": "Tur detay sayfası",
  rezervasyon: "Rezervasyon sayfası",
  iletisim: "İletişim sayfası",
} as const;
export type LeadSource = keyof typeof LEAD_SOURCES;

/** Başvuru / rezervasyon formu (honeypot ile spam koruması) */
export const leadSchema = z.object({
  fullName: z.string().trim().min(3, "Ad soyad en az 3 karakter olmalı").max(100),
  phone: z
    .string()
    .trim()
    .min(7, "Geçerli bir telefon numarası giriniz")
    .max(30)
    .refine((v) => (v.match(/\d/g) ?? []).length >= 7, "Geçerli bir telefon numarası giriniz"),
  email: optionalEmail,
  personCount: optionalNumber({ min: 1, max: 50, int: true }),
  tourId: z.string().max(40).optional(),
  tourTitle: z.string().max(200).optional(),
  message: z.string().max(1500, "Mesaj en fazla 1500 karakter olabilir").optional(),
  source: z.enum(Object.keys(LEAD_SOURCES) as [LeadSource, ...LeadSource[]]).optional(),
  // Honeypot — botlar doldurur, insanlar görmez
  website: z.string().max(0, "Spam tespit edildi").optional().or(z.literal("")),
});
export type LeadInput = z.infer<typeof leadSchema>;

/** Başvuru durumları */
export const LEAD_STATUSES = [
  "Yeni",
  "Arandı",
  "Teklif Verildi",
  "Rezervasyon Alındı",
  "İptal",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/* ------------------------------------------------------------------ */
/* Kimlik doğrulama & kullanıcılar                                      */
/* ------------------------------------------------------------------ */

export const loginSchema = z.object({
  email: z.string().trim().email("Geçerli bir e-posta giriniz"),
  password: z.string().min(1, "Şifre gerekli").max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

const strongPassword = z
  .string()
  .min(8, "Şifre en az 8 karakter olmalı")
  .max(200)
  .refine((v) => /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(v) && /\d/.test(v), "Şifre en az bir harf ve bir rakam içermeli");

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Ad en az 2 karakter olmalı").max(80),
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta giriniz"),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifrenizi girin"),
    newPassword: strongPassword,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "Yeni şifre mevcut şifreden farklı olmalı",
    path: ["newPassword"],
  });
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

export const userCreateSchema = profileSchema.extend({ password: strongPassword });
export type UserCreateInput = z.infer<typeof userCreateSchema>;

/* ------------------------------------------------------------------ */
/* Turlar                                                               */
/* ------------------------------------------------------------------ */

export const CURRENCIES = ["USD", "EUR", "TRY", "SAR"] as const;

export const priceRowSchema = z.object({
  roomType: z.string().trim().min(1, "Oda tipi gerekli").max(120),
  price: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number({ error: "Fiyat gerekli" }).min(0, "Fiyat negatif olamaz"),
  ),
});

export const dayRowSchema = z.object({
  dayNumber: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number({ error: "Gün numarası gerekli" }).int().min(1, "En az 1"),
  ),
  title: z.string().trim().min(1, "Gün başlığı gerekli").max(200),
  description: z.string().trim().min(1, "Gün açıklaması gerekli").max(3000),
});

/** Boş bırakılabilen http(s) bağlantısı (video, otel sitesi…) */
const optionalWebUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\//i.test(v), "Bağlantı http:// veya https:// ile başlamalı")
  .optional();

export const HOTEL_CARD_CITIES = ["Mekke", "Medine"] as const;

export const hotelRowSchema = z.object({
  city: z.string().trim().min(1, "Şehir gerekli").max(60),
  name: z.string().trim().min(1, "Otel adı gerekli").max(150),
  nights: optionalNumber({ min: 0, max: 90, int: true }),
  stars: optionalNumber({ min: 0, max: 5, int: true }),
  distance: optionalText(100),
  image: imagePath.optional(),
  videoUrl: optionalWebUrl,
  link: optionalWebUrl,
});

export const LEG_TYPES = { flight: "Uçuş", bus: "Otobüs / Transfer" } as const;
export type LegType = keyof typeof LEG_TYPES;

export const legRowSchema = z.object({
  type: z.enum(Object.keys(LEG_TYPES) as [LegType, ...LegType[]]),
  title: z.string().trim().min(1, "Başlık gerekli (ör. Gidiş)").max(60),
  carrier: optionalText(100),
  flightNo: optionalText(30),
  fromCode: optionalText(10),
  fromCity: optionalText(60),
  toCode: optionalText(10),
  toCity: optionalText(60),
  date: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || !Number.isNaN(new Date(v).getTime()), "Geçerli bir tarih giriniz"),
  time: optionalText(30),
});

export const faqRowSchema = z.object({
  question: z.string().trim().min(1, "Soru gerekli").max(300),
  answer: z.string().trim().min(1, "Cevap gerekli").max(3000),
});

const isoDate = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || !Number.isNaN(new Date(v).getTime()), "Geçerli bir tarih giriniz");

export const adminTourSchema = z
  .object({
    code: z
      .string()
      .trim()
      .max(20, "En fazla 20 karakter")
      .optional()
      .refine((v) => !v || /^[A-Za-z0-9-]+$/.test(v), "Tur no yalnızca harf, rakam ve tire içerebilir"),
    badge: optionalText(60),
    title: z.string().trim().min(3, "Başlık en az 3 karakter").max(200),
    slug: slugField,
    categoryId: z.string().min(1, "Kategori seçiniz"),
    shortDescription: optionalText(400),
    description: optionalText(10000),
    departureDate: isoDate,
    returnDate: isoDate,
    durationDays: optionalNumber({ min: 1, max: 365, int: true }),
    durationNights: optionalNumber({ min: 0, max: 365, int: true }),
    seatsLeft: optionalNumber({ min: 0, max: 999, int: true }),
    departureCity: optionalText(100),
    airline: optionalText(100),
    startingPrice: optionalNumber({ min: 0 }),
    currency: z.enum(CURRENCIES),
    priceNote: optionalText(120),
    coverImage: imagePath.optional(),
    images: z.array(imagePath).max(30, "En fazla 30 galeri görseli"),
    videoUrl: optionalWebUrl,
    includedServices: optionalText(),
    excludedServices: optionalText(),
    requiredDocuments: optionalText(),
    isFeatured: z.boolean(),
    isPublished: z.boolean(),
    seoTitle: optionalText(120),
    seoDescription: optionalText(320),
    prices: z.array(priceRowSchema).max(20),
    hotels: z.array(hotelRowSchema).max(10),
    legs: z.array(legRowSchema).max(12),
    dayPrograms: z.array(dayRowSchema).max(60),
    faqs: z.array(faqRowSchema).max(40),
  })
  .refine(
    (d) => !d.departureDate || !d.returnDate || new Date(d.returnDate) >= new Date(d.departureDate),
    { message: "Dönüş tarihi gidiş tarihinden önce olamaz", path: ["returnDate"] },
  );
export type AdminTourInput = z.infer<typeof adminTourSchema>;

/* ------------------------------------------------------------------ */
/* Kategoriler, oteller, blog, belgeler                                  */
/* ------------------------------------------------------------------ */

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Kategori adı gerekli").max(80),
  slug: slugField,
  description: optionalText(400),
  image: imagePath.optional(),
  icon: z.string().max(60).optional(),
  order: optionalNumber({ min: 0, max: 999, int: true }),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const HOTEL_CITIES = ["Mekke", "Medine"] as const;

export const hotelSchema = z.object({
  name: z.string().trim().min(2, "Otel adı gerekli").max(150),
  slug: slugField,
  city: z.enum(HOTEL_CITIES, { error: "Şehir seçiniz" }),
  region: optionalText(100),
  distance: optionalText(100),
  stars: optionalNumber({ min: 0, max: 7, int: true }),
  description: optionalText(3000),
  images: z.array(imagePath).max(20, "En fazla 20 görsel"),
  isPublished: z.boolean(),
});
export type HotelInput = z.infer<typeof hotelSchema>;

export const blogSchema = z.object({
  title: z.string().trim().min(3, "Başlık gerekli").max(200),
  slug: slugField,
  excerpt: optionalText(400),
  content: z.string().trim().min(1, "İçerik gerekli").max(50000),
  coverImage: imagePath.optional(),
  category: optionalText(60),
  readTime: optionalNumber({ min: 1, max: 120, int: true }),
  seoTitle: optionalText(120),
  seoDescription: optionalText(320),
  isPublished: z.boolean(),
});
export type BlogInput = z.infer<typeof blogSchema>;

export const certificateSchema = z.object({
  title: z.string().trim().min(2, "Başlık gerekli").max(150),
  image: imagePath.refine((v) => v.length > 0, "Görsel seçiniz"),
  description: optionalText(400),
  order: optionalNumber({ min: 0, max: 999, int: true }),
  isPublished: z.boolean(),
});
export type CertificateInput = z.infer<typeof certificateSchema>;

/** Ziyaretçi değerlendirmesi (honeypot ile spam koruması) */
export const reviewSchema = z.object({
  tourId: z.string().min(1).max(40),
  title: optionalText(120),
  rating: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number({ error: "Lütfen puan verin" }).int().min(1, "Lütfen puan verin").max(5),
  ),
  comment: z.string().trim().min(10, "Yorum en az 10 karakter olmalı").max(2000, "Yorum en fazla 2000 karakter olabilir"),
  fullName: z.string().trim().min(3, "Ad soyad en az 3 karakter olmalı").max(100),
  email: z.string().trim().email("Geçerli bir e-posta giriniz").max(150),
  website: z.string().max(0, "Spam tespit edildi").optional().or(z.literal("")),
});
export type ReviewInput = z.infer<typeof reviewSchema>;

/* ------------------------------------------------------------------ */
/* Site ayarları                                                        */
/* ------------------------------------------------------------------ */

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\//i.test(v), "Adres http:// veya https:// ile başlamalı");

/** Google Maps: tam <iframe> kodu yapıştırılırsa src'yi ayıklar */
export function extractMapSrc(value: string): string {
  const v = value.trim();
  const m = v.match(/src\s*=\s*["']([^"']+)["']/i);
  return (m ? m[1] : v).replace(/&amp;/g, "&");
}

export const settingsSchema = z.object({
  siteName: z.string().trim().min(2, "Site adı gerekli").max(80),
  tagline: z.string().trim().max(80),
  logo: imagePath,
  footerNote: z.string().trim().max(400),
  phone: z.string().trim().min(7, "Telefon gerekli").max(30),
  whatsapp: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length >= 10 && v.length <= 15, "Ülke koduyla birlikte 10-15 haneli numara giriniz (ör. 905xxxxxxxxx)"),
  email: z.string().trim().email("Geçerli bir e-posta giriniz"),
  workingHours: z.string().trim().max(120),
  address: z.string().trim().max(300),
  facebook: optionalUrl,
  instagram: optionalUrl,
  youtube: optionalUrl,
  twitter: optionalUrl,
  tiktok: optionalUrl,
  linkedin: optionalUrl,
  telegram: optionalUrl,
  mapEmbed: z
    .string()
    .max(4000)
    .transform(extractMapSrc)
    .refine((v) => v === "" || /^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/i.test(v), {
      message: "Google Haritalar'dan 'Haritayı yerleştir' kodunu veya embed adresini yapıştırın",
    }),
  seoTitle: z.string().trim().max(120),
  seoDescription: z.string().trim().max(320),
  seoKeywords: z.string().trim().max(500),
  ogImage: imagePath,
  favicon: imagePath,
});
export type SettingsInput = z.infer<typeof settingsSchema>;
export const SETTING_KEYS = Object.keys(settingsSchema.shape) as (keyof SettingsInput)[];
