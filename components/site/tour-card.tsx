import Link from "next/link";
import { CalendarDays, Clock, MapPin, Plane, ArrowRight } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice, formatDateRange, cn } from "@/lib/utils";
import { getContent } from "@/lib/content";
import { fill } from "@/lib/content/template";

export type TourCardData = {
  slug: string;
  title: string;
  coverImage?: string | null;
  shortDescription?: string | null;
  startingPrice?: number | null;
  currency?: string | null;
  departureDate?: Date | string | null;
  durationDays?: number | null;
  durationNights?: number | null;
  departureCity?: string | null;
  airline?: string | null;
  makkahHotel?: string | null;
  isFeatured?: boolean;
  category?: { name: string; slug: string } | null;
};

/** Süre metni: panelde tanımlı biçime göre ("{gun} Gün / {gece} Gece") */
export function formatDuration(
  days: number | null | undefined,
  nights: number | null | undefined,
  labels: { durationFormat: string; daysOnlyFormat: string },
): string | null {
  if (days && nights) return fill(labels.durationFormat, { gun: days, gece: nights });
  if (days) return fill(labels.daysOnlyFormat, { gun: days });
  return null;
}

export async function TourCard({
  tour,
  className,
}: {
  tour: TourCardData;
  className?: string;
}) {
  const { card } = await getContent("ui.tours");
  const dateRange = formatDateRange(tour.departureDate, undefined);
  const duration = formatDuration(tour.durationDays, tour.durationNights, card);

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Link href={`/turlar/${tour.slug}`}>
          <SmartImage
            src={tour.coverImage}
            alt={tour.title}
            className="size-full transition-transform duration-700 group-hover:scale-105"
          />
        </Link>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-950/50 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          {tour.category && (
            <Badge variant="gold" className="shadow-sm backdrop-blur">
              {tour.category.name}
            </Badge>
          )}
          {tour.isFeatured && (
            <Badge variant="brand" className="bg-brand-900/85 text-cream-100 backdrop-blur">
              {card.featuredBadge}
            </Badge>
          )}
        </div>
        {tour.startingPrice != null && (
          <div className="absolute bottom-3 right-3 rounded-xl bg-white/95 px-3 py-1.5 text-right shadow-soft backdrop-blur">
            <span className="block text-[10px] font-medium uppercase tracking-wide text-muted">
              {card.priceFrom}
            </span>
            <span className="block font-serif text-lg font-bold leading-none text-brand-800">
              {formatPrice(tour.startingPrice, tour.currency ?? "USD", card.noPrice)}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-lg font-bold leading-snug text-brand-900">
          <Link href={`/turlar/${tour.slug}`} className="transition-colors hover:text-brand-600">
            {tour.title}
          </Link>
        </h3>
        {tour.shortDescription && (
          <p className="mt-2 line-clamp-2 text-sm text-muted">
            {tour.shortDescription}
          </p>
        )}

        <ul className="mt-4 grid grid-cols-2 gap-y-2.5 text-xs text-brand-800">
          {dateRange && (
            <li className="flex items-center gap-1.5">
              <CalendarDays className="size-4 shrink-0 text-gold-500" /> {dateRange}
            </li>
          )}
          {duration && (
            <li className="flex items-center gap-1.5">
              <Clock className="size-4 shrink-0 text-gold-500" /> {duration}
            </li>
          )}
          {tour.departureCity && (
            <li className="flex items-center gap-1.5">
              <MapPin className="size-4 shrink-0 text-gold-500" /> {tour.departureCity}
            </li>
          )}
          {tour.airline && (
            <li className="flex items-center gap-1.5">
              <Plane className="size-4 shrink-0 text-gold-500" />
              <span className="truncate">{tour.airline}</span>
            </li>
          )}
        </ul>

        <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
          <Link
            href={`/turlar/${tour.slug}`}
            className={cn(buttonVariants({ variant: "primary", size: "sm" }), "flex-1")}
          >
            {card.detailsButton} <ArrowRight className="size-4" />
          </Link>
          <Link
            href={`/rezervasyon?tur=${tour.slug}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {card.bookButton}
          </Link>
        </div>
      </div>
    </article>
  );
}
