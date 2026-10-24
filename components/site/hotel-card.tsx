import { MapPin, Star } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge } from "@/components/ui/badge";
import { parseImages, cn } from "@/lib/utils";
import { getContent } from "@/lib/content";
import { fill } from "@/lib/content/template";

export type HotelCardData = {
  name: string;
  city: string;
  region?: string | null;
  distance?: string | null;
  stars?: number | null;
  description?: string | null;
  images?: string | null;
};

export async function HotelCard({
  hotel,
  className,
}: {
  hotel: HotelCardData;
  className?: string;
}) {
  const img = parseImages(hotel.images)[0];
  const ui = await getContent("ui.general");
  return (
    <article
      className={cn(
        "group overflow-hidden rounded-3xl border border-border bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <SmartImage
          src={img}
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
          alt={hotel.name}
          className="size-full transition-transform duration-700 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-950/60 to-transparent" />
        <div className="absolute left-3 top-3">
          <Badge variant={hotel.city === "Mekke" ? "gold" : "brand"} className="backdrop-blur">
            {hotel.city}
          </Badge>
        </div>
        {hotel.stars != null && hotel.stars > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-0.5 rounded-full bg-white/90 px-2.5 py-1 shadow-sm backdrop-blur">
            {Array.from({ length: hotel.stars }).map((_, i) => (
              <Star key={i} className="size-3.5 fill-gold-400 text-gold-400" />
            ))}
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-serif text-lg font-bold text-brand-900">{hotel.name}</h3>
        {hotel.distance && (
          <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-brand-600">
            <MapPin className="size-4 text-gold-500" /> {hotel.distance}
          </p>
        )}
        {hotel.description && (
          <p className="mt-2.5 line-clamp-2 text-sm text-muted">{hotel.description}</p>
        )}
        {hotel.region && (
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted/70">
            {fill(ui.hotelRegionFormat, { bolge: hotel.region })}
          </p>
        )}
      </div>
    </article>
  );
}
