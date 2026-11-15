"use client";

import { createContext, useContext, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Baby, BedDouble, BedSingle, ChevronDown, Loader2, Mars, Plus, Undo2, Venus } from "lucide-react";
import { createRoom, placeInRoom, undoRooming, unplaceSales } from "@/app/actions/rooming";
import { Modal } from "@/components/ui/modal";
import { ROOM_SIZES, type Gender, type RoomOption, type RoomOptionsByTour } from "@/lib/rooming";
import type { ActionResult } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Satış ekranlarında oda ataması (odalama sayfasına gitmeden). Oda seçimi görsel bir
 * pencerede açılır: hangi odada kimin kaldığı, boş yataklar ve boş odalar görünür;
 * odaya tıklayınca kişi / aile oraya yerleşir. Kurallar sunucuda (app/actions/rooming.ts).
 */

const RoomOptionsContext = createContext<RoomOptionsByTour>({});

/** Satış listesindeki satırların oda seçimi için turların odaları (bir kez gönderilir) */
export function RoomOptionsProvider({ options, children }: { options: RoomOptionsByTour; children: React.ReactNode }) {
  return <RoomOptionsContext.Provider value={options}>{children}</RoomOptionsContext.Provider>;
}

/** Yerleştirilecek kişi */
export type RoomWho = { saleId: number; name: string; gender: Gender | null; bed: boolean; groupId: number | null };

const MIXED = "karisik";
type CurrentRoom = number | null | typeof MIXED;

function GenderIcon({ gender, className }: { gender: Gender | null; className?: string }) {
  if (gender === "E") return <Mars className={cn("size-3.5 shrink-0 text-sky-700", className)} aria-label="Erkek" />;
  if (gender === "K") return <Venus className={cn("size-3.5 shrink-0 text-rose-600", className)} aria-label="Kadın" />;
  return <span className={cn("grid size-3.5 shrink-0 place-items-center rounded-full bg-slate-300 text-[9px] font-bold text-white", className)}>?</span>;
}

/** Odaya yerleşince oluşacak uyarı (engellemez): farklı kayıtlardan kadın-erkek / cinsiyeti bilinmeyen */
function mixWarning(room: RoomOption, who: RoomWho[]): string | null {
  const others = room.people.filter((p) => !who.some((w) => w.saleId === p.saleId));
  if (!others.length) return null;
  const all = [...others, ...who];
  const groupIds = new Set(all.map((p) => p.groupId));
  if (groupIds.size === 1 && !groupIds.has(null)) return null; // hepsi aynı aile
  const genders = new Set(all.filter((p) => p.bed).map((p) => p.gender));
  if (genders.has(null)) return "Cinsiyeti girilmemiş kişi var";
  return genders.size > 1 ? "Kadın ve erkek aynı odada olur" : null;
}

