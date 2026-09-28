import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TourForm } from "@/components/admin/tour-form";
import { getTourFormOptions, toDateInput } from "@/lib/admin-data";
import { isPastTour } from "@/lib/queries";
import type { CURRENCIES } from "@/lib/validations";

export const metadata = { title: "Tur Düzenle" };

const num = (v: number | null | undefined) => (v == null ? "" : String(v));

export default async function EditTourPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [tour, { categories, hotels }] = await Promise.all([
    prisma.tour.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: "asc" } },
        prices: { orderBy: { order: "asc" } },
        hotels: { orderBy: { order: "asc" } },
        legs: { orderBy: { order: "asc" } },
        dayPrograms: { orderBy: { dayNumber: "asc" } },
        faqs: { orderBy: { order: "asc" } },
        _count: { select: { leads: true, reviews: true } },
      },
    }),
    getTourFormOptions(),
  ]);

  if (!tour) notFound();

  return (
    <div>
      <Link href="/admin/tours" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-gold-600">
        <ArrowLeft className="size-4" /> Turlara Dön
      </Link>
      <h2 className="font-serif text-2xl font-bold text-brand-900">
        Tur Düzenle: <span className="text-brand-600">{tour.title}</span>
      </h2>
      <p className="mb-6 mt-1 text-sm text-muted">
        {tour.code && <>Tur No {tour.code} · </>}
        {tour._count.leads} başvuru ·{" "}
        <Link href={`/admin/reviews?tur=${tour.id}`} className="font-semibold text-brand-700 hover:text-gold-600">
          {tour._count.reviews} değerlendirme
        </Link>{" "}
        · Son güncelleme {tour.updatedAt.toLocaleString("tr-TR")}
        {isPastTour(tour.departureDate) && (
          <span className="ml-2 font-semibold text-red-600">· Tarihi geçti, sitede listelenmiyor</span>
        )}
      </p>
      <TourForm
        categories={categories}
        hotels={hotels}
        tourId={tour.id}
        slug={tour.slug}
        defaultValues={{
          code: tour.code ?? "",
          badge: tour.badge ?? "",
          title: tour.title,
          slug: tour.slug,
          categoryId: tour.categoryId,
          shortDescription: tour.shortDescription ?? "",
          description: tour.description ?? "",
          departureDate: toDateInput(tour.departureDate),
          returnDate: toDateInput(tour.returnDate),
          durationDays: num(tour.durationDays),
          durationNights: num(tour.durationNights),
          seatsLeft: num(tour.seatsLeft),
          departureCity: tour.departureCity ?? "",
          airline: tour.airline ?? "",
          startingPrice: num(tour.startingPrice),
          currency: tour.currency as (typeof CURRENCIES)[number],
          priceNote: tour.priceNote ?? "",
          coverImage: tour.coverImage ?? "",
          images: tour.images.map((i) => i.url),
          videoUrl: tour.videoUrl ?? "",
          includedServices: tour.includedServices ?? "",
          excludedServices: tour.excludedServices ?? "",
          requiredDocuments: tour.requiredDocuments ?? "",
          isFeatured: tour.isFeatured,
          isPublished: tour.isPublished,
          seoTitle: tour.seoTitle ?? "",
          seoDescription: tour.seoDescription ?? "",
          prices: tour.prices.map((p) => ({ roomType: p.roomType, price: String(p.price) })),
          hotels: tour.hotels.map((h) => ({
            city: h.city,
            name: h.name,
            nights: num(h.nights),
            stars: num(h.stars),
            distance: h.distance ?? "",
            image: h.image ?? "",
            videoUrl: h.videoUrl ?? "",
            link: h.link ?? "",
          })),
          legs: tour.legs.map((l) => ({
            type: l.type === "bus" ? "bus" : "flight",
            title: l.title,
            carrier: l.carrier ?? "",
            flightNo: l.flightNo ?? "",
            fromCode: l.fromCode ?? "",
            fromCity: l.fromCity ?? "",
            toCode: l.toCode ?? "",
            toCity: l.toCity ?? "",
            date: toDateInput(l.date),
            time: l.time ?? "",
          })),
          dayPrograms: tour.dayPrograms.map((d) => ({ dayNumber: String(d.dayNumber), title: d.title, description: d.description })),
          faqs: tour.faqs.map((f) => ({ question: f.question, answer: f.answer })),
        }}
      />
    </div>
  );
}
