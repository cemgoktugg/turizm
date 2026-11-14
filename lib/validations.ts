import { z } from "zod";
import { USERNAME_HINT, USERNAME_PATTERN, normalizeUsername } from "./username";
import { PASSENGER_KEYS, type PassengerType } from "./sale-pricing";

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

/** Kampanya kayıt kutusu (public) */
export const subscribeSchema = z.object({
  contact: z.string().trim().min(5, "Telefon numaranızı veya e-posta adresinizi yazın").max(120),
  fullName: z.string().trim().max(80).optional(),
  consent: z.literal(true, { error: "Devam etmek için onay kutusunu işaretleyin" }),
  source: z.string().max(200).optional(),
  // Honeypot — botlar doldurur, insanlar görmez
  website: z.string().max(0).optional().or(z.literal("")),
});
export type SubscribeInput = z.infer<typeof subscribeSchema>;

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
  /** E-posta veya kullanıcı adı ("@" içeriyorsa e-posta sayılır) */
  login: z.string().trim().min(1, "Kullanıcı adı veya e-posta gerekli").max(150),
  password: z.string().min(1, "Şifre gerekli").max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** Formdaki ham kullanıcı adı; sunucu normalizeUsername ile sadeleştirip kaydeder. Boş: kullanıcı adı yok */
const usernameText = z
  .string()
  .trim()
  .max(60)
  .refine((v) => v === "" || USERNAME_PATTERN.test(normalizeUsername(v)), `Geçersiz kullanıcı adı: ${USERNAME_HINT}`);

const strongPassword = z
  .string()
  .min(8, "Şifre en az 8 karakter olmalı")
  .max(200)
  .refine((v) => /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(v) && /\d/.test(v), "Şifre en az bir harf ve bir rakam içermeli");

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Ad en az 2 karakter olmalı").max(80),
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta giriniz"),
  username: usernameText,
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

export const userCreateSchema = profileSchema.extend({
  username: usernameText.refine((v) => v !== "", "Kullanıcı adı gerekli"),
  password: strongPassword,
  /** STAFF: site + satış, SALES: yalnızca Satış Programı (bkz. lib/roles.ts) */
  role: z.enum(["STAFF", "SALES"]),
});
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
  description: z.string().trim().max(3000),
  time: z
    .string()
    .trim()
    .max(20)
    .refine((v) => v === "" || /^([01]?\d|2[0-3])[:.][0-5]\d$/.test(v), "Saat 07:30 biçiminde olmalı")
    .optional(),
  place: z.string().trim().max(80).optional(),
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

/** Arama motoru açılış sayfası (admin) */
export const LANDING_SORTS = ["onerilen", "tarih", "fiyat-artan", "fiyat-azalan"] as const;
export const landingSchema = z.object({
  title: z.string().trim().min(3, "Başlık gerekli").max(150),
  slug: slugField,
  description: optionalText(400),
  image: imagePath.optional(),
  content: z.string().trim().min(30, "Sayfa metni en az 30 karakter olmalı").max(40000),
  tourCategories: z.array(z.string().trim().max(80)).max(30),
  tourSearch: optionalText(100),
  toursTitle: optionalText(150),
  toursSort: z.enum(LANDING_SORTS),
  faqs: z
    .array(
      z.object({
        question: z.string().trim().min(3, "Soru gerekli").max(200),
        answer: z.string().trim().min(3, "Cevap gerekli").max(2000),
      }),
    )
    .max(30, "En fazla 30 soru eklenebilir"),
  seoTitle: optionalText(120),
  seoDescription: optionalText(320),
  isPublished: z.boolean(),
});
export type LandingInput = z.infer<typeof landingSchema>;

export const certificateSchema = z.object({
  title: z.string().trim().min(2, "Başlık gerekli").max(150),
  image: imagePath.refine((v) => v.length > 0, "Görsel seçiniz"),
  description: optionalText(400),
  order: optionalNumber({ min: 0, max: 999, int: true }),
  isPublished: z.boolean(),
});
export type CertificateInput = z.infer<typeof certificateSchema>;

