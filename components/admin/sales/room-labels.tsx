import { groupByRoom, takesBed, type Room, type RoomPerson } from "@/lib/rooming";
import { shortDate } from "@/lib/sales";

/**
 * Oda etiketleri (kapıya / anahtar zarfına): kişi yerleşmiş her oda için bir etiket;
 * A4'e iki sütun. Otel oda numarası girilmemişse elle yazmak için boşluk bırakılır.
 * Odalama sayfasından ve görevli ekranından açılır.
 */
export function RoomLabels({
  brand,
  tour,
  rooms,
  people,
}: {
  brand: string;
  tour: { name: string; departureDate: Date; returnDate: Date };
  rooms: Room[];
  people: Pick<RoomPerson, "saleId" | "name" | "passenger" | "roomId">[];
}) {
  const byRoom = groupByRoom(people as RoomPerson[]);
  const labels = rooms.map((r, i) => ({ ...r, no: i + 1, list: byRoom.get(r.id) ?? [] })).filter((r) => r.list.length);

  if (!labels.length) return <p className="rounded-2xl bg-white p-6 text-sm text-muted">Henüz kişi yerleşmiş oda yok.</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2 print:grid-cols-2 print:gap-2">
      {labels.map((r) => {
        const adults = r.list.filter((p) => takesBed(p.passenger));
        const babies = r.list.filter((p) => !takesBed(p.passenger));
        return (
          <div key={r.id} className="break-inside-avoid rounded-xl border-2 border-brand-900 bg-white p-4 text-black print:rounded-lg print:p-3">
            <div className="flex items-baseline justify-between gap-2 border-b border-black/20 pb-1 text-[10px] font-semibold uppercase tracking-wide">
              <span>{brand}</span>
              <span className="truncate text-right">
                {tour.name} · {shortDate(tour.departureDate)} – {shortDate(tour.returnDate)}
              </span>
            </div>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-3xl font-black leading-none">ODA {r.no}</p>
              <p className="text-sm font-semibold">{r.size} kişilik</p>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <p>
                Mekke: <strong className="text-base">{r.meccaNo || "________"}</strong>
              </p>
              <p>
                Medine: <strong className="text-base">{r.medinaNo || "________"}</strong>
              </p>
            </div>
            <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-sm font-semibold">
              {adults.map((p) => (
                <li key={p.saleId}>
                  {p.name}
                  {p.passenger ? <span className="font-normal"> ({p.passenger} yaş)</span> : null}
                </li>
              ))}
            </ol>
            {babies.length > 0 && <p className="mt-1 text-xs">Bebek: {babies.map((p) => p.name).join(", ")}</p>}
          </div>
        );
      })}
    </div>
  );
}
