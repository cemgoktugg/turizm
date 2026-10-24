import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bus, CheckCircle2, FileText, Plane, Star, XCircle } from "lucide-react";
import { getTourBySlug } from "@/lib/queries";
import { getContent } from "@/lib/content";
import { fill } from "@/lib/content/template";
import { getSettings, whatsappLink } from "@/lib/settings";
import { getTryRates } from "@/lib/exchange";
import { formatTry } from "@/lib/currency";
import { SITE_URL } from "@/lib/site-url";
import { formatDate, formatPrice, splitLines } from "@/lib/utils";
import { formatDuration } from "@/components/site/tour-card";
import { SmartImage } from "@/components/ui/smart-image";
import { PrintToolbar } from "@/components/site/print-toolbar";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ yazdir?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  return {
    title: tour ? `${tour.title} — Tur Programı` : "Tur programı",
    // Tur sayfasının yazdırılabilir kopyası: arama motorlarında ayrı sayfa olarak görünmesin
    robots: { index: false, follow: true },
    alternates: tour ? { canonical: `/turlar/${tour.slug}` } : undefined,
  };
}

/** Tur programının A4 yazdırılabilir / PDF olarak kaydedilebilir hali */
export default async function TourProgramPrintPage({ params, searchParams }: Props) {
  const [{ slug }, { yazdir }] = await Promise.all([params, searchParams]);
  const tour = await getTourBySlug(slug);
  if (!tour) notFound();

  const [settings, ui, booking, wa, rates] = await Promise.all([
    getSettings(),
    getContent("ui.tours"),
    getContent("shared.booking"),
    getContent("ui.whatsapp"),
    getTryRates(),
  ]);
  const { detail: d, sidebar: sb, sections: s, print: p, card } = ui;
  const tourUrl = `${SITE_URL}/turlar/${tour.slug}`;
  const priceTry = formatTry(tour.startingPrice, tour.currency, rates, card.tlFormat);
  const included = splitLines(tour.includedServices);
  const excluded = splitLines(tour.excludedServices);
  const documents = splitLines(tour.requiredDocuments);
  const dateRange = tour.departureDate
    ? [formatDate(tour.departureDate), tour.returnDate ? formatDate(tour.returnDate) : null].filter(Boolean).join(" – ")
    : null;

  const facts = [
    { label: d.factCode, value: tour.code },
    { label: d.factDate, value: dateRange },
    { label: d.factDuration, value: formatDuration(tour.durationDays, tour.durationNights, card) },
    { label: p.departureLabel, value: tour.departureCity },
    { label: d.factAirline, value: tour.airline },
  ].filter((f) => f.value);

  return (
    <div className="min-h-screen bg-cream-100 print:bg-white">
      <PrintToolbar
        backHref={`/turlar/${tour.slug}`}
        shareHref={whatsappLink("", `${fill(wa.tour, { tur: tour.title })} ${tourUrl}`)}
        labels={p}
        autoPrint={yazdir === "1"}
      />

      <main className="print-sheet mx-auto my-6 max-w-[210mm] bg-white px-[14mm] py-[12mm] text-[12.5px] leading-relaxed text-brand-900 shadow-card print:m-0 print:max-w-none print:p-0 print:shadow-none">
        {/* Başlık: marka ve iletişim */}
        <header className="flex items-start justify-between gap-6 border-b-2 border-brand-700 pb-4">
          <div>
            <SmartImage src={settings.logo} alt={settings.siteName} loading="eager" className="h-12 w-auto object-contain" />
            {settings.tagline && <p className="mt-1 font-serif text-sm italic text-gold-600">{settings.tagline}</p>}
          </div>
          <div className="text-right text-[11px] leading-snug text-brand-800">
            <p className="font-bold">{settings.phone}</p>
            {settings.email && <p>{settings.email}</p>}
            <p>{SITE_URL.replace(/^https?:\/\//, "")}</p>
            {settings.tursabNo && <p className="text-muted">TÜRSAB Belge No: {settings.tursabNo}</p>}
          </div>
        </header>

        {/* Tur özeti */}
        <section className="mt-5 grid grid-cols-[1fr_62mm] gap-5">
          <div>
            {tour.badge && <p className="text-[11px] font-bold uppercase tracking-wider text-gold-600">{tour.badge}</p>}
            <h1 className="font-serif text-[22px] font-bold leading-tight text-brand-900">{tour.title}</h1>
            {tour.shortDescription && <p className="mt-1.5 text-brand-800">{tour.shortDescription}</p>}
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
              {facts.map((f) => (
                <div key={f.label} className="flex gap-1.5">
                  <dt className="shrink-0 whitespace-nowrap text-muted">{f.label}:</dt>
                  <dd className="font-semibold">{f.value}</dd>
                </div>
              ))}
            </dl>
            {tour.startingPrice != null && (
              <p className="mt-3 inline-flex flex-wrap items-baseline gap-x-2 rounded-xl bg-brand-50 px-3 py-2 print-exact">
                <span className="text-muted">{p.priceLabel}:</span>
                <span className="font-serif text-xl font-bold text-brand-800">{formatPrice(tour.startingPrice, tour.currency)}</span>
                <span className="text-muted">/ {tour.priceNote || booking.defaultPriceNote}</span>
                {priceTry && <span className="font-semibold text-brand-700">{priceTry}</span>}
              </p>
            )}
          </div>
          <SmartImage
            src={tour.coverImage}
            alt={tour.title}
            loading="eager"
            sizes="250px"
            className="aspect-[4/3] w-full rounded-xl"
          />
        </section>

        {/* Oda fiyatları */}
        {tour.prices.length > 0 && (
          <Block title={sb.roomPricesTitle}>
            <table className="w-full">
              <tbody className="divide-y divide-border">
                {tour.prices.map((pr) => (
                  <tr key={pr.id}>
                    <td className="py-1.5">{pr.roomType}</td>
                    <td className="py-1.5 text-right font-bold">{formatPrice(pr.price, pr.currency)}</td>
                    <td className="w-32 py-1.5 text-right text-[11px] text-muted">{formatTry(pr.price, pr.currency, rates, card.tlFormat)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Block>
        )}

        {/* Uçuş ve transfer */}
        {tour.legs.length > 0 && (
          <Block title={d.flightsTitle}>
            <table className="w-full">
              <tbody className="divide-y divide-border">
                {tour.legs.map((leg) => {
                  const Icon = leg.type === "bus" ? Bus : Plane;
                  const from = [leg.fromCity, leg.fromCode && `(${leg.fromCode})`].filter(Boolean).join(" ");
                  const to = [leg.toCity, leg.toCode && `(${leg.toCode})`].filter(Boolean).join(" ");
                  return (
                    <tr key={leg.id}>
                      <td className="py-1.5 pr-2 align-top">
                        <Icon className="size-4 text-gold-600" />
                      </td>
                      <td className="py-1.5 align-top">
                        <p className="font-semibold">{leg.title}</p>
                        <p className="text-[11px] text-muted">{[from, to].filter(Boolean).join(" → ")}</p>
                      </td>
                      <td className="py-1.5 align-top text-[11px]">{[leg.carrier, leg.flightNo].filter(Boolean).join(" · ")}</td>
                      <td className="py-1.5 text-right align-top text-[11px]">
                        {leg.date ? formatDate(leg.date) : ""}
                        <span className="block font-semibold">{leg.time || d.legTimeTbd}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Block>
        )}

        {/* Oteller */}
        {tour.hotels.length > 0 && (
          <Block title={p.hotelsTitle}>
            <ul className="grid grid-cols-2 gap-3">
              {tour.hotels.map((h) => (
                <li key={h.id} className="rounded-xl border border-border p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gold-600">{h.city}</p>
                  <p className="font-semibold">{h.name}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[11px] text-muted">
                    {h.stars ? (
                      <span className="inline-flex items-center gap-0.5">
                        {Array.from({ length: h.stars }, (_, i) => (
                          <Star key={i} className="size-3 fill-gold-400 text-gold-400" />
                        ))}
                      </span>
                    ) : null}
                    {h.nights ? <span>{fill(d.nightsFormat, { gece: h.nights })}</span> : null}
                    {h.distance && <span>{h.distance}</span>}
                  </p>
                </li>
              ))}
            </ul>
          </Block>
        )}

        {/* Günlük program */}
        {tour.dayPrograms.length > 0 && (
          <Block title={s.programTitle}>
            <ol className="space-y-2.5">
              {tour.dayPrograms.map((day) => (
                <li key={day.id} className="avoid-break grid grid-cols-[22mm_1fr] gap-3">
                  <span className="h-fit rounded-lg bg-brand-700 px-2 py-1 text-center text-[11px] font-bold text-white print-exact">
                    {fill(s.dayFormat, { gun: day.dayNumber })}
                  </span>
                  <div>
                    <p className="font-semibold">{day.title}</p>
                    <p className="whitespace-pre-line text-brand-800">{day.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Block>
        )}

        {/* Hizmetler ve evraklar */}
        {included.length + excluded.length + documents.length > 0 && (
          <Block title={s.servicesTitle}>
            <div className="grid grid-cols-2 gap-5">
              {included.length > 0 && <ListBox title={s.includedTitle} items={included} icon="ok" />}
              {excluded.length > 0 && <ListBox title={s.excludedTitle} items={excluded} icon="no" />}
              {documents.length > 0 && <ListBox title={s.docsTitle} items={documents} icon="doc" />}
            </div>
          </Block>
        )}

        <footer className="mt-6 border-t border-border pt-3 text-[10.5px] leading-snug text-muted">
          {p.footerNote && <p>{p.footerNote}</p>}
          {booking.priceDisclaimer && <p className="mt-1">{booking.priceDisclaimer}</p>}
          <p className="mt-2 flex flex-wrap justify-between gap-2 text-brand-800">
            <span>{[settings.companyTitle || settings.siteName, settings.address].filter(Boolean).join(" · ")}</span>
            <span>
              {tourUrl.replace(/^https?:\/\//, "")} · {formatDate(new Date())}
            </span>
          </p>
        </footer>
      </main>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="avoid-break-after mb-2 border-b border-border pb-1 font-serif text-[15px] font-bold text-brand-800">{title}</h2>
      {children}
    </section>
  );
}

function ListBox({ title, items, icon }: { title: string; items: string[]; icon: "ok" | "no" | "doc" }) {
  const Icon = icon === "ok" ? CheckCircle2 : icon === "no" ? XCircle : FileText;
  const color = icon === "ok" ? "text-emerald-600" : icon === "no" ? "text-red-500" : "text-brand-600";
  return (
    <div className="avoid-break">
      <p className="mb-1 font-semibold">{title}</p>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex gap-1.5">
            <Icon className={`mt-0.5 size-3.5 shrink-0 ${color}`} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
