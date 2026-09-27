import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TourForm } from "@/components/admin/tour-form";

export const metadata = { title: "Tur Düzenle" };

function toDateInput(d?: Date | null): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export default async function EditTourPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [tour, categories] = await Promise.all([
    prisma.tour.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: "asc" } },
        prices: { orderBy: { order: "asc" } },
        dayPrograms: { orderBy: { dayNumber: "asc" } },
        faqs: { orderBy: { order: "asc" } },
      },
    }),
    prisma.tourCategory.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!tour) notFound();

  const defaultValues = {
    title: tour.title,
    slug: tour.slug,
    categoryId: tour.categoryId,
    shortDescription: tour.shortDescription ?? "",
    description: tour.description ?? "",
    departureDate: toDateInput(tour.departureDate),
    returnDate: toDateInput(tour.returnDate),
    durationDays: tour.durationDays ?? undefined,
    durationNights: tour.durationNights ?? undefined,
    departureCity: tour.departureCity ?? "",
    airline: tour.airline ?? "",
    makkahHotel: tour.makkahHotel ?? "",
    madinahHotel: tour.madinahHotel ?? "",
    makkahDistance: tour.makkahDistance ?? "",
    madinahDistance: tour.madinahDistance ?? "",
    startingPrice: tour.startingPrice ?? undefined,
    currency: tour.currency,
    coverImage: tour.coverImage ?? "",
    images: tour.images.map((i) => i.url).join("\n"),
    includedServices: tour.includedServices ?? "",
    excludedServices: tour.excludedServices ?? "",
    requiredDocuments: tour.requiredDocuments ?? "",
    isFeatured: tour.isFeatured,
    isPublished: tour.isPublished,
    seoTitle: tour.seoTitle ?? "",
    seoDescription: tour.seoDescription ?? "",
    prices: tour.prices.map((p) => ({ roomType: p.roomType, price: p.price })),
    dayPrograms: tour.dayPrograms.map((d) => ({
      dayNumber: d.dayNumber,
      title: d.title,
      description: d.description,
    })),
    faqs: tour.faqs.map((f) => ({ question: f.question, answer: f.answer })),
  };

  return (
    <div>
      <Link href="/admin/tours" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-gold-600">
        <ArrowLeft className="size-4" /> Turlara Dön
      </Link>
      <h2 className="mb-6 font-serif text-2xl font-bold text-brand-900">
        Tur Düzenle: <span className="text-brand-600">{tour.title}</span>
      </h2>
      <TourForm categories={categories} tourId={tour.id} defaultValues={defaultValues} />
    </div>
  );
}
