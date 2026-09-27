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

function scalarData(d: AdminTourInput) {
  return {
    title: d.title,
    shortDescription: d.shortDescription || null,
    description: d.description || null,
    categoryId: d.categoryId,
    departureDate: toDate(d.departureDate),
    returnDate: toDate(d.returnDate),
    durationDays: d.durationDays ?? null,
    durationNights: d.durationNights ?? null,
    departureCity: d.departureCity || null,
    airline: d.airline || null,
    makkahHotel: d.makkahHotel || null,
    madinahHotel: d.madinahHotel || null,
    makkahDistance: d.makkahDistance || null,
    madinahDistance: d.madinahDistance || null,
    startingPrice: d.startingPrice ?? null,
    currency: d.currency,
    priceNote: d.priceNote || null,
    coverImage: d.coverImage || null,
    includedServices: d.includedServices || null,
    excludedServices: d.excludedServices || null,
    requiredDocuments: d.requiredDocuments || null,
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

    const slug = await uniqueSlug("tour", d.slug || d.title);
    const tour = await prisma.tour.create({ data: { ...scalarData(d), slug, ...relationData(d) } });
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

    const slug = await uniqueSlug("tour", d.slug || d.title, id);
    await prisma.$transaction([
      prisma.tourImage.deleteMany({ where: { tourId: id } }),
      prisma.tourPrice.deleteMany({ where: { tourId: id } }),
      prisma.tourDayProgram.deleteMany({ where: { tourId: id } }),
      prisma.fAQ.deleteMany({ where: { tourId: id } }),
      prisma.tour.update({ where: { id }, data: { ...scalarData(d), slug, ...relationData(d) } }),
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
      include: { images: true, prices: true, dayPrograms: true, faqs: true },
    });
    if (!src) return { ok: false, message: "Tur bulunamadı." };

    const title = `${src.title} (Kopya)`;
    const slug = await uniqueSlug("tour", title);
    const {
      id: _id,
      createdAt: _c,
      updatedAt: _u,
      images,
      prices,
      dayPrograms,
      faqs,
      ...rest
    } = src;
    void _id;
    void _c;
    void _u;

    const copy = await prisma.tour.create({
      data: {
        ...rest,
        title,
        slug,
        isPublished: false,
        isFeatured: false,
        images: { create: images.map(({ url, alt, order }) => ({ url, alt, order })) },
        prices: { create: prices.map(({ roomType, price, currency, order }) => ({ roomType, price, currency, order })) },
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
