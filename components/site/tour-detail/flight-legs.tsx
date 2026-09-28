import { Bus, CalendarDays, Clock, Plane } from "lucide-react";
import { cn } from "@/lib/utils";
import { AirlineMark } from "./airline-mark";

export type LegData = {
  id: string;
  type: string;
  title: string;
  carrier: string | null;
  flightNo: string | null;
  fromCode: string | null;
  fromCity: string | null;
  toCode: string | null;
  toCity: string | null;
  date: string | null;
  time: string | null;
};

export type LegLabels = {
  flightsTitle: string;
  legDate: string;
  legTime: string;
  legTimeTbd: string;
  legFlightNo: string;
};

/** Uçuş ve transfer kartları (Gidiş → Otobüs transferi → Dönüş) */
export function FlightLegs({ legs, labels }: { legs: LegData[]; labels: LegLabels }) {
  if (!legs.length) return null;
  return (
    <section className="rounded-3xl border border-border bg-white p-5 shadow-soft sm:p-6">
      <h2 className="flex items-center gap-3 font-serif text-xl font-bold text-brand-900">
        <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <Plane className="size-5" />
        </span>
        {labels.flightsTitle}
      </h2>
      <div className={cn("mt-5 grid gap-4 sm:grid-cols-2", legs.length >= 3 && "xl:grid-cols-3")}>
        {legs.map((leg) => (
          <LegCard key={leg.id} leg={leg} labels={labels} />
        ))}
      </div>
    </section>
  );
}

function LegCard({ leg, labels }: { leg: LegData; labels: LegLabels }) {
  const bus = leg.type === "bus";
  const Icon = bus ? Bus : Plane;
  return (
    <div className={cn("flex flex-col rounded-2xl border border-border border-t-4 p-4", bus ? "border-t-brand-500" : "border-t-brand-900")}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn("grid size-8 shrink-0 place-items-center rounded-full text-white", bus ? "bg-brand-500" : "bg-brand-900")}>
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold leading-tight text-brand-900">{leg.title}</p>
            {bus && leg.carrier && <p className="truncate text-[11px] text-muted">{leg.carrier}</p>}
          </div>
        </div>
        {!bus && leg.carrier && <AirlineMark name={leg.carrier} />}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Endpoint code={leg.fromCode} city={leg.fromCity} />
        <span className="relative flex flex-1 items-center">
          <span className="h-0.5 w-full rounded bg-border" />
          <span className="absolute left-1/2 grid size-7 -translate-x-1/2 place-items-center rounded-full border border-border bg-white text-brand-700">
            <Icon className="size-3.5" />
          </span>
        </span>
        <Endpoint code={leg.toCode} city={leg.toCity} align="right" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-cream-50 p-3 text-xs">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0 text-gold-600" />
          <div>
            <p className="text-muted">{labels.legDate}</p>
            <p className="font-bold text-brand-900">{leg.date ?? "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="size-4 shrink-0 text-gold-600" />
          <div>
            <p className="text-muted">{labels.legTime}</p>
            <p className={cn("font-bold", leg.time ? "text-brand-900" : "italic text-muted")}>{leg.time || labels.legTimeTbd}</p>
          </div>
        </div>
      </div>
      {leg.flightNo && (
        <p className="mt-2 text-[11px] text-muted">
          {labels.legFlightNo}: <span className="font-bold text-brand-800">{leg.flightNo}</span>
        </p>
      )}
    </div>
  );
}

function Endpoint({ code, city, align }: { code: string | null; city: string | null; align?: "right" }) {
  return (
    <div className={cn("min-w-0", align === "right" && "text-right")}>
      <p className="font-serif text-xl font-bold leading-none text-brand-900">{code || "—"}</p>
      {city && <p className="mt-1 truncate text-[11px] text-muted">{city}</p>}
    </div>
  );
}
