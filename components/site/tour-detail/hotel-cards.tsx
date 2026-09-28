import { BedDouble, ExternalLink, MapPin, Moon, Play, Star } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { fill } from "@/lib/content/template";
import { Stars } from "./stars";
import { VideoButton } from "./video";

export type HotelCardData = {
  id: string;
  city: string;
  name: string;
  nights: number | null;
  stars: number | null;
  distance: string | null;
  image: string | null;
  videoUrl: string | null;
  link: string | null;
};

export type HotelLabels = {
  hotelNights: string;
  nightsFormat: string;
  hotelStars: string;
  hotelDistance: string;
  hotelDetail: string;
  videoButton: string;
  mapButton: string;
};

export function mapSearchUrl(name: string, city: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${city}`)}`;
}

/** Mekke / Medine otel kartları: görsel, gece sayısı, yıldız, mesafe, video ve detay */
export function HotelCards({ hotels, labels }: { hotels: HotelCardData[]; labels: HotelLabels }) {
  if (!hotels.length) return null;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {hotels.map((h) => (
        <article key={h.id} className="flex overflow-hidden rounded-3xl border border-border bg-white shadow-soft">
          {/* Görsel */}
          <div className="relative w-[42%] shrink-0 bg-brand-800">
            {h.image ? (
              <SmartImage src={h.image} alt={h.name} className="absolute inset-0 size-full" />
            ) : (
              <span className="absolute inset-0 grid place-items-center text-white/30">
                <BedDouble className="size-10" />
              </span>
            )}
            <span className="absolute inset-0 bg-gradient-to-t from-brand-950/85 via-brand-950/10 to-transparent" />
            <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-brand-900 shadow-sm">
              <MapPin className="size-3" /> {h.city}
            </span>
            <p className="absolute inset-x-3 bottom-3 font-serif text-base font-bold leading-snug text-white">{h.name}</p>
          </div>

          {/* Bilgiler */}
          <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
            {h.nights != null && (
              <InfoRow icon={<Moon className="size-4" />} label={labels.hotelNights}>
                {fill(labels.nightsFormat, { gece: h.nights })}
              </InfoRow>
            )}
            {h.stars != null && h.stars > 0 && (
              <InfoRow icon={<Star className="size-4" />} label={labels.hotelStars}>
                <Stars value={h.stars} />
              </InfoRow>
            )}
            {h.distance && (
              <InfoRow icon={<MapPin className="size-4" />} label={labels.hotelDistance}>
                <span className="inline-block rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">{h.distance}</span>
              </InfoRow>
            )}

            <div className="mt-auto flex flex-wrap gap-2 pt-1">
              {h.videoUrl && (
                <VideoButton
                  url={h.videoUrl}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-800 px-3 py-2 text-xs font-bold text-white transition hover:bg-brand-900"
                >
                  <Play className="size-3.5 fill-current" /> {labels.videoButton}
                </VideoButton>
              )}
              <a
                href={h.link || mapSearchUrl(h.name, h.city)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold text-brand-800 transition hover:bg-cream-50"
              >
                {h.link ? <ExternalLink className="size-3.5" /> : <MapPin className="size-3.5" />}
                {h.link ? labels.hotelDetail : labels.mapButton}
              </a>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-cream-100 text-gold-600">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-muted">{label}</p>
        <div className="text-sm font-semibold text-brand-900">{children}</div>
      </div>
    </div>
  );
}
