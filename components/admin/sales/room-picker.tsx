"use client";

import { createContext, useContext, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BedDouble, Loader2 } from "lucide-react";
import { createRoom, placeInRoom, unplaceSales } from "@/app/actions/rooming";
import { ROOM_SIZES, type RoomOption, type RoomOptionsByTour } from "@/lib/rooming";
import { cn } from "@/lib/utils";

/**
 * Satış ekranlarında oda ataması (odalama sayfasına gitmeden): kişiyi / aileyi mevcut bir
 * odaya koyar, yeni oda açar ya da odadan çıkarır. Kurallar sunucuda (app/actions/rooming.ts).
 */

const RoomOptionsContext = createContext<RoomOptionsByTour>({});

/** Satış listesindeki satırların oda seçimi için turların odaları (bir kez gönderilir) */
export function RoomOptionsProvider({ options, children }: { options: RoomOptionsByTour; children: React.ReactNode }) {
  return <RoomOptionsContext.Provider value={options}>{children}</RoomOptionsContext.Provider>;
}

const MIXED = "karisik";

export function RoomPicker({
  tourId,
  saleIds,
  beds,
  roomId,
  rooms,
  suggestedSize,
  className,
  openOnMount,
  onDone,
}: {
  tourId: number;
  saleIds: number[];
  /** Yerleşecek kişilerin kapladığı yatak (0-2 yaş bebek kaplamaz) */
  beds: number;
  /** Şu anki oda; kişiler farklı odalardaysa "karisik" */
  roomId: number | null | typeof MIXED;
  rooms: RoomOption[];
  /** Satışta seçilen oda tipi (yeni oda seçeneğinde belirtilir) */
  suggestedSize?: number | null;
  className?: string;
  /** Listede tıklanınca açılan seçim: seçenekler hemen gösterilir */
  openOnMount?: boolean;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const ref = useRef<HTMLSelectElement>(null);
  const value = roomId === MIXED ? MIXED : roomId ? `r:${roomId}` : "";

  useEffect(() => {
    if (!openOnMount) return;
    ref.current?.focus();
    try {
      ref.current?.showPicker?.();
    } catch {
      // Tarayıcı desteklemiyorsa odaklanmış seçim kutusu kalır
    }
  }, [openOnMount]);

  function change(v: string) {
    start(async () => {
      const res =
        v === ""
          ? await unplaceSales(tourId, saleIds)
          : v.startsWith("n:")
            ? await createRoom(tourId, Number(v.slice(2)), saleIds)
            : await placeInRoom(tourId, saleIds, Number(v.slice(2)));
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else toast.error(res.message);
      onDone?.();
    });
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <select
        ref={ref}
        value={value}
        disabled={pending}
        onChange={(e) => change(e.target.value)}
        onBlur={() => !pending && onDone?.()}
        aria-label="Oda"
        className="h-9 w-full min-w-0 rounded-lg border border-border bg-white px-2 text-sm text-foreground focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
      >
        {roomId === MIXED && (
          <option value={MIXED} disabled>
            Farklı odalarda
          </option>
        )}
        <option value="">Odaya yerleşmedi</option>
        <optgroup label="Yeni oda aç">
          {ROOM_SIZES.map((n) => (
            <option key={n} value={`n:${n}`} disabled={beds > n}>
              {`Yeni ${n} kişilik oda${n === suggestedSize ? " (satıştaki)" : ""}`}
            </option>
          ))}
        </optgroup>
        {rooms.length > 0 && (
          <optgroup label="Mevcut odalar">
            {rooms.map((r) => {
              const others = r.people.filter((p) => !saleIds.includes(p.saleId));
              const current = r.id === roomId;
              // Şu anki odada boş yatak, kişilerin kendisi de sayılarak gösterilir
              const free = r.size - (current ? r.people : others).filter((p) => p.bed).length;
              const names = others.map((p) => p.name).join(", ");
              const state = current ? `şu anki oda${free > 0 ? `, ${free} boş` : ""}` : free <= 0 ? "dolu" : `${free} boş`;
              return (
                <option key={r.id} value={`r:${r.id}`} disabled={!current && r.size - others.filter((p) => p.bed).length < beds}>
                  {`Oda ${r.no} · ${r.size} kişilik · ${state}${names ? ` · ${names}` : ""}`}
                </option>
              );
            })}
          </optgroup>
        )}
      </select>
      {pending && <Loader2 className="size-4 shrink-0 animate-spin text-muted" />}
    </span>
  );
}

/** Satış listesi / aile paneli satırı: odayı gösterir, tıklanınca oda seçimi açılır */
export function RoomCell({
  tourId,
  saleId,
  roomId,
  bed,
  suggestedSize,
}: {
  tourId: number;
  saleId: number;
  roomId: number | null;
  bed: boolean;
  suggestedSize?: number | null;
}) {
  const rooms = useContext(RoomOptionsContext)[tourId] ?? [];
  const [open, setOpen] = useState(false);
  const room = rooms.find((r) => r.id === roomId);

  if (open)
    return (
      <RoomPicker
        tourId={tourId}
        saleIds={[saleId]}
        beds={bed ? 1 : 0}
        roomId={roomId}
        rooms={rooms}
        suggestedSize={suggestedSize}
        className="w-60"
        openOnMount
        onDone={() => setOpen(false)}
      />
    );
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      title={room ? `${room.people.map((p) => p.name).join(", ")} — değiştirmek için tıklayın` : "Odaya yerleştirmek için tıklayın"}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-lg border px-2 py-1 text-xs font-semibold no-underline",
        room ? "border-border bg-white text-brand-800 hover:bg-cream-100" : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100",
      )}
    >
      <BedDouble className="size-3.5" />
      {room ? `Oda ${room.no} · ${room.size} kişilik` : "Oda ata"}
    </button>
  );
}
