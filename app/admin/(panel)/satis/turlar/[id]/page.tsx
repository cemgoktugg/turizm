import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ServiceTourForm } from "@/components/admin/sales/service-tour-form";
import { BackLink } from "@/components/admin/sales/ui";
import { getPeriods, inputDate } from "@/lib/sales";
import type { CURRENCIES } from "@/lib/validations";

export const metadata = { title: "Tur Düzenle (Satış)" };

export default async function EditServiceTourPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tourId = Number(id);
  const tour = Number.isInteger(tourId) ? await prisma.serviceTour.findUnique({ where: { id: tourId } }) : null;
  if (!tour) notFound();
  const [staff, periods] = await Promise.all([
    prisma.staff.findMany({ orderBy: { fullName: "asc" }, select: { id: true, fullName: true } }),
    getPeriods(),
  ]);

  return (
    <div>
      <BackLink href="/admin/satis/turlar" label="Turlara Dön" />
      <h2 className="mb-6 font-serif text-2xl font-bold text-brand-900">
        Tur Düzenle: <span className="text-brand-600">#{tour.id} {tour.name}</span>
      </h2>
      <ServiceTourForm
        tourId={tour.id}
        staff={staff}
        periods={periods}
        defaultValues={{
          name: tour.name,
          period: tour.period,
          departureDate: inputDate(tour.departureDate),
          returnDate: inputDate(tour.returnDate),
          price2: tour.price2 == null ? "" : String(tour.price2),
          price3: tour.price3 == null ? "" : String(tour.price3),
          price4: tour.price4 == null ? "" : String(tour.price4),
          currency: tour.currency as (typeof CURRENCIES)[number],
          accommodation: tour.accommodation ?? "",
          guide1Id: String(tour.guide1Id),
          guide2Id: tour.guide2Id == null ? "" : String(tour.guide2Id),
          days: String(tour.days),
          note: tour.note ?? "",
          isActive: tour.isActive,
        }}
      />
    </div>
  );
}
