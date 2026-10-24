"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { fill } from "@/lib/content/template";
import { cn } from "@/lib/utils";
import { AirlineMark } from "./airline-mark";

export type DateRow = {
  id: string;
  slug: string;
  code: string | null;
  badge: string | null;
  days: number | null;
  departure: string | null;
  departureRoute: string | null;
  return: string | null;
  returnRoute: string | null;
  airline: string | null;
  price: string;
  priceTry: string | null;
  seatsLeft: number | null;
};

export type DateLabels = {
  datesDaysUnit: string;
  datesCountFormat: string;
  colCode: string;
  colDeparture: string;
  colReturn: string;
  colAirline: string;
  colPrice: string;
  viewButton: string;
  currentBadge: string;
  showMore: string;
  seatsLeftFormat: string;
};

const PAGE = 8;

/** Aynı kategorideki tüm tarihler: süreye göre sekmeler + tablo */
export function TourDates({ rows, currentId, labels }: { rows: DateRow[]; currentId: string; labels: DateLabels }) {
  const groups = new Map<number, DateRow[]>();
  for (const r of rows) {
    const key = r.days ?? 0;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  const keys = [...groups.keys()].sort((a, b) => a - b);
  const currentDays = rows.find((r) => r.id === currentId)?.days ?? keys[0];

  const [tab, setTab] = useState(currentDays ?? 0);
  const [expanded, setExpanded] = useState(false);
  const list = groups.get(tab) ?? [];
  const visible = expanded ? list : list.slice(0, PAGE);

  return (
    <div>
      {keys.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {keys.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setTab(k);
                setExpanded(false);
              }}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2 text-left transition",
                tab === k ? "border-brand-800 bg-brand-800 text-white" : "border-border bg-white text-brand-900 hover:border-brand-300",
              )}
            >
              <span className="font-serif text-2xl font-bold leading-none">{k || "—"}</span>
              <span className="flex flex-col leading-tight">
                <span className="text-[11px] font-bold uppercase">{labels.datesDaysUnit}</span>
                <span className={cn("text-[11px]", tab === k ? "text-white/75" : "text-muted")}>
                  {fill(labels.datesCountFormat, { sayi: groups.get(k)?.length ?? 0 })}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border">
        {/* Masaüstü tablo */}
        <table className="hidden w-full text-sm md:table">
          <thead>
            <tr className="bg-cream-50 text-left text-[11px] font-bold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">{labels.colCode}</th>
              <th className="px-4 py-3">{labels.colDeparture}</th>
              <th className="px-4 py-3">{labels.colReturn}</th>
              <th className="px-4 py-3">{labels.colAirline}</th>
              <th className="px-4 py-3 text-right">{labels.colPrice}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((r) => {
              const current = r.id === currentId;
              return (
                <tr key={r.id} className={cn(current ? "bg-gold-50" : "bg-white even:bg-cream-50/40")}>
                  <td className="px-4 py-3 align-top">
                    <p className="font-bold text-brand-900">{r.code ?? "—"}</p>
                    {current ? (
                      <span className="mt-1 inline-block rounded-full bg-gold-400 px-2 py-0.5 text-[10px] font-bold text-brand-950">{labels.currentBadge}</span>
                    ) : (
                      r.badge && <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">{r.badge}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="font-semibold text-brand-900">{r.departure ?? "—"}</p>
                    {r.departureRoute && <p className="text-xs text-muted">{r.departureRoute}</p>}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="font-semibold text-brand-900">{r.return ?? "—"}</p>
                    {r.returnRoute && <p className="text-xs text-muted">{r.returnRoute}</p>}
                  </td>
                  <td className="px-4 py-3 align-top">{r.airline && <AirlineMark name={r.airline} withName />}</td>
                  <td className="px-4 py-3 text-right align-top">
                    <p className="font-serif text-lg font-bold text-brand-800">{r.price}</p>
                    {r.priceTry && <p className="text-[11px] font-semibold text-muted">{r.priceTry}</p>}
                    {r.seatsLeft != null && r.seatsLeft > 0 && (
                      <p className="text-xs font-semibold text-red-600">{fill(labels.seatsLeftFormat, { sayi: r.seatsLeft })}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    {!current && (
                      <Link
                        href={`/turlar/${r.slug}`}
                        className="inline-flex rounded-xl border border-border bg-white px-4 py-2 text-xs font-bold text-brand-800 transition hover:border-brand-700 hover:bg-brand-50"
                      >
                        {labels.viewButton}
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Mobil kartlar */}
        <ul className="divide-y divide-border md:hidden">
          {visible.map((r) => {
            const current = r.id === currentId;
            const Inner = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted">
                      {labels.colCode} <span className="font-bold text-brand-900">{r.code ?? "—"}</span>
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {r.departure ?? "—"} → {r.return ?? "—"}
                    </p>
                    {r.departureRoute && <p className="text-xs text-muted">{r.departureRoute}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-lg font-bold text-brand-800">{r.price}</p>
                    {r.priceTry && <p className="text-[11px] font-semibold text-muted">{r.priceTry}</p>}
                    {r.seatsLeft != null && r.seatsLeft > 0 && (
                      <p className="text-[11px] font-semibold text-red-600">{fill(labels.seatsLeftFormat, { sayi: r.seatsLeft })}</p>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  {r.airline ? <AirlineMark name={r.airline} withName /> : <span />}
                  {current ? (
                    <span className="rounded-full bg-gold-400 px-2 py-0.5 text-[10px] font-bold text-brand-950">{labels.currentBadge}</span>
                  ) : (
                    <span className="text-xs font-bold text-brand-700">{labels.viewButton} →</span>
                  )}
                </div>
              </>
            );
            return (
              <li key={r.id} className={cn(current && "bg-gold-50")}>
                {current ? (
                  <div className="p-4">{Inner}</div>
                ) : (
                  <Link href={`/turlar/${r.slug}`} className="block p-4 transition hover:bg-cream-50">
                    {Inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {list.length > PAGE && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-border bg-white py-3 text-sm font-bold text-brand-800 transition hover:bg-cream-50"
        >
          {labels.showMore} <span className="font-normal text-muted">({list.length - PAGE})</span>
          <ChevronDown className="size-4" />
        </button>
      )}
    </div>
  );
}