/** Site içi yol (/turlar/...) veya http(s) bağlantısı */
const internalOrWebUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//i.test(v), "Bağlantı '/' veya 'https://' ile başlamalı")
  .optional();

export const storyItemSchema = z.object({
  url: imagePath.refine((v) => v.length > 0, "Video veya görsel seçiniz"),
  caption: optionalText(200),
  duration: optionalNumber({ min: 2, max: 30, int: true }),
});

export const storySchema = z
  .object({
    title: z.string().trim().min(1, "Başlık gerekli").max(30, "En fazla 30 karakter (yuvarlağın altına sığmalı)"),
    cover: imagePath.optional(),
    buttonLabel: optionalText(40),
    buttonUrl: internalOrWebUrl,
    isPublished: z.boolean(),
    items: z.array(storyItemSchema).min(1, "En az bir video veya görsel ekleyin").max(20, "En fazla 20 içerik"),
  })
  .refine((d) => !d.buttonLabel || d.buttonUrl, { message: "Buton için bağlantı girin", path: ["buttonUrl"] });
export type StoryInput = z.infer<typeof storySchema>;

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
  logoLight: imagePath,
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
    .refine(
      (v) =>
        v === "" ||
        /^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/i.test(v) ||
        /^https:\/\/(maps|www)\.google\.[a-z.]+\/maps\?.*output=embed/i.test(v),
      { message: "Google Haritalar'dan 'Haritayı yerleştir' kodunu veya embed adresini yapıştırın" },
    ),
  // Şirket bilgileri (footer ve KVKK metninde gösterilir)
  companyTitle: z.string().trim().max(200),
  tursabNo: z.string().trim().max(30),
  mersisNo: z.string().trim().max(30),
  taxInfo: z.string().trim().max(120),
  // Ölçüm araçları — boşsa yüklenmez; doluysa çerez onayından sonra yüklenir
  gaId: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v === "" || /^G-[A-Z0-9]{4,}$/.test(v), "Google Analytics ölçüm kimliği G- ile başlamalı (ör. G-ABC123XYZ)"),
  metaPixelId: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{6,20}$/.test(v), "Meta piksel kimliği yalnızca rakamlardan oluşur"),
  googleVerification: z
    .string()
    .trim()
    .max(300)
    // Tam <meta> etiketi yapıştırılırsa yalnızca content değerini al
    .transform((v) => v.match(/content\s*=\s*["']([^"']+)["']/i)?.[1] ?? v),
  seoTitle: z.string().trim().max(120),
  seoDescription: z.string().trim().max(320),
  seoKeywords: z.string().trim().max(500),
  ogImage: imagePath,
  favicon: imagePath,
});
export type SettingsInput = z.infer<typeof settingsSchema>;
export const SETTING_KEYS = Object.keys(settingsSchema.shape) as (keyof SettingsInput)[];

/* ------------------------------------------------------------------ */
/* Satış ve alacak takibi                                               */
/* ------------------------------------------------------------------ */

export const PAYMENT_METHODS = ["Nakit", "Havale", "Kredi Kartı"] as const;

/** Satışta yolcu tipi: boş = yetişkin, aksi halde çocuk yaş grubu */
const passengerField = z.enum(PASSENGER_KEYS as [PassengerType, ...PassengerType[]]).or(z.literal("")).optional();

/** T.C. kimlik numarası algoritma kontrolü (11 hane, son iki hane sağlaması) */
export function isValidTc(tc: string): boolean {
  if (!/^[1-9]\d{10}$/.test(tc)) return false;
  const d = tc.split("").map(Number);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  if ((((odd * 7 - even) % 10) + 10) % 10 !== d[9]) return false;
  return d.slice(0, 10).reduce((a, b) => a + b, 0) % 10 === d[10];
}

/** Opsiyonel T.C.: boş bırakılabilir, doluysa algoritma kontrolünden geçmeli */
const tcField = z
  .string()
  .trim()
  .refine((v) => v === "" || isValidTc(v), "Geçerli bir T.C. kimlik numarası giriniz")
  .optional();