/** Oda kartı: yataklar tek tek; tıklanınca seçilir */
function RoomCard({
  room,
  who,
  current,
  onPick,
  disabled,
}: {
  room: RoomOption;
  who: RoomWho[];
  current: boolean;
  onPick?: () => void;
  disabled?: boolean;
}) {
  const others = room.people.filter((p) => !who.some((w) => w.saleId === p.saleId));
  const shown = current ? room.people : others;
  const adults = shown.filter((p) => p.bed);
  const babies = shown.filter((p) => !p.bed);
  const free = Math.max(room.size - adults.length, 0);
  const need = who.filter((w) => w.bed).length;
  const fits = room.size - others.filter((p) => p.bed).length >= need;
  const warning = !current && fits ? mixWarning(room, who) : null;
  const clickable = !!onPick && !current && fits && !disabled;

  return (
    <button
      type="button"
      onClick={clickable ? onPick : undefined}
      disabled={!clickable}
      className={cn(
        "flex w-full flex-col rounded-2xl border-2 bg-white p-3 text-left transition-colors",
        current ? "border-gold-500 bg-gold-50/60" : clickable ? "border-border hover:border-brand-500 hover:bg-brand-50/40" : "border-border/70 opacity-60",
        clickable ? "cursor-pointer" : "cursor-default",
      )}
    >
      <span className="mb-2 flex w-full items-center gap-2">
        <span className="font-serif text-base font-bold text-brand-900">Oda {room.no}</span>
        <span className="text-xs text-muted">{room.size} kişilik</span>
        {(room.meccaNo || room.medinaNo) && (
          <span className="text-[11px] font-semibold text-brand-700">{[room.meccaNo && `Mekke ${room.meccaNo}`, room.medinaNo && `Medine ${room.medinaNo}`].filter(Boolean).join(" · ")}</span>
        )}
        <span
          className={cn(
            "ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold",
            current ? "bg-gold-200 text-gold-900" : free === 0 ? "bg-slate-100 text-slate-600" : adults.length === 0 ? "bg-green-100 text-green-800" : "bg-brand-100 text-brand-800",
          )}
        >
          {current ? "Şu anki oda" : free === 0 ? "Dolu" : adults.length === 0 ? "Boş oda" : `${free} boş yatak`}
        </span>
      </span>
      <span className="grid w-full gap-1">
        {adults.map((p) => (
          <span
            key={p.saleId}
            className={cn(
              "flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs",
              p.gender === "E" ? "bg-sky-50" : p.gender === "K" ? "bg-rose-50" : "bg-slate-50",
              who.some((w) => w.saleId === p.saleId) && "ring-1 ring-gold-500",
            )}
          >
            <GenderIcon gender={p.gender} />
            <span className="truncate font-semibold text-brand-900">{p.name}</span>
          </span>
        ))}
        {Array.from({ length: free }, (_, i) => (
          <span key={`bos-${i}`} className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-2 py-1 text-xs text-muted/80">
            <BedSingle className="size-3.5" /> Boş yatak
          </span>
        ))}
        {babies.length > 0 && (
          <span className="flex flex-wrap items-center gap-1 text-[11px] text-muted">
            <Baby className="size-3.5" /> {babies.map((p) => p.name).join(", ")}
          </span>
        )}
      </span>
      {warning && (
        <span className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-amber-700">
          <AlertTriangle className="size-3 shrink-0" /> {warning}
        </span>
      )}
      {!current && !fits && free > 0 && <span className="mt-1.5 text-[11px] text-muted">{need} kişi sığmaz</span>}
    </button>
  );
}

/**
 * Oda seçimi: düğme + açılan pencere. variant "cell": listede küçük düğme; "field": panelde
 * odayı ve oda arkadaşlarını gösteren alan.
 */
