import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { HotelForm } from "@/components/admin/hotel-form";
import { parseImages } from "@/lib/utils";
import type { HOTEL_CITIES } from "@/lib/validations";

export const metadata = { title: "Otel Düzenle" };

export default async function EditHotelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hotel = await prisma.hotel.findUnique({ where: { id } });
  if (!hotel) notFound();

  return (
    <div>
      <Link href="/admin/hotels" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-gold-600">
        <ArrowLeft className="size-4" /> Otellere Dön
      </Link>
      <h2 className="mb-6 font-serif text-2xl font-bold text-brand-900">
        Otel Düzenle: <span className="text-brand-600">{hotel.name}</span>
      </h2>
      <HotelForm
        hotelId={hotel.id}
        defaultValues={{
          name: hotel.name,
          slug: hotel.slug,
          city: hotel.city as (typeof HOTEL_CITIES)[number],
          region: hotel.region ?? "",
          distance: hotel.distance ?? "",
          stars: hotel.stars == null ? "" : String(hotel.stars),
          description: hotel.description ?? "",
          images: parseImages(hotel.images),
          isPublished: hotel.isPublished,
        }}
      />
    </div>
  );
}