const salesPhone = z
  .string()
  .trim()
  .max(30)
  .refine((v) => (v.match(/\d/g) ?? []).length >= 7, "Geçerli bir telefon numarası giriniz");

/** Zorunlu tam sayı (boş metin hata verir) */
function requiredInt(label: string, opts: { min?: number; max?: number } = {}) {
  let n = z.number({ error: `${label} gerekli` }).int("Tam sayı giriniz");
  if (opts.min != null) n = n.min(opts.min, `En az ${opts.min} olmalı`);
  if (opts.max != null) n = n.max(opts.max, `En fazla ${opts.max} olmalı`);
  return z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    if (typeof v === "number") return Number.isNaN(v) ? undefined : v;
    const num = Number(String(v).replace(/\./g, "").replace(",", "."));
    return Number.isNaN(num) ? v : num;
  }, n);
}

const requiredDate = (label: string) =>
  z
    .string({ error: `${label} gerekli` })
    .trim()
    .min(1, `${label} gerekli`)
    .refine((v) => !Number.isNaN(new Date(v).getTime()), "Geçerli bir tarih giriniz");

export const staffSchema = z.object({
  fullName: z.string().trim().min(3, "Ad soyad gerekli").max(100),
  tc: tcField,
  phone: salesPhone,
  note: optionalText(1000),
});
export type StaffInput = z.infer<typeof staffSchema>;

/** Müşteri telefonu opsiyonel: boş bırakılabilir, doluysa en az 7 rakam */
const optionalSalesPhone = z
  .string()
  .trim()
  .max(30)
  .refine((v) => v === "" || (v.match(/\d/g) ?? []).length >= 7, "Geçerli bir telefon numarası giriniz")
  .optional();

export const customerSchema = z.object({
  fullName: z.string().trim().min(3, "Ad soyad gerekli").max(100),
  tc: tcField,
  phone: optionalSalesPhone,
  note: optionalText(1000),
});
export type CustomerInput = z.infer<typeof customerSchema>;

export const serviceTourSchema = z
  .object({
    name: z.string().trim().min(2, "Tur adı gerekli").max(150),
    period: z.string().trim().min(2, "Dönem gerekli").max(60),
    departureDate: requiredDate("Gidiş tarihi"),
    returnDate: requiredDate("Dönüş tarihi"),
    price2: optionalNumber({ min: 0, max: 100_000_000, int: true }),
    price3: optionalNumber({ min: 0, max: 100_000_000, int: true }),
    price4: optionalNumber({ min: 0, max: 100_000_000, int: true }),
    /** Çocuk ücretleri (yaşa göre); boş bırakılan yaş grubu satışta seçilemez */
    priceAge0to2: optionalNumber({ min: 0, max: 100_000_000, int: true }),
    priceAge2to6: optionalNumber({ min: 0, max: 100_000_000, int: true }),
    priceAge6to11: optionalNumber({ min: 0, max: 100_000_000, int: true }),
    accommodation: optionalText(200),
    /** Görevli sonradan atanabilir */
    guide1Id: optionalNumber({ min: 1, int: true }),
    guide2Id: optionalNumber({ min: 1, int: true }),
    days: requiredInt("Gün", { min: 1, max: 365 }),
    capacity: optionalNumber({ min: 1, max: 10_000, int: true }),
    note: optionalText(2000),
    isActive: z.boolean(),
  })
  .refine((d) => new Date(d.returnDate) >= new Date(d.departureDate), {
    message: "Dönüş tarihi gidişten önce olamaz",
    path: ["returnDate"],
  })
  .refine((d) => d.price2 != null || d.price3 != null || d.price4 != null, {
    message: "En az bir oda tipinin fiyatını girin",
    path: ["price2"],
  })
  .refine((d) => !d.guide2Id || d.guide2Id !== d.guide1Id, {
    message: "Görevli 2, Görevli 1 ile aynı olamaz",
    path: ["guide2Id"],
  });
export type ServiceTourInput = z.infer<typeof serviceTourSchema>;