export function RoomChooser({
  tourId,
  who,
  roomId,
  rooms,
  suggestedSize,
  title,
  roomingHref,
  variant = "field",
}: {
  tourId: number;
  who: RoomWho[];
  /** Şu anki oda; kişiler farklı odalardaysa "karisik" */
  roomId: CurrentRoom;
  rooms: RoomOption[];
  /** Satışta seçilen oda tipi (önce bu tipteki odalar gösterilir) */
  suggestedSize?: number | null;
  title: string;
  roomingHref?: string;
  variant?: "cell" | "field";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [size, setSize] = useState<number | null>(null);
  // Dolu odalar da açık gelir: kime hangi odanın verildiği görünsün (kapatılabilir)
  const [showFull, setShowFull] = useState(true);
  const current = typeof roomId === "number" ? rooms.find((r) => r.id === roomId) : undefined;
  const saleIds = who.map((w) => w.saleId);
  const need = who.filter((w) => w.bed).length;

  // Varsayılan süzgeç: satıştaki oda tipi (o tipte oda varsa)
  const activeSize = size ?? (suggestedSize && rooms.some((r) => r.size === suggestedSize) ? suggestedSize : 0);
  // Odalar: boş odalar, boş yatağı olanlar (en dolu önce), dolular
  const list = rooms.filter((r) => r.id !== current?.id && (!activeSize || r.size === activeSize));
  const freeOf = (r: RoomOption) => r.size - r.people.filter((p) => p.bed && !saleIds.includes(p.saleId)).length;
  const groups = {
    empty: list.filter((r) => r.people.length === 0),
    partial: list.filter((r) => r.people.length > 0 && freeOf(r) > 0).sort((a, b) => freeOf(a) - freeOf(b) || a.no - b.no),
    full: list.filter((r) => r.people.length > 0 && freeOf(r) <= 0),
  };

  function run(fn: () => Promise<ActionResult>) {
    start(async () => {
      const res = await fn();
      if (!res.ok) return void toast.error(res.message);
      toast.success(res.message, { action: { label: "Geri al", onClick: undo }, duration: 8000 });
      setOpen(false);
      router.refresh();
    });
  }
  function undo() {
    start(async () => {
      const res = await undoRooming(tourId);
      if (!res.ok) return void toast.error(res.message);
      toast.success(res.message);
      router.refresh();
    });
  }

  const trigger =
    variant === "cell" ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={current ? `Oda ${current.no}: ${current.people.map((p) => p.name).join(", ")}` : "Odaya yerleştirmek için tıklayın"}
        className={cn(
          "inline-flex items-center gap-1 whitespace-nowrap rounded-lg border px-2 py-1 text-xs font-semibold no-underline",
          current ? "border-border bg-white text-brand-800 hover:bg-cream-100" : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100",
        )}
      >
        <BedDouble className="size-3.5" />
        {current ? `Oda ${current.no} · ${current.size} kişilik` : roomId === MIXED ? "Farklı odalarda" : "Oda ata"}
      </button>
    ) : (
      <div className="flex w-full flex-col gap-1.5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex w-fit items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-semibold",
            current ? "border-border bg-white text-brand-800 hover:bg-cream-100" : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100",
          )}
        >
          <BedDouble className="size-4" />
          {current ? `Oda ${current.no} · ${current.size} kişilik` : roomId === MIXED ? "Farklı odalarda" : "Oda ata"}
          <span className="font-normal text-muted">· {current || roomId === MIXED ? "değiştir" : "seç"}</span>
        </button>
        {current && (current.meccaNo || current.medinaNo) && (
          <span className="text-xs font-semibold text-brand-700">
            Otel oda no: {[current.meccaNo && `Mekke ${current.meccaNo}`, current.medinaNo && `Medine ${current.medinaNo}`].filter(Boolean).join(" · ")}
          </span>
        )}
        {current && current.people.some((p) => !saleIds.includes(p.saleId)) && (
          <span className="text-xs text-muted">
            Birlikte: {current.people.filter((p) => !saleIds.includes(p.saleId)).map((p) => p.name).join(", ")}
          </span>
        )}
      </div>
    );

  return (
    <>
      {trigger}
      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title={`Oda seç: ${title}`}
        size="xl"
        footer={
          <div className="flex flex-wrap items-center gap-2">
            {roomingHref && (
              <Link href={roomingHref} className="text-sm font-semibold text-brand-700 hover:text-gold-600">
                Turun bütün odaları (Odalama)
              </Link>
            )}
            {pending && <Loader2 className="size-4 animate-spin text-muted" />}
            {(current || roomId === MIXED) && (
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => unplaceSales(tourId, saleIds))}
                className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <Undo2 className="size-4" /> Odadan çıkar
              </button>
            )}
          </div>
        }
      >
        {/* Yerleşecek kişiler */}
        <div className="mb-4 flex flex-wrap items-center gap-1.5 text-sm">
          {who.map((w) => (
            <span key={w.saleId} className={cn("inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold", w.gender === "E" ? "bg-sky-50" : w.gender === "K" ? "bg-rose-50" : "bg-slate-100")}>
              <GenderIcon gender={w.gender} /> {w.name}
              {!w.bed && <span className="font-normal text-muted">(yataksız)</span>}
            </span>
          ))}
          <span className="text-xs text-muted">
            · {need} yatak{suggestedSize ? ` · satışta ${suggestedSize} kişilik oda` : ""}
          </span>
        </div>

        {current && (
          <div className="mb-4 max-w-sm">
            <RoomCard room={current} who={who} current />
          </div>
        )}

        {/* Oda tipi süzgeci */}
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {[0, ...ROOM_SIZES].map((n) => {
            const count = n ? rooms.filter((r) => r.size === n).length : rooms.length;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setSize(n)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold",
                  activeSize === n ? "border-brand-700 bg-brand-700 text-white" : "border-border bg-white text-brand-800 hover:bg-cream-100",
                )}
              >
                {n ? `${n} kişilik` : "Tüm odalar"} ({count})
              </button>
            );
          })}
        </div>

        {/* Yeni oda */}
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-brand-300 bg-brand-50/40 p-3">
          <span className="text-sm font-semibold text-brand-900">Yeni oda aç:</span>
          {ROOM_SIZES.map((n) => (
            <button
              key={n}
              type="button"
              disabled={pending || need > n}
              onClick={() => run(() => createRoom(tourId, n, saleIds))}
              title={need > n ? `${need} kişi ${n} kişilik odaya sığmaz` : `Yeni ${n} kişilik oda açılır ve yerleştirilir`}
              className={cn(
                "inline-flex h-9 items-center gap-1 rounded-xl px-3 text-sm font-bold disabled:opacity-40",
                n === suggestedSize ? "bg-gold-400 text-brand-950 hover:bg-gold-300" : "border border-border bg-white text-brand-800 hover:bg-cream-100",
              )}
            >
              <Plus className="size-3.5" /> {n} kişilik{n === suggestedSize ? " (satıştaki)" : ""}
            </button>
          ))}
        </div>

        {rooms.length === 0 ? (
          <p className="rounded-2xl bg-cream-50 p-4 text-sm text-muted">Bu turda henüz oda yok. Yukarıdan yeni oda açın.</p>
        ) : (
          <div className="space-y-5">
            {groups.empty.length > 0 && (
              <section>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-green-800">Boş odalar ({groups.empty.length})</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {groups.empty.map((r) => (
                    <RoomCard key={r.id} room={r} who={who} current={false} disabled={pending} onPick={() => run(() => placeInRoom(tourId, saleIds, r.id))} />
                  ))}
                </div>
              </section>
            )}
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-700">Boş yatağı olan odalar ({groups.partial.length})</h3>
              {groups.partial.length === 0 ? (
                <p className="text-sm text-muted">Bu tipte boş yatağı olan oda yok.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {groups.partial.map((r) => (
                    <RoomCard key={r.id} room={r} who={who} current={false} disabled={pending} onPick={() => run(() => placeInRoom(tourId, saleIds, r.id))} />
                  ))}
                </div>
              )}
            </section>
            {groups.full.length > 0 && (
              <section>
                <button
                  type="button"
                  onClick={() => setShowFull((v) => !v)}
                  className="mb-2 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted hover:text-brand-800"
                >
                  Dolu odalar ({groups.full.length}) <ChevronDown className={cn("size-3.5 transition", showFull && "rotate-180")} />
                </button>
                {showFull && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {groups.full.map((r) => (
                      <RoomCard key={r.id} room={r} who={who} current={false} />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

/** Satış listesi / aile paneli satırı: odayı gösterir, tıklanınca oda seçimi açılır */
export function RoomCell({
  tourId,
  who,
  roomId,
  suggestedSize,
  roomingHref,
}: {
  tourId: number;
  who: RoomWho;
  roomId: number | null;
  suggestedSize?: number | null;
  roomingHref?: string;
}) {
  const rooms = useContext(RoomOptionsContext)[tourId] ?? [];
  return (
    <RoomChooser
      variant="cell"
      tourId={tourId}
      who={[who]}
      roomId={roomId}
      rooms={rooms}
      suggestedSize={suggestedSize}
      title={who.name}
      roomingHref={roomingHref}
    />
  );
}
