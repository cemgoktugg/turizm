import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BackLink } from "@/components/admin/sales/ui";
import { PrintButton } from "@/components/admin/sales/print-button";
import { RoomLabels } from "@/components/admin/sales/room-labels";
import { getRooming } from "@/lib/rooming-server";
import { getSettings } from "@/lib/settings";
import { getSalesBase } from "@/lib/sales-base-server";

export const metadata = { title: "Oda Etiketleri" };

/** Oda etiketleri: kapıya / anahtar zarfına (kişi yerleşmiş her oda için bir etiket) */
export default async function RoomLabelsPage({ params }: { params: Promise<{ id: string }> }) {
  const base = await getSalesBase();
  const { id } = await params;
  const tourId = Number(id);
  const tour = Number.isInteger(tourId)
    ? await prisma.serviceTour.findUnique({ where: { id: tourId }, select: { id: true, name: true, departureDate: true, returnDate: true } })
    : null;
  if (!tour) notFound();
  const [{ rooms, people }, settings] = await Promise.all([getRooming(tour.id), getSettings()]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
        <div>
          <BackLink href={`${base}/turlar/${tour.id}/odalar`} label="Odalamaya Dön" />
          <h2 className="font-serif text-2xl font-bold text-brand-900">Oda Etiketleri: {tour.name}</h2>
          <p className="text-sm text-muted">Kapıya ya da anahtar zarfına. Otel oda numarası girilmemişse elle yazmak için boşluk bırakılır.</p>
        </div>
        <PrintButton label="Etiketleri yazdır" />
      </div>
      <RoomLabels brand={settings.siteName} tour={tour} rooms={rooms} people={people} />
    </div>
  );
}
