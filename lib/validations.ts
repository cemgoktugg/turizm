import { z } from "zod";

/** Boş bırakılabilen e-posta */
const optionalEmail = z
  .string()
  .trim()
  .email("Geçerli bir e-posta giriniz")
  .optional()
  .or(z.literal(""));

/** Başvuru / rezervasyon formu (honeypot ile spam koruması) */
export const leadSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Ad soyad en az 3 karakter olmalı")
    .max(100),
  phone: z
    .string()
    .trim()
    .min(7, "Geçerli bir telefon numarası giriniz")
    .max(30),
  email: optionalEmail,
  personCount: z.coerce
    .number()
    .int()
    .min(1, "En az 1 kişi")
    .max(50)
    .optional(),
  tourId: z.string().optional(),
  tourTitle: z.string().max(200).optional(),
  message: z.string().max(1500).optional(),
  // Honeypot — botlar doldurur, insanlar görmez
  website: z.string().max(0, "Spam tespit edildi").optional().or(z.literal("")),
});
export type LeadInput = z.infer<typeof leadSchema>;

/** Admin giriş */
export const loginSchema = z.object({
  email: z.string().trim().email("Geçerli bir e-posta giriniz"),
  password: z.string().min(4, "Şifre en az 4 karakter olmalı"),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** Oda fiyatı satırı */
export const priceRowSchema = z.object({
  roomType: z.string().trim().min(1, "Oda tipi gerekli"),
  price: z.coerce.number().min(0),
});

/** Gün gün program satırı */
export const dayRowSchema = z.object({
  dayNumber: z.coerce.number().int().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
});

/** SSS satırı */
export const faqRowSchema = z.object({
  question: z.string().trim().min(1),
  answer: z.string().trim().min(1),
});

/** Admin — tur formu */
export const tourSchema = z.object({
  title: z.string().trim().min(3, "Başlık en az 3 karakter"),
  slug: z.string().trim().optional(),
  categoryId: z.string().min(1, "Kategori seçiniz"),
  shortDescription: z.string().max(400).optional(),
  description: z.string().optional(),
  departureDate: z.string().optional(),
  returnDate: z.string().optional(),
  durationDays: z.coerce.number().int().min(0).optional(),
  durationNights: z.coerce.number().int().min(0).optional(),
  departureCity: z.string().optional(),
  airline: z.string().optional(),
  makkahHotel: z.string().optional(),
  madinahHotel: z.string().optional(),
  makkahDistance: z.string().optional(),
  madinahDistance: z.string().optional(),
  startingPrice: z.coerce.number().min(0).optional(),
  currency: z.string().default("USD"),
  coverImage: z.string().optional(),
  images: z.string().optional(), // satır satır URL
  includedServices: z.string().optional(),
  excludedServices: z.string().optional(),
  requiredDocuments: z.string().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isPublished: z.coerce.boolean().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});
export type TourInput = z.infer<typeof tourSchema>;

/** Admin — tur formu (iç içe fiyat/program/SSS dizileri ile) */
export const adminTourSchema = tourSchema.extend({
  prices: z.array(priceRowSchema).optional(),
  dayPrograms: z.array(dayRowSchema).optional(),
  faqs: z.array(faqRowSchema).optional(),
});
export type AdminTourInput = z.infer<typeof adminTourSchema>;

/** Admin — otel formu */
export const hotelSchema = z.object({
  name: z.string().trim().min(2, "Otel adı gerekli"),
  slug: z.string().trim().optional(),
  city: z.string().trim().min(1, "Şehir gerekli"),
  region: z.string().optional(),
  distance: z.string().optional(),
  stars: z.coerce.number().int().min(0).max(7).optional(),
  description: z.string().optional(),
  images: z.string().optional(),
  isPublished: z.coerce.boolean().optional(),
});
export type HotelInput = z.infer<typeof hotelSchema>;

/** Admin — blog formu */
export const blogSchema = z.object({
  title: z.string().trim().min(3, "Başlık gerekli"),
  slug: z.string().trim().optional(),
  excerpt: z.string().max(400).optional(),
  content: z.string().trim().min(1, "İçerik gerekli"),
  coverImage: z.string().optional(),
  category: z.string().optional(),
  readTime: z.coerce.number().int().min(0).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  isPublished: z.coerce.boolean().optional(),
});
export type BlogInput = z.infer<typeof blogSchema>;

/** Admin — sertifika formu */
export const certificateSchema = z.object({
  title: z.string().trim().min(2, "Başlık gerekli"),
  image: z.string().trim().min(1, "Görsel yolu gerekli"),
  description: z.string().optional(),
  order: z.coerce.number().int().min(0).optional(),
  isPublished: z.coerce.boolean().optional(),
});
export type CertificateInput = z.infer<typeof certificateSchema>;

/** Başvuru durumları */
export const LEAD_STATUSES = [
  "Yeni",
  "Arandı",
  "Teklif Verildi",
  "Rezervasyon Alındı",
  "İptal",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
