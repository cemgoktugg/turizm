import Link from "next/link";
import { ArrowRight, Baby, BedDouble, CalendarCheck, CreditCard, Flame, Headphones, MessageCircle, Phone, User, Users, UsersRound } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { fill } from "@/lib/content/template";
import { telLink, whatsappLink } from "@/lib/settings";
import { cn, formatPrice } from "@/lib/utils";
import { formatTry, type TryRates } from "@/lib/currency";
import type { ContentData } from "@/lib/content/registry";
import { BookingTrigger } from "./booking-dialog";
import { PassportCheck } from "./passport-check";
import { ShareMenu } from "./share-menu";

type SidebarLabels = ContentData<"ui.tours">["sidebar"];

/** Oda tipi metninden uygun ikonu seçer (2'li, 3'lü, tek kişilik, çocuk…) */
function roomIcon(label: string) {
  const l = label.toLocaleLowerCase("tr");
  if (/bebek|çocuk|cocuk|yaş|yas|infant|child/.test(l)) return Baby;
  if (/tek|single|1\s*kişi/.test(l)) return User;
  if (/(^|\D)2(\D|$)|iki|çift|double/.test(l)) return Users;
  if (/(^|\D)[34](\D|$)|üç|dört|triple|quad/.test(l)) return UsersRound;
  return BedDouble;
}

export function TourSidebar({
  tour,
  past,
  labels,
  noPrice,
  rates,
  tlFormat,
  priceDisclaimer,
  defaultPriceNote,
  pastText,
  phone,
  whatsapp,
  whatsappText,
}: {
  tour: {
    title: string;
    startingPrice: number | null;
    currency: string;
    priceNote: string | null;
    seatsLeft: number | null;
    departureDate: string | null;
    prices: { id: string; roomType: string; price: number; currency: string }[];
  };
  past: boolean;
  labels: SidebarLabels;
  noPrice: string;
  rates: TryRates | null;
  tlFormat: string;
  priceDisclaimer: string;
  defaultPriceNote: string;
  pastText: string;
  phone: string;
  whatsapp: string;
  whatsappText: string;
}) {
  const months = Number.parseInt(labels.passportMonths, 10);
  const priceTry = formatTry(tour.startingPrice, tour.currency, rates, tlFormat);

  return (
    <div className="space-y-4">
      {/* Fiyat ve başvuru */}
      <div className="rounded-3xl border border-border bg-white p-5 shadow-card sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-lg font-bold text-brand-900">{labels.title}</h2>
          <ShareMenu title={tour.title} labels={labels} />
        </div>

        <p className="mt-3 flex flex-wrap items-baseline gap-x-2">
          <span className="font-serif text-4xl font-bold text-brand-800">
            {formatPrice(tour.startingPrice, tour.currency, noPrice)}
          </span>
          {tour.startingPrice != null && <span className="text-sm text-muted">/ {tour.priceNote || defaultPriceNote}</span>}
        </p>
        {priceTry && (
          <p className="mt-1 text-sm font-semibold text-brand-700">
            {priceTry}
            {labels.tlNote && <span className="mt-0.5 block text-[11px] font-normal leading-snug text-muted">{labels.tlNote}</span>}
          </p>
        )}
        {labels.installmentText && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            <CreditCard className="size-3.5" /> {labels.installmentText}
          </p>
        )}
        {!past && tour.seatsLeft != null && tour.seatsLeft > 0 && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
            <Flame className="size-3.5" /> {fill(labels.seatsLeftFormat, { sayi: tour.seatsLeft })}
          </p>
        )}

        <div className="mt-5 space-y-2.5">
          {past ? (
            <div className="rounded-2xl bg-cream-50 p-4">
              <p className="font-semibold text-brand-900">{labels.closedTitle}</p>
              <p className="mt-1 text-sm text-muted">{pastText}</p>
              <Link href="/turlar" className={cn(buttonVariants({ variant: "primary" }), "mt-3 w-full")}>
                {labels.closedButton}
              </Link>
            </div>
          ) : (
            <BookingTrigger className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full")}>
              <CalendarCheck className="size-5" /> {labels.bookButton}
            </BookingTrigger>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            <a href={telLink(phone)} className={cn(buttonVariants({ variant: "subtle", size: "sm" }), "w-full px-2 text-[13px]")}>
              <Headphones className="size-4" /> {labels.callButton}
            </a>
            <a
              href={whatsappLink(whatsapp, whatsappText)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-[#25D366] px-2 text-[13px] font-semibold text-[#1eb955] transition hover:bg-[#25D366] hover:text-white"
            >
              <MessageCircle className="size-4" /> {labels.whatsappButton}
            </a>
          </div>
        </div>

        {tour.prices.length > 0 && (
          <div className="mt-6 border-t border-border pt-5">
            <p className="text-center text-sm font-semibold text-muted">{labels.roomPricesTitle}</p>
            <ul className="mt-3 divide-y divide-border">
              {tour.prices.map((p) => {
                const Icon = roomIcon(p.roomType);
                return (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="flex min-w-0 items-center gap-2.5 text-sm font-medium text-brand-800">
                      <Icon className="size-4 shrink-0 text-gold-600" />
                      <span className="truncate">{p.roomType}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-bold text-brand-900">{formatPrice(p.price, p.currency, noPrice)}</span>
                      {formatTry(p.price, p.currency, rates, tlFormat) && (
                        <span className="block text-[11px] font-medium text-muted">{formatTry(p.price, p.currency, rates, tlFormat)}</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
            {priceDisclaimer && <p className="mt-2 text-[11px] leading-relaxed text-muted">{priceDisclaimer}</p>}
          </div>
        )}
      </div>

      {/* Grup talebi */}
      {!past && (
        <BookingTrigger
          message={fill(labels.groupMessage, { tur: tour.title })}
          className="group flex w-full items-center gap-3 rounded-3xl border border-border bg-white p-5 text-left shadow-soft transition hover:border-brand-300"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold-50 text-gold-600">
            <Users className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-brand-900">{labels.groupTitle}</span>
            <span className="block text-xs text-muted">{labels.groupText}</span>
            <span className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-brand-700 group-hover:text-gold-600">
              {labels.groupButton} <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </span>
          </span>
        </BookingTrigger>
      )}

      {/* Yardım */}
      <a
        href={telLink(phone)}
        className="flex items-center gap-3 rounded-3xl border border-border bg-brand-800 p-5 text-white shadow-soft transition hover:bg-brand-900"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10">
          <Phone className="size-5" />
        </span>
        <span>
          <span className="block text-sm text-cream-100/80">{labels.helpTitle}</span>
          <span className="block font-serif text-xl font-bold">{phone}</span>
        </span>
      </a>

      {/* Pasaport kontrolü */}
      {!past && tour.departureDate && (
        <PassportCheck departureDate={tour.departureDate} months={Number.isFinite(months) && months > 0 ? months : 6} labels={labels} />
      )}
    </div>
  );
}