export const saleSchema = z.object({
  date: requiredDate("Satış tarihi"),
  tourId: requiredInt("Tur", { min: 1 }),
  customerId: requiredInt("Müşteri", { min: 1 }),
  note: optionalText(1000),
  reference: optionalText(100),
  roomSize: optionalNumber({ min: 1, max: 10, int: true }),
  /** Boş = yetişkin; çocukta yaş grubu ("0-2" | "2-6" | "6-11") */
  passenger: passengerField,
  price: requiredInt("Ücret", { min: 0, max: 100_000_000 }),
  /** Yalnızca yeni satışta: girilirse ilk tahsilat olarak kaydedilir */
  downPayment: optionalNumber({ min: 1, max: 100_000_000, int: true }),
  downPaymentMethod: z.enum(PAYMENT_METHODS).optional(),
  downPaymentBy: optionalText(100),
});
export type SaleInput = z.infer<typeof saleSchema>;

export const paymentSchema = z.object({
  date: requiredDate("Tarih"),
  amount: requiredInt("Tutar", { min: 1, max: 100_000_000 }),
  method: z.enum(PAYMENT_METHODS),
  receivedBy: z.string({ error: "Kişi seçiniz" }).trim().min(1, "Kişi seçiniz").max(100),
  note: optionalText(500),
});
export type PaymentInput = z.infer<typeof paymentSchema>;

/* ---- Aile / grup ---- */

export const groupSchema = z.object({
  name: z.string().trim().min(2, "Grup adı gerekli (ör. Yılmaz Ailesi)").max(100),
  note: optionalText(1000),
});
export type GroupInput = z.infer<typeof groupSchema>;

/** Aile / grup satışı: tur ve tarih bir kez, kişiler ayrı ayrı (her kişi bir satış olur) */
export const groupSaleSchema = z
  .object({
    /** Boşsa yeni grup açılır (groupName zorunlu), doluysa kişiler bu gruba eklenir */
    groupId: optionalNumber({ min: 1, int: true }),
    groupName: optionalText(100),
    date: requiredDate("Satış tarihi"),
    tourId: requiredInt("Tur", { min: 1 }),
    roomSize: optionalNumber({ min: 1, max: 10, int: true }),
    reference: optionalText(100),
    note: optionalText(1000),
    members: z
      .array(
        z.object({
          customerId: requiredInt("Müşteri", { min: 1 }),
          passenger: passengerField,
          price: requiredInt("Ücret", { min: 0, max: 100_000_000 }),
        }),
      )
      .min(1, "En az bir kişi ekleyin")
      .max(50, "Bir seferde en fazla 50 kişi"),
    /** Grubun toplam peşinatı: kişilere ücretlerine göre orantılı dağıtılır */
    downPayment: optionalNumber({ min: 1, max: 100_000_000, int: true }),
    downPaymentMethod: z.enum(PAYMENT_METHODS).optional(),
    downPaymentBy: optionalText(100),
  })
  .refine((d) => d.groupId || (d.groupName && d.groupName.length >= 2), { message: "Grup adı gerekli (ör. Yılmaz Ailesi)", path: ["groupName"] })
  .refine((d) => new Set(d.members.map((m) => m.customerId)).size === d.members.length, {
    message: "Aynı kişi iki kez eklenmiş",
    path: ["members"],
  });
export type GroupSaleInput = z.infer<typeof groupSaleSchema>;

/** Grup tahsilatı: tek ödeme, kişilere dağıtılmış parçalarla */
export const groupPaymentSchema = z
  .object({
    date: requiredDate("Tarih"),
    method: z.enum(PAYMENT_METHODS),
    receivedBy: z.string({ error: "Kişi seçiniz" }).trim().min(1, "Kişi seçiniz").max(100),
    note: optionalText(500),
    parts: z.array(z.object({ saleId: requiredInt("Satış", { min: 1 }), amount: requiredInt("Tutar", { min: 0, max: 100_000_000 }) })).min(1),
  })
  .refine((d) => d.parts.some((p) => p.amount > 0), { message: "Dağıtılacak tutar girin", path: ["parts"] });
export type GroupPaymentInput = z.infer<typeof groupPaymentSchema>;
