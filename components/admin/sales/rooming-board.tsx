"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Baby, BedSingle, CheckCircle2, History, Loader2, Mars, Plus, Printer, RotateCcw, Trash2, Undo2, Venus, WandSparkles, X } from "lucide-react";
import {
  autoPlaceRooms,
  createRoom,
  deleteRoom,
  placeInRoom,
  resetRooms,
  resizeRoom,
  setCustomerGender,
  setRoomNumber,
  undoRooming,
  unplaceSales,
} from "@/app/actions/rooming";
import { RoomNoInput } from "./room-no-input";
import { GENDERS, ROOM_SIZES, bedsUsed, groupByRoom, roomIssues, takesBed, unitKey, type AutoPlan, type Gender, type Room, type RoomPerson } from "@/lib/rooming";
import type { ActionResult } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Sürüklenen kişilerin satış numaraları bu türle taşınır */
const DRAG_TYPE = "application/x-oda-kisiler";

/** Odadaki kişilerin ortak cinsiyeti (oda kartının rengi için); karışık / boşsa null */
function toneOf(people: RoomPerson[]): Gender | "aile" | null {
  const adults = people.filter((p) => takesBed(p.passenger));
  if (!adults.length) return null;
  const set = new Set(adults.map((p) => p.gender));
  if (set.size === 1 && adults[0].gender) return adults[0].gender;
  return "aile";
}

/** Geri alınabilecek son işlem */
export type LastUndo = { label: string; by: string | null; at: string } | null;

