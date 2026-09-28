"use server";

import { prisma } from "@/lib/prisma";
import { uniqueSlug } from "@/lib/slug";
import { adminTourSchema, type AdminTourInput } from "@/lib/validations";
import { adminAction, invalid, type ActionResult } from "@/lib/action";
import { revalidateSite } from "@/lib/revalidate";

function toDate(v?: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Sıradaki tur numarası: en büyük sayısal numaranın bir fazlası (ilk tur 1001) */
async function nextTourCode(): Promise<string> {
  const rows = await prisma.tour.findMany({ where: { code: { not: null } }, select: { code: true } });
  const max = rows.reduce((m, r) => {
    const n = Number(r.code);
    return Number.isInteger(n) && n > m ? n : m;
  }, 1000);
  return String(max + 1);
}

/** Tur no başka bir turda kullanılıyor mu? */
async function codeTaken(code: string, exceptId?: string): Promise<boolean> {
  const other = await prisma.tour.findFirst({
    where: { code, ...(exceptId ? { id: { not: exceptId } } : {}) },
    select: { id: true },
  });
  return Boolean(other);
}

const CODE_TAKEN: ActionResult<never> = {
  ok: false,
  message: "Bu tur numarası başka bir turda kullanılıyor.",
  fieldErrors: { code: "Bu tur numarası kullanılıyor" },
};

function scalarData(d: AdminTourInput) {
  return {
    badge: d.badge || null,
    title: d.title,
    shortDescription: d.shortDescription || null,
    description: d.description || null,
    categoryId: d.categoryId,
    departureDate: toDate(d.departureDate),
    returnDate: toDate(d.returnDate),
    durationDays: d.durationDays ?? null,
    durationNights: d.durationNights ?? null,
    seatsLeft: d.seatsLeft ?? null,
    departureCity: d.departureCity || null,
    airline: d.airline || null,
    startingPrice: d.startingPrice ?? null,
    currency: d.currency,
    priceNote: d.priceNote || null,
    coverImage: d.coverImage || null,
    includedServices: d.includedServices || null,
    excludedServices: d.excludedServices || null,
    requiredDocuments: d.requiredDocuments || null,
    videoUrl: d.videoUrl || null,
    isFeatured: d.isFeatured,
    isPublished: d.isPublished,
    seoTitle: d.seoTitle || null,
    seoDescription: d.seoDescription || null,
  };
}

function relationData(d: AdminTourInput) {
  return {
    images: { create: d.images.filter(Boolean).map((url, i) => ({ url, order: i })) },
    prices: {
      create: d.prices.map((p, i) => ({ roomType: p.roomType, price: p.price, currency: d.currency, order: i })),
    },
    hotels: {
      create: d.hotels.map((h, i) => ({
        city: h.city,
        name: h.name,
        nights: h.nights ?? null,
        stars: h.stars ?? null,
        distance: h.distance || null,
        image: h.image || null,
        videoUrl: h.videoUrl || null,
        link: h.link || null,
        order: i,
      })),
    },
    legs: {
      create: d.legs.map((l, i) => ({
        type: l.type,
        title: l.title,
        carrier: l.carrier || null,
        flightNo: l.flightNo || null,
        fromCode: l.fromCode?.toLocaleUpperCase("tr") || null,
        fromCity: l.fromCity || null,
        toCode: l.toCode?.toLocaleUpperCase("tr") || null,
        toCity: l.toCity || null,
        date: toDate(l.date),
        time: l.time || null,
        order: i,
      })),
    },
    dayPrograms: {
      create: d.dayPrograms.map((p) => ({ dayNumber: p.dayNumber, title: p.title, description: p.description })),
    },
    faqs: { create: d.faqs.map((f, i) => ({ question: f.question, answer: f.answer, order: i })) },
  };
}

async function assertCategory(categoryId: string) {
  return prisma.tourCategory.findUnique({ where: { id: categoryId }, select: { id: true } });
}

export async function createTour(input: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction(async () => {
    const parsed = adminTourSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const d = parsed.data;
    if (!(await assertCategory(d.categoryId))) return { ok: false, message: "Seçilen kategori bulunamadı." };
    if (d.code && (await codeTaken(d.code))) return CODE_TAKEN;

    const slug = await uniqueSlug("tour", d.slug || d.title);
    const code = d.code || (await nextTourCode());
    const tour = await prisma.tour.create({ data: { ...scalarData(d), code, slug, ...relationData(d) } });
    revalidateSite();
    return { ok: true, message: "Tur oluşturuldu.", data: { id: tour.id } };
  });
}

export async function updateTour(id: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction(async () => {
    const parsed = adminTourSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const d = parsed.data;
    if (!(await assertCategory(d.categoryId))) return { ok: false, message: "Seçilen kategori bulunamadı." };
    if (d.code && (await codeTaken(d.code, id))) return CODE_TAKEN;

    const slug = await uniqueSlug("tour", d.slug || d.title, id);
    const code = d.code || (await nextTourCode());
    await prisma.$transaction([
      prisma.tourImage.deleteMany({ where: { tourId: id } }),
      prisma.tourPrice.deleteMany({ where: { tourId: id } }),
      prisma.tourHotel.deleteMany({ where: { tourId: id } }),
      prisma.tourLeg.deleteMany({ where: { tourId: id } }),
      prisma.tourDayProgram.deleteMany({ where: { tourId: id } }),
      prisma.fAQ.deleteMany({ where: { tourId: id } }),
      prisma.tour.update({ where: { id }, data: { ...scalarData(d), code, slug, ...relationData(d) } }),
    ]);
    revalidateSite();
    return { ok: true, message: "Tur güncellendi.", data: { id } };
  });
}

export async function deleteTour(id: string): Promise<ActionResult> {
  return adminAction(async () => {
    // Başvurular silinmez; tur bağlantısı kaldırılıp tur adı başvuruda saklanır
    const tour = await prisma.tour.findUnique({ where: { id }, select: { title: true } });
    if (!tour) return { ok: false, message: "Tur bulunamadı." };
    await prisma.$transaction([
      prisma.lead.updateMany({ where: { tourId: id, tourTitle: null }, data: { tourTitle: tour.title } }),
      prisma.lead.updateMany({ where: { tourId: id }, data: { tourId: null } }),
      prisma.tour.delete({ where: { id } }),
    ]);
    revalidateSite();
    return { ok: true, message: "Tur silindi. İlgili başvurular korunuyor." };
  });
}

/** Yayın / öne çıkarma durumunu değiştirir */
export async function toggleTourFlag(id: string, field: "isPublished" | "isFeatured"): Promise<ActionResult> {
  return adminAction(async () => {
    if (field !== "isPublished" && field !== "isFeatured") return { ok: false, message: "Geçersiz alan." };
    const tour = await prisma.tour.findUnique({ where: { id }, select: { isPublished: true, isFeatured: true } });
    if (!tour) return { ok: false, message: "Tur bulunamadı." };
    const next = !tour[field];
    await prisma.tour.update({ where: { id }, data: { [field]: next } });
    revalidateSite();
    const label = field === "isPublished" ? (next ? "yayına alındı" : "yayından kaldırıldı") : next ? "öne çıkarıldı" : "öne çıkanlardan kaldırıldı";
    return { ok: true, message: `Tur ${label}.` };
  });
}

/** Turu tüm detaylarıyla kopyalar (taslak olarak) — yeni sezon turları için */
export async function duplicateTour(id: string): Promise<ActionResult<{ id: string }>> {
  return adminAction(async () => {
    const src = await prisma.tour.findUnique({
      where: { id },
      include: { images: true, prices: true, hotels: true, legs: true, dayPrograms: true, faqs: true },
    });
    if (!src) return { ok: false, message: "Tur bulunamadı." };

    const title = `${src.title} (Kopya)`;
    const slug = await uniqueSlug("tour", title);
    const code = await nextTourCode();
    const {
      id: _id,
      createdAt: _c,
      updatedAt: _u,
      code: _code,
      images,
      prices,
      hotels,
      legs,
      dayPrograms,
      faqs,
      ...rest
    } = src;
    void _id;
    void _c;
    void _u;
    void _code;

    const copy = await prisma.tour.create({
      data: {
        ...rest,
        title,
        slug,
        code,
        isPublished: false,
        isFeatured: false,
        images: { create: images.map(({ url, alt, order }) => ({ url, alt, order })) },
        prices: { create: prices.map(({ roomType, price, currency, order }) => ({ roomType, price, currency, order })) },
        hotels: {
          create: hotels.map(({ city, name, nights, stars, distance, image, videoUrl, link, order }) => ({
            city,
            name,
            nights,
            stars,
            distance,
            image,
            videoUrl,
            link,
            order,
          })),
        },
        legs: {
          create: legs.map(({ type, title, carrier, flightNo, fromCode, fromCity, toCode, toCity, date, time, order }) => ({
            type,
            title,
            carrier,
            flightNo,
            fromCode,
            fromCity,
            toCode,
            toCity,
            date,
            time,
            order,
          })),
        },
        dayPrograms: {
          create: dayPrograms.map(({ dayNumber, title, description }) => ({ dayNumber, title, description })),
        },
        faqs: { create: faqs.map(({ question, answer, order }) => ({ question, answer, order })) },
      },
    });
    revalidateSite();
    return { ok: true, message: "Tur kopyalandı (taslak olarak). Tarihleri güncelleyip yayınlayabilirsiniz.", data: { id: copy.id } };
  });
}
