"use client";

import { useState } from "react";
import Link from "next/link";
import { Baby, Mars, Printer, Search, Venus, X } from "lucide-react";
import { guideSetRoomNumber } from "@/app/actions/guide";
import { RoomNoInput } from "@/components/admin/sales/room-no-input";
import { groupByRoom, takesBed, type Room, type RoomPerson } from "@/lib/rooming";
import { cn } from "@/lib/utils";

/** Türkçe büyük/küçük harf ve aksan farkı gözetmeden arama */
const norm = (s: string) =>
  s
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i");

/**
 * Görevli ekranı (telefon için): isimle arama, oda kartları, otelin verdiği oda numaraları.
 * Giriş yoktur; numaralar bağlantıdaki anahtarla kaydedilir.
 */
export function GuideRooms({ token, rooms, people }: { token: string; rooms: Room[]; people: RoomPerson[] }) {
  const [q, setQ] = useState("");
  const byRoom = groupByRoom(people);
  const term = norm(q.trim());
  const numbered = rooms.map((r, i) => ({ ...r, no: i + 1, list: byRoom.get(r.id) ?? [] })).filter((r) => r.list.length);
  const matches = (p: RoomPerson) => !!term && norm(p.name).includes(term);
  const shown = term
    ? numbered.filter(
        (r) =>
          r.list.some(matches) ||
          String(r.no) === term ||
          norm(r.meccaNo ?? "") === term ||
          norm(r.medinaNo ?? "") === term ||
          `oda ${r.no}` === term,
      )
    : numbered;
  const unplaced = people.filter((p) => p.roomId == null && (!term || matches(p)));
  const missing = { mecca: numbered.filter((r) => !r.meccaNo).length, medina: numbered.filter((r) => !r.medinaNo).length };

  return (
    <div>
      {/* Arama */}
      <div className="sticky top-0 z-10 -mx-4 mb-4 bg-cream-100/95 px-4 py-3 backdrop-blur">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="İsim ya da oda no ara..."
            aria-label="İsim ya da oda numarası ara"
            className="h-12 w-full rounded-2xl border border-border bg-white pl-11 pr-11 text-base shadow-soft focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          {q && (
            <button type="button" onClick={() => setQ("")} className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-xl text-muted" aria-label="Aramayı temizle">
              <X className="size-5" />
            </button>
          )}
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span>
            <strong className="text-brand-900">{numbered.length}</strong> oda · <strong className="text-brand-900">{people.length}</strong> kişi
          </span>
          {(missing.mecca > 0 || missing.medina > 0) && (
            <span className="text-amber-700">
              Numarası yazılmamış: Mekke {missing.mecca}, Medine {missing.medina}
            </span>
          )}
          <Link href={`/oda/${token}/etiketler`} className="ml-auto inline-flex items-center gap-1 font-semibold text-brand-700">
            <Printer className="size-3.5" /> Etiketler
          </Link>
        </p>
      </div>

      {term && shown.length === 0 && unplaced.length === 0 && <p className="rounded-2xl bg-white p-5 text-center text-sm text-muted">“{q}” bulunamadı.</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {shown.map((r) => {
          const adults = r.list.filter((p) => takesBed(p.passenger));
          const babies = r.list.filter((p) => !takesBed(p.passenger));
          return (
            <div key={r.id} className={cn("rounded-2xl border-2 bg-white p-4 shadow-soft", term && r.list.some(matches) ? "border-gold-500" : "border-transparent")}>
              <div className="mb-3 flex items-baseline justify-between">
                <p className="font-serif text-2xl font-bold text-brand-900">Oda {r.no}</p>
                <p className="text-sm font-semibold text-muted">{r.size} kişilik</p>
              </div>
              <div className="mb-3 grid grid-cols-2 gap-2">
                <RoomNoInput key={`m-${r.meccaNo ?? ""}`} big label="Mekke" value={r.meccaNo} onSave={(v) => guideSetRoomNumber(token, r.id, "meccaNo", v)} />
                <RoomNoInput key={`d-${r.medinaNo ?? ""}`} big label="Medine" value={r.medinaNo} onSave={(v) => guideSetRoomNumber(token, r.id, "medinaNo", v)} />
              </div>
              <ul className="space-y-1.5">
                {adults.map((p) => (
                  <PersonLine key={p.saleId} p={p} hit={matches(p)} />
                ))}
              </ul>
              {babies.length > 0 && (
                <p className="mt-2 flex items-center gap-1 text-xs text-muted">
                  <Baby className="size-4" /> {babies.map((p) => p.name).join(", ")}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {unplaced.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-2 font-semibold text-amber-900">Odası belli olmayanlar ({unplaced.length})</p>
          <ul className="space-y-1.5">
            {unplaced.map((p) => (
              <PersonLine key={p.saleId} p={p} hit={matches(p)} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PersonLine({ p, hit }: { p: RoomPerson; hit: boolean }) {
  return (
    <li className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-base", p.gender === "E" ? "bg-sky-50" : p.gender === "K" ? "bg-rose-50" : "bg-slate-50", hit && "ring-2 ring-gold-500")}>
      {p.gender === "E" ? <Mars className="size-4 shrink-0 text-sky-700" /> : p.gender === "K" ? <Venus className="size-4 shrink-0 text-rose-600" /> : null}
      <span className="min-w-0 flex-1 truncate font-semibold text-brand-900">{p.name}</span>
      {p.passenger && <span className="shrink-0 rounded bg-white px-1.5 text-xs text-muted">{p.passenger} yaş</span>}
      {p.groupName && <span className="hidden shrink-0 text-xs text-muted sm:inline">{p.groupName}</span>}
    </li>
  );
}
