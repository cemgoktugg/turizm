import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Receipt } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { BackLink, qs } from "@/components/admin/sales/ui";
import { RoomingBoard } from "@/components/admin/sales/rooming-board";
import { GENDERS, groupByRoom, hotelSummary, takesBed } from "@/lib/rooming";
import { getRooming } from "@/lib/rooming-server";
import { passengerLabel } from "@/lib/sale-pricing";
import { shortDate } from "@/lib/sales";
import { cn } from "@/lib/utils";
import { getSalesBase } from "@/lib/sales-base-server";

export const metadata = { title: "Odalama" };

export default async function RoomingPage({ params }: { params: Promise<{ id: string }> }) {
  const base = await getSalesBase();
  const { id } = await params;
  const tourId = Number(id);
  const tour = Number.isInteger(tourId)
    ? await prisma.serviceTour.findUnique({
        where: { id: tourId },
        select: { id: true, name: true, period: true, departureDate: true, returnDate: true, days: true, accommodation: true },
      })
    : null;
  if (!tour) notFound();
  const { rooms, people } = await getRooming(tour.id);
  const sum = hotelSummary(rooms, people);
  const byRoom = groupByRoom(people);
  const dates = `${shortDate(tour.departureDate)} – ${shortDate(tour.returnDate)} · ${tour.days} gün`;

  return (
    <div>
      <div className="print:hidden">
        <BackLink href={`${base}/turlar`} label="Turlara Dön" />
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">
              {tour.period} · Tur No {tour.id}
            </p>
            <h2 className="font-serif text-2xl font-bold text-brand-900">Odalama: {tour.name}</h2>
            <p className="text-sm text-muted">
              {dates}
              {tour.accommodation ? ` · ${tour.accommodation}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`${base}${qs({ donem: tour.period, tur: String(tour.id) })}`}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-brand-800 hover:bg-cream-100"
            >
              <Receipt className="size-4" /> Satışlar
            </Link>
            <a
              href={`/api/admin/satis/export${qs({ rapor: "odalar", tur: String(tour.id) })}`}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-brand-800 hover:bg-cream-100"
              title="Oda listesini Excel (CSV) olarak indir"
            >
              <Download className="size-4" /> Excel
            </a>
          </div>
        </div>

        {/* Otele bildirilecek oda sayıları */}
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Otele bildirilecek</p>
            <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-2">
              {[4, 3, 2].map((size) => (
                <p key={size} className="text-brand-900">
                  <span className="text-3xl font-bold tabular-nums">{sum.bySize[size] ?? 0}</span>
                  <span className="ml-1 text-sm font-semibold">× {size} kişilik oda</span>
                </p>
              ))}
            </div>
            <p className="mt-2 text-sm text-brand-800">
              Toplam <strong>{sum.rooms} oda</strong>, <strong>{sum.guests} kişi</strong>
              {sum.babies ? ` + ${sum.babies} bebek (yataksız)` : ""}
              {sum.emptyBeds ? ` · ${sum.emptyBeds} boş yatak` : ""}
              {sum.emptyRooms ? ` · ${sum.emptyRooms} boş oda bildirime girmez` : ""}
            </p>
          </div>
          <div className={cn("rounded-2xl border p-4", sum.unplaced ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50")}>
            <p className={cn("text-xs font-bold uppercase tracking-wide", sum.unplaced ? "text-red-700" : "text-green-800")}>Yerleşmemiş</p>
            <p className={cn("mt-1 text-3xl font-bold tabular-nums", sum.unplaced ? "text-red-600" : "text-green-700")}>{sum.unplaced}</p>
            <p className="text-sm text-muted">
              {sum.unplaced ? "Kişi henüz bir odaya yerleşmedi." : "Tura kayıtlı herkes bir odada."} Toplam {people.length} kayıt.
            </p>
          </div>
        </div>

        <RoomingBoard tourId={tour.id} rooms={rooms} people={people} />
      </div>

      {/* Yazdırılan oda listesi (otel / görevli için) */}
      <div className="hidden text-[11px] text-black print:block">
        <h1 className="text-lg font-bold">Oda Listesi: {tour.name}</h1>
        <p>
          {tour.period} · {dates}
          {tour.accommodation ? ` · ${tour.accommodation}` : ""}
        </p>
        <p className="mb-3 mt-1 font-semibold">
          {[4, 3, 2].map((size) => `${size} kişilik: ${sum.bySize[size] ?? 0} oda`).join(" · ")} · Toplam {sum.rooms} oda, {sum.guests} kişi
          {sum.babies ? ` + ${sum.babies} bebek` : ""}
        </p>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Oda", "Tip", "Ad Soyad", "Cinsiyet", "Yolcu", "T.C.", "Aile / Grup"].map((h) => (
                <th key={h} className="border border-black px-1.5 py-1 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map((r, i) => {
              const list = byRoom.get(r.id) ?? [];
              if (!list.length) return null;
              const ordered = [...list.filter((p) => takesBed(p.passenger)), ...list.filter((p) => !takesBed(p.passenger))];
              return ordered.map((p, j) => (
                <tr key={p.saleId} className="break-inside-avoid">
                  {j === 0 && (
                    <>
                      <td rowSpan={ordered.length} className="border border-black px-1.5 py-1 align-top font-bold">
                        {i + 1}
                      </td>
                      <td rowSpan={ordered.length} className="border border-black px-1.5 py-1 align-top">
                        {r.size} kişilik
                      </td>
                    </>
                  )}
                  <td className="border border-black px-1.5 py-1">{p.name}</td>
                  <td className="border border-black px-1.5 py-1">{p.gender ? GENDERS[p.gender] : ""}</td>
                  <td className="border border-black px-1.5 py-1">{passengerLabel(p.passenger)}</td>
                  <td className="border border-black px-1.5 py-1">{p.tc ?? ""}</td>
                  <td className="border border-black px-1.5 py-1">{p.groupName ?? ""}</td>
                </tr>
              ));
            })}
          </tbody>
        </table>
        {sum.unplaced > 0 && <p className="mt-2 font-bold">Not: {sum.unplaced} kişi henüz bir odaya yerleşmedi.</p>}
      </div>
    </div>
  );
}