export function RoomingBoard({ tourId, rooms, people, lastUndo }: { tourId: number; rooms: Room[]; people: RoomPerson[]; lastUndo: LastUndo }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [selected, setSelected] = useState<number[]>([]);
  const [skippedAll, setSkipped] = useState<AutoPlan["skipped"]>([]);
  const byRoom = useMemo(() => groupByRoom(people), [people]);
  const unplaced = people.filter((p) => p.roomId == null);
  // Atlananlardan sonradan elle yerleştirilenler listeden düşer
  const skipped = skippedAll.filter((s) => unplaced.some((p) => p.saleId === s.saleId));
  // Sayfa yenilenince artık listede olmayan seçimler yok sayılır
  const sel = selected.filter((id) => people.some((p) => p.saleId === id));
  const selPeople = people.filter((p) => sel.includes(p.saleId));

  /** undoable: başarı bildiriminde "Geri al" düğmesi çıkar */
  function run<T>(fn: () => Promise<ActionResult<T>>, after?: (res: ActionResult<T>) => void, undoable = true) {
    start(async () => {
      const res = await fn();
      if (!res.ok) return void toast.error(res.message);
      toast.success(res.message, undoable ? { action: { label: "Geri al", onClick: undo }, duration: 8000 } : undefined);
      setSelected([]);
      after?.(res);
      router.refresh();
    });
  }
  function undo() {
    run(() => undoRooming(tourId), () => setSkipped([]), false);
  }

  const toggle = (ids: number[]) =>
    setSelected((cur) => (ids.every((id) => cur.includes(id)) ? cur.filter((id) => !ids.includes(id)) : [...new Set([...cur, ...ids])]));
  const placeInto = (roomId: number, ids = sel) => {
    if (!ids.length || ids.every((id) => people.find((p) => p.saleId === id)?.roomId === roomId)) return;
    run(() => placeInRoom(tourId, ids, roomId));
  };
  const unplace = (ids: number[]) => run(() => unplaceSales(tourId, ids));
  const dragIds = (id: number) => (sel.includes(id) ? sel : [id]);
  const readDrop = (e: React.DragEvent): number[] => {
    try {
      const ids = JSON.parse(e.dataTransfer.getData(DRAG_TYPE) || "[]");
      return Array.isArray(ids) ? ids.filter((n) => Number.isInteger(n)) : [];
    } catch {
      return [];
    }
  };
  const allowDrop = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes(DRAG_TYPE)) e.preventDefault();
  };

  const chip = (p: RoomPerson, opts: { showGroup?: boolean } = {}) => (
    <PersonChip
      key={p.saleId}
      p={p}
      selected={sel.includes(p.saleId)}
      showGroup={opts.showGroup}
      onToggle={() => toggle([p.saleId])}
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_TYPE, JSON.stringify(dragIds(p.saleId)));
        e.dataTransfer.effectAllowed = "move";
      }}
      onGender={(g) => run(() => setCustomerGender(p.customerId, g), undefined, false)}
      disabled={pending}
    />
  );

  // Yerleşmemişler: aileler birlikte, tek kayıtlar satıştaki oda tipine göre
  const families = new Map<string, RoomPerson[]>();
  const singles = new Map<number | "yok", RoomPerson[]>();
  for (const p of unplaced) {
    if (p.groupId) families.set(unitKey(p), [...(families.get(unitKey(p)) ?? []), p]);
    else singles.set(p.roomSize ?? "yok", [...(singles.get(p.roomSize ?? "yok") ?? []), p]);
  }
  const singleGroups = [...singles.entries()].sort(([a], [b]) => (a === "yok" ? 1 : b === "yok" ? -1 : b - a));

  return (
    <div className={cn("pb-24", pending && "cursor-progress")}>
      {/* Araç çubuğu */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-white p-3 shadow-soft">
        <button
          type="button"
          disabled={pending || unplaced.length === 0}
          onClick={() => run(() => autoPlaceRooms(tourId), (res) => setSkipped(res.data?.skipped ?? []))}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
          title="Yerleşmemiş herkesi satışta seçtiği oda tipine göre yerleştirir: aileler birlikte, diğerleri aynı cinsiyetten kişilerle. Mevcut yerleşime dokunmaz."
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <WandSparkles className="size-4" />} Otomatik Yerleştir
        </button>
        <span className="ml-2 text-sm font-semibold text-muted">Boş oda aç:</span>
        {ROOM_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            disabled={pending}
            onClick={() => run(() => createRoom(tourId, size, []))}
            className="inline-flex h-10 items-center gap-1 rounded-xl border border-border px-3 text-sm font-semibold text-brand-800 hover:bg-cream-100 disabled:opacity-50"
          >
            <Plus className="size-3.5" /> {size} kişilik
          </button>
        ))}
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending || !lastUndo}
            onClick={undo}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold text-brand-800 hover:bg-cream-100 disabled:opacity-40"
            title={lastUndo ? `Geri al: ${lastUndo.label}${lastUndo.by ? ` (${lastUndo.by}, ${lastUndo.at})` : ""}` : "Geri alınacak işlem yok"}
          >
            <History className="size-4" /> Geri al
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold text-brand-800 hover:bg-cream-100"
            title="Otele verilecek oda listesini yazdır"
          >
            <Printer className="size-4" /> Yazdır
          </button>
          <button
            type="button"
            disabled={pending || rooms.length === 0}
            onClick={() => {
              if (window.confirm("Bütün odalar silinecek ve herkes yerleşmemişler listesine dönecek. Emin misiniz?")) run(() => resetRooms(tourId));
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
          >
            <RotateCcw className="size-4" /> Sıfırla
          </button>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[300px_1fr]">
        {/* Yerleşmemişler */}
        <aside
          onDragOver={allowDrop}
          onDrop={(e) => {
            const ids = readDrop(e).filter((id) => people.find((p) => p.saleId === id)?.roomId != null);
            if (ids.length) unplace(ids);
          }}
          className="rounded-2xl border border-border bg-white p-3 shadow-soft lg:sticky lg:top-32 lg:max-h-[calc(100dvh-9rem)] lg:overflow-y-auto"
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-brand-900">Yerleşmemiş</h3>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", unplaced.length ? "bg-red-100 text-red-700" : "bg-green-100 text-green-800")}>
              {unplaced.length} kişi
            </span>
          </div>
          {unplaced.length === 0 ? (
            <p className="flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-800">
              <CheckCircle2 className="size-4" /> Herkes bir odaya yerleşti.
            </p>
          ) : (
            <p className="mb-3 text-xs text-muted">Kişiyi (ya da aileyi) seçip bir odaya tıklayın veya sürükleyip bırakın.</p>
          )}

          {[...families.values()].map((members) => (
            <div key={unitKey(members[0])} className="mb-2 rounded-xl border border-gold-200 bg-gold-50/50 p-2">
              <button
                type="button"
                onClick={() => toggle(members.map((m) => m.saleId))}
                className="mb-1.5 flex w-full items-center justify-between gap-2 text-left text-xs font-bold text-gold-800 hover:text-brand-800"
                title="Ailenin tamamını seç"
              >
                <span className="truncate">{members[0].groupName}</span>
                <span className="shrink-0 font-semibold text-muted">
                  {members.length} kişi{members[0].roomSize ? ` · ${members[0].roomSize} kişilik` : ""}
                </span>
              </button>
              <div className="grid gap-1">{members.map((p) => chip(p))}</div>
            </div>
          ))}
          {singleGroups.map(([size, list]) => (
            <div key={size} className="mb-2">
              <p className="mb-1 mt-3 text-[11px] font-bold uppercase tracking-wide text-muted">
                {size === "yok" ? "Oda tipi seçilmemiş" : `${size} kişilik oda alanlar`}
              </p>
              <div className="grid gap-1">{list.map((p) => chip(p))}</div>
            </div>
          ))}

          {skipped.length > 0 && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <p className="mb-1 flex items-center gap-1 font-bold">
                <AlertTriangle className="size-3.5" /> Otomatik yerleştirilemeyenler
              </p>
              <ul className="space-y-0.5">
                {skipped.map((s) => (
                  <li key={s.saleId}>
                    <strong>{s.name}</strong>: {s.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Odalar */}
        <section>
          {rooms.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border bg-white/60 p-8 text-center text-sm text-muted">
              Henüz oda yok. <strong>Otomatik Yerleştir</strong> herkesi satışta seçtiği oda tipine göre yerleştirir; dilerseniz kişileri seçip
              aşağıdaki çubuktan yeni oda açabilirsiniz.
            </div>
          ) : (
            [...ROOM_SIZES].reverse().map((size) => {
              const list = rooms.map((r, i) => ({ ...r, no: i + 1 })).filter((r) => r.size === size);
              if (!list.length) return null;
              return (
                <div key={size} className="mb-6">
                  <h3 className="mb-2 font-serif text-lg font-bold text-brand-900">
                    {size} Kişilik Odalar <span className="text-sm font-semibold text-muted">({list.length})</span>
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {list.map((r) => {
                      const inRoom = byRoom.get(r.id) ?? [];
                      const adults = inRoom.filter((p) => takesBed(p.passenger));
                      const babies = inRoom.filter((p) => !takesBed(p.passenger));
                      const free = Math.max(r.size - adults.length, 0);
                      const issues = roomIssues(r, inRoom);
                      const tone = toneOf(inRoom);
                      const target = sel.length > 0 && !sel.every((id) => inRoom.some((p) => p.saleId === id));
                      const mixedUnits = new Set(inRoom.map(unitKey)).size > 1;
                      return (
                        <div
                          key={r.id}
                          onClick={() => target && placeInto(r.id)}
                          onDragOver={allowDrop}
                          onDrop={(e) => placeInto(r.id, readDrop(e))}
                          className={cn(
                            "rounded-2xl border-2 bg-white p-3 shadow-soft transition-colors",
                            tone === "E" ? "border-sky-200" : tone === "K" ? "border-rose-200" : tone === "aile" ? "border-gold-200" : "border-dashed border-border",
                            issues.length > 0 && "border-amber-300",
                            target && "cursor-pointer hover:border-gold-500 hover:bg-gold-50/40",
                          )}
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <span className="font-serif text-base font-bold text-brand-900">Oda {r.no}</span>
                            <span className={cn("text-xs font-semibold", free ? "text-muted" : "text-green-700")}>
                              {adults.length}/{r.size}
                              {babies.length ? ` +${babies.length} bebek` : ""}
                            </span>
                            <div className="ml-auto flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={r.size}
                                disabled={pending}
                                onChange={(e) => run(() => resizeRoom(r.id, Number(e.target.value)))}
                                aria-label="Oda tipi"
                                title="Oda tipini değiştir"
                                className="h-7 rounded-lg border border-border bg-white px-1.5 text-xs"
                              >
                                {ROOM_SIZES.map((n) => (
                                  <option key={n} value={n}>
                                    {n} kişilik
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => {
                                  if (!inRoom.length || window.confirm(`Oda ${r.no} silinsin mi? İçindeki ${inRoom.length} kişi yerleşmemişler listesine döner.`))
                                    run(() => deleteRoom(r.id));
                                }}
                                className="grid size-7 place-items-center rounded-lg text-red-500 hover:bg-red-50"
                                title="Odayı sil"
                                aria-label={`Oda ${r.no} sil`}
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="mb-2 flex gap-2">
                            <RoomNoInput key={`m-${r.meccaNo ?? ""}`} label="Mekke" value={r.meccaNo} onSave={(v) => setRoomNumber(r.id, "meccaNo", v)} />
                            <RoomNoInput key={`d-${r.medinaNo ?? ""}`} label="Medine" value={r.medinaNo} onSave={(v) => setRoomNumber(r.id, "medinaNo", v)} />
                          </div>
                          <div className="grid gap-1">
                            {adults.map((p) => chip(p, { showGroup: mixedUnits }))}
                            {Array.from({ length: free }, (_, i) => (
                              <div
                                key={`bos-${i}`}
                                className={cn(
                                  "flex items-center gap-1.5 rounded-lg border border-dashed px-2 py-1.5 text-xs",
                                  target ? "border-gold-400 text-gold-700" : "border-border text-muted/70",
                                )}
                              >
                                <BedSingle className="size-3.5" /> Boş yatak
                              </div>
                            ))}
                          </div>
                          {babies.length > 0 && (
                            <div className="mt-1.5 grid gap-1">
                              <p className="flex items-center gap-1 text-[11px] font-semibold text-muted">
                                <Baby className="size-3.5" /> Yataksız (0-2 yaş)
                              </p>
                              {babies.map((p) => chip(p))}
                            </div>
                          )}
                          {issues.map((issue) => (
                            <p key={issue} className="mt-1.5 flex items-start gap-1 text-[11px] font-medium text-amber-700">
                              <AlertTriangle className="mt-px size-3 shrink-0" /> {issue}
                            </p>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>

      {/* Seçim çubuğu: seçilenleri odaya yerleştirme / yeni odaya alma / odadan çıkarma */}
      {sel.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gold-300 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur print:hidden">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
            <p className="mr-2 text-sm font-semibold text-brand-900">
              {sel.length} kişi seçildi
              <span className="font-normal text-muted">
                {" "}
                ({bedsUsed(selPeople)} yatak) · bir odaya tıklayın ya da
              </span>
            </p>
            {ROOM_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                disabled={pending || bedsUsed(selPeople) > size}
                onClick={() => run(() => createRoom(tourId, size, sel))}
                className="inline-flex h-9 items-center gap-1 rounded-xl bg-gold-400 px-3 text-sm font-bold text-brand-950 hover:bg-gold-300 disabled:opacity-40"
                title={bedsUsed(selPeople) > size ? `${bedsUsed(selPeople)} kişi ${size} kişilik odaya sığmaz` : `Seçilenlerle yeni ${size} kişilik oda aç`}
              >
                <Plus className="size-3.5" /> Yeni {size} kişilik oda
              </button>
            ))}
            {selPeople.some((p) => p.roomId != null) && (
              <button
                type="button"
                disabled={pending}
                onClick={() => unplace(selPeople.filter((p) => p.roomId != null).map((p) => p.saleId))}
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-border px-3 text-sm font-semibold text-brand-800 hover:bg-cream-100"
              >
                <Undo2 className="size-3.5" /> Odadan çıkar
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelected([])}
              className="ml-auto grid size-9 place-items-center rounded-xl text-muted hover:bg-cream-100"
              title="Seçimi bırak"
              aria-label="Seçimi bırak"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Kişi kartı: tıklayınca seçilir, sürüklenebilir. Cinsiyeti girilmemişse E / K düğmeleri çıkar */
function PersonChip({
  p,
  selected,
  showGroup,
  onToggle,
  onDragStart,
  onGender,
  disabled,
}: {
  p: RoomPerson;
  selected: boolean;
  showGroup?: boolean;
  onToggle: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onGender: (g: Gender) => void;
  disabled: boolean;
}) {
  const Icon = p.gender === "E" ? Mars : p.gender === "K" ? Venus : null;
  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      aria-pressed={selected}
      onDragStart={onDragStart}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      title={[p.name, p.gender ? GENDERS[p.gender] : "Cinsiyet girilmemiş", p.groupName, p.roomSize ? `Satış: ${p.roomSize} kişilik oda` : null]
        .filter(Boolean)
        .join(" · ")}
      className={cn(
        "flex min-w-0 cursor-pointer select-none items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs transition",
        p.gender === "E" ? "border-sky-200 bg-sky-50" : p.gender === "K" ? "border-rose-200 bg-rose-50" : "border-slate-300 bg-slate-50",
        selected && "ring-2 ring-gold-500 ring-offset-1",
      )}
    >
      {Icon ? (
        <Icon className={cn("size-3.5 shrink-0", p.gender === "E" ? "text-sky-700" : "text-rose-600")} />
      ) : (
        <span className="grid size-3.5 shrink-0 place-items-center rounded-full bg-slate-300 text-[9px] font-bold text-white">?</span>
      )}
      <span className="truncate font-semibold text-brand-900">{p.name}</span>
      {showGroup && p.groupName && <span className="truncate text-[10px] text-muted">· {p.groupName}</span>}
      {p.passenger && <span className="shrink-0 rounded bg-white/80 px-1 text-[10px] font-semibold text-muted">{p.passenger} yaş</span>}
      {!p.gender && (
        <span className="ml-auto flex shrink-0 gap-0.5">
          {(["E", "K"] as const).map((g) => (
            <button
              key={g}
              type="button"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                onGender(g);
              }}
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-bold",
                g === "E" ? "bg-sky-100 text-sky-800 hover:bg-sky-200" : "bg-rose-100 text-rose-700 hover:bg-rose-200",
              )}
              title={`${GENDERS[g]} olarak kaydet`}
            >
              {g}
            </button>
          ))}
        </span>
      )}
    </div>
  );
}
