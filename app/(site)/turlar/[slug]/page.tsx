import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  CalendarX2,
  Check,
  ChevronRight,
  CircleHelp,
  Clock,
  FileText,
  Hash,
  House,
  ListChecks,
  MapPin,
  Megaphone,
  Plane,
  Star,
  X,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { activeTourWhere, getTourBySlug, getTourDates, isPastTour } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { getContent } from "@/lib/content";
import { fill } from "@/lib/content/template";
import { TourCard, formatDuration } from "@/components/site/tour-card";
import { FAQAccordion } from "@/components/site/faq-accordion";
import { Prose } from "@/components/site/prose";
import { TourBookingProvider } from "@/components/site/tour-detail/booking-dialog";
import { TourGallery } from "@/components/site/tour-detail/gallery";
import { HotelCards } from "@/components/site/tour-detail/hotel-cards";
import { FlightLegs } from "@/components/site/tour-detail/flight-legs";
import { TourSidebar } from "@/components/site/tour-detail/tour-sidebar";
import { SectionNav, type SectionKey } from "@/components/site/tour-detail/section-nav";
import { TourDates, type DateRow } from "@/components/site/tour-detail/tour-dates";
import { DayProgram } from "@/components/site/tour-detail/day-program";
import { ReadMore } from "@/components/site/tour-detail/read-more";
import { ReviewForm } from "@/components/site/tour-detail/review-form";
import { Stars } from "@/components/site/tour-detail/stars";
import { cn, formatDate, formatPrice, formatTourDay, splitLines } from "@/lib/utils";
import { getTryRates } from "@/lib/exchange";
import { formatTry } from "@/lib/currency";
import { TourJsonLd, FaqJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) return { title: "Tur bulunamadı" };
  const past = isPastTour(tour.departureDate);
  return {
    title: tour.seoTitle || tour.title,
    description: tour.seoDescription || tour.shortDescription || undefined,
    alternates: { canonical: `/turlar/${tour.slug}` },
    // Tarihi geçmiş turlar arama motorlarında öne çıkmasın
    robots: past ? { index: false, follow: true } : undefined,
    openGraph: {
      title: tour.title,
      description: tour.shortDescription || undefined,
      images: tour.coverImage ? [tour.coverImage] : undefined,
    },
  };
}

/** "İstanbul – Medine · 13:20" */
function routeText(leg?: { fromCity: string | null; toCity: string | null; time: string | null }) {
  if (!leg) return null;
  const route = [leg.fromCity, leg.toCity].filter(Boolean).join(" – ");
  return [route, leg.time].filter(Boolean).join(" · ") || null;
}

export default async function TourDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) notFound();

  const past = isPastTour(tour.departureDate);
  const [settings, booking, ui, turlarPage, general, wa, dates, nearest, rates] = await Promise.all([
    getSettings(),
    getContent("shared.booking"),
    getContent("ui.tours"),
    getContent("page.turlar"),
    getContent("ui.general"),
    getContent("ui.whatsapp"),
    getTourDates(tour.categoryId),
    prisma.tour.findMany({
      where: activeTourWhere({ id: { not: tour.id }, departureDate: { not: null } }),
      include: { category: true },
      orderBy: { departureDate: "asc" },
      take: 3,
    }),
    getTryRates(),
  ]);

  const { detail: d, sidebar: sb, sections: s, reviews: rv } = ui;
  const noPrice = ui.card.noPrice;

  const galleryImages = [tour.coverImage, ...tour.images.map((i) => i.url)].filter(
    (v, i, arr): v is string => Boolean(v) && arr.indexOf(v) === i,
  );

  const included = splitLines(tour.includedServices);
  const excluded = splitLines(tour.excludedServices);
  const documents = splitLines(tour.requiredDocuments);

  const facts = [
    { icon: Hash, label: d.factCode, value: tour.code },
    { icon: CalendarDays, label: d.factDate, value: tour.departureDate ? formatDate(tour.departureDate) : null },
    { icon: Clock, label: d.factDuration, value: formatDuration(tour.durationDays, tour.durationNights, ui.card) },
    { icon: Plane, label: d.factAirline, value: tour.airline },
    { icon: MapPin, label: d.factDistance, value: tour.hotels.find((h) => h.distance)?.distance },
  ].filter((f) => f.value);

  // Tarihler ve fiyatlar tablosu (aynı kategorideki kayıt alınabilen programlar)
  const dateRows: DateRow[] = dates.map((t) => ({
    id: t.id,
    slug: t.slug,
    code: t.code,
    badge: t.badge,
    days: t.durationDays,
    departure: t.departureDate ? formatDate(t.departureDate) : null,
    departureRoute: routeText(t.legs[0]) ?? null,
    return: t.returnDate ? formatDate(t.returnDate) : null,
    returnRoute: t.legs.length > 1 ? routeText(t.legs[t.legs.length - 1]) : null,
    airline: t.airline,
    price: formatPrice(t.startingPrice, t.currency, noPrice),
    priceTry: formatTry(t.startingPrice, t.currency, rates, ui.card.tlFormat),
    seatsLeft: t.seatsLeft,
  }));
  const showDates = dateRows.some((r) => r.id !== tour.id);

  const reviewCount = tour.reviews.length;
  const reviewAvg = reviewCount ? tour.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;

  const nav: { id: string; key: SectionKey; label: string; show: boolean }[] = [
    { id: "genel-bakis", key: "overview", label: s.navOverview, show: Boolean(tour.description) },
    { id: "tarihler", key: "dates", label: s.navDates, show: showDates },
    { id: "hizmetler", key: "services", label: s.navServices, show: included.length + excluded.length + documents.length > 0 },
    { id: "program", key: "program", label: s.navProgram, show: tour.dayPrograms.length > 0 },
    { id: "sss", key: "faq", label: s.navFaq, show: tour.faqs.length > 0 },
    { id: "degerlendirmeler", key: "reviews", label: s.navReviews, show: true },
  ];
  const navItems = nav.filter((n) => n.show).map(({ id, key, label }) => ({ id, key, label }));

  const waText = fill(wa.tour, { tur: tour.title });

  return (
    <TourBookingProvider
      tourId={tour.id}
      tourTitle={tour.title}
      title={sb.bookDialogTitle}
      subtitle={booking.sidebarText}
      texts={booking}
    >
      {!past && (
        <TourJsonLd
          title={tour.title}
          description={tour.shortDescription}
          image={tour.coverImage}
          price={tour.startingPrice}
          currency={tour.currency}
          slug={tour.slug}
        />
      )}
      <FaqJsonLd faqs={tour.faqs} />
      <BreadcrumbJsonLd
        items={[
          { name: general.breadcrumbHome, url: "/" },
          { name: turlarPage.crumb, url: "/turlar" },
          { name: tour.title, url: `/turlar/${tour.slug}` },
        ]}
      />

      {/* Sayfa yolu */}
      <nav aria-label="Sayfa yolu" className="border-b border-border bg-white">
        <ol className="container-tr flex items-center gap-1.5 overflow-x-auto whitespace-nowrap py-3 text-xs text-muted [scrollbar-width:none]">
          <li>
            <Link href="/" className="flex items-center gap-1 hover:text-brand-700">
              <House className="size-3.5" /> {general.breadcrumbHome}
            </Link>
          </li>
          <ChevronRight className="size-3.5 shrink-0" />
          <li>
            <Link href="/turlar" className="hover:text-brand-700">
              {turlarPage.crumb}
            </Link>
          </li>
          {tour.category && (
            <>
              <ChevronRight className="size-3.5 shrink-0" />
              <li>
                <Link href={`/turlar?kategori=${tour.category.slug}`} className="hover:text-brand-700">
                  {tour.category.name}
                </Link>
              </li>
            </>
          )}
          <ChevronRight className="size-3.5 shrink-0" />
          <li className="truncate font-medium text-brand-800">{tour.title}</li>
        </ol>
      </nav>

      <div className="bg-cream-50 pb-16">
        <div className="container-tr pt-6 lg:pt-8">
          {past && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <CalendarX2 className="mt-0.5 size-6 shrink-0" />
              <div>
                <p className="font-semibold">{booking.pastTourTitle}</p>
                <p className="mt-0.5 text-sm">{booking.pastTourText}</p>
              </div>
            </div>
          )}

          {/* Başlık */}
          {tour.badge && (
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gold-800">
              <Megaphone className="size-3.5" /> {tour.badge}
            </span>
          )}
          <h1 className="font-serif text-3xl font-bold leading-tight text-brand-900 lg:text-4xl">{tour.title}</h1>
          {tour.shortDescription && <p className="mt-2 max-w-3xl text-muted">{tour.shortDescription}</p>}

          {facts.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-3 lg:gap-x-0 lg:divide-x lg:divide-border">
              {facts.map((f) => (
                <li key={f.label} className="flex items-center gap-3 lg:px-6 lg:first:pl-0">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-white text-brand-700">
                    <f.icon className="size-[18px]" />
                  </span>
                  <span>
                    <span className="block text-[11px] font-medium text-muted">{f.label}</span>
                    <span className="block text-sm font-bold text-brand-900">{f.value}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Galeri + fiyat kutusu + oteller + uçuşlar */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[auto_1fr]">
            <div className="lg:col-start-1 lg:row-start-1">
              <TourGallery images={galleryImages} title={tour.title} videoUrl={tour.videoUrl} labels={d} />
            </div>

            <aside className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
              <div className="lg:sticky lg:top-[136px]">
                <TourSidebar
                  tour={{
                    title: tour.title,
                    startingPrice: tour.startingPrice,
                    currency: tour.currency,
                    priceNote: tour.priceNote,
                    seatsLeft: tour.seatsLeft,
                    departureDate: tour.departureDate ? tour.departureDate.toISOString().slice(0, 10) : null,
                    prices: tour.prices,
                  }}
                  past={past}
                  labels={sb}
                  noPrice={noPrice}
                  rates={rates}
                  tlFormat={ui.card.tlFormat}
                  priceDisclaimer={booking.priceDisclaimer}
                  defaultPriceNote={booking.defaultPriceNote}
                  pastText={booking.pastTourText}
                  phone={settings.phone}
                  whatsapp={settings.whatsapp}
                  whatsappText={waText}
                  program={ui.print.openButton ? { href: `/turlar/${tour.slug}/program`, label: ui.print.openButton } : null}
                />
              </div>
            </aside>

            {(tour.hotels.length > 0 || tour.legs.length > 0) && (
              <div className="space-y-6 lg:col-start-1 lg:row-start-2">
                <HotelCards hotels={tour.hotels} labels={d} />
                <FlightLegs
                  labels={d}
                  legs={tour.legs.map((l) => ({
                    ...l,
                    carrier: l.carrier || (l.type === "flight" ? tour.airline : null),
                    date: l.date ? formatDate(l.date) : null,
                  }))}
                />
              </div>
            )}
          </div>

          {/* Bölümler */}
          <div className="mt-8 space-y-6">
            <SectionNav items={navItems} />

            {tour.description && (
              <Section id="genel-bakis" title={s.overviewTitle} icon={<FileText className="size-5" />}>
                <ReadMore moreLabel={s.readMore} lessLabel={s.readLess}>
                  <Prose content={tour.description} />
                </ReadMore>
              </Section>
            )}

            {showDates && (
              <Section id="tarihler" title={s.datesTitle} icon={<CalendarDays className="size-5" />}>
                <TourDates rows={dateRows} currentId={tour.id} labels={{ ...s, seatsLeftFormat: sb.seatsLeftFormat }} />
              </Section>
            )}

            {included.length + excluded.length + documents.length > 0 && (
              <Section id="hizmetler" title={s.servicesTitle} icon={<ListChecks className="size-5" />}>
                <div className="grid gap-8 md:grid-cols-2">
                  {included.length > 0 && (
                    <ServiceList title={s.includedTitle} items={included} kind="in" />
                  )}
                  {excluded.length > 0 && (
                    <ServiceList title={s.excludedTitle} items={excluded} kind="out" />
                  )}
                </div>
                {documents.length > 0 && (
                  <div className="mt-8">
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-brand-900">
                      {s.docsTitle}
                      <span className="rounded-full bg-cream-200 px-2 py-0.5 text-[11px] font-bold text-brand-700">{documents.length}</span>
                    </h3>
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {documents.map((doc, i) => (
                        <li key={i} className="flex items-start gap-3 rounded-2xl border border-border bg-cream-50 p-4 text-sm text-brand-800">
                          <FileText className="mt-0.5 size-5 shrink-0 text-gold-500" /> {doc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Section>
            )}

            {tour.dayPrograms.length > 0 && (
              <Section id="program" title={s.programTitle} icon={<Clock className="size-5" />} description={s.programIntro}>
                <DayProgram
                  days={tour.dayPrograms.map((day) => ({ ...day, dateLabel: formatTourDay(tour.departureDate, day.dayNumber) }))}
                  dayFormat={s.dayFormat}
                />
              </Section>
            )}

            {tour.faqs.length > 0 && (
              <Section id="sss" title={s.faqTitle} icon={<CircleHelp className="size-5" />}>
                <FAQAccordion items={tour.faqs} />
              </Section>
            )}

            <Section
              id="degerlendirmeler"
              title={rv.title}
              icon={<Star className="size-5" />}
              action={
                reviewCount > 0 && (
                  <span className="flex items-center gap-2 text-sm">
                    <span className="font-serif text-2xl font-bold text-brand-900">{reviewAvg.toFixed(1).replace(".", ",")}</span>
                    <span>
                      <Stars value={reviewAvg} />
                      <span className="block text-xs text-muted">{fill(rv.summaryFormat, { sayi: reviewCount })}</span>
                    </span>
                  </span>
                )
              }
            >
              {reviewCount === 0 ? (
                <p className="rounded-2xl border border-dashed border-border bg-cream-50 p-5 text-sm text-muted">{rv.empty}</p>
              ) : (
                <ul className="grid gap-4 md:grid-cols-2">
                  {tour.reviews.map((r) => (
                    <li key={r.id} className="rounded-2xl border border-border p-5">
                      <div className="flex items-center justify-between gap-3">
                        <Stars value={r.rating} />
                        <span className="text-xs text-muted">{formatDate(r.createdAt)}</span>
                      </div>
                      {r.title && <p className="mt-2 font-semibold text-brand-900">{r.title}</p>}
                      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-brand-800/90">{r.comment}</p>
                      <p className="mt-3 text-xs font-semibold text-brand-700">{r.fullName}</p>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-6">
                <ReviewForm tourId={tour.id} labels={rv} />
              </div>
            </Section>
          </div>
        </div>
      </div>

      {nearest.length > 0 && (
        <section className="py-16">
          <div className="container-tr">
            <h2 className="font-serif text-2xl font-bold text-brand-900">{s.nearestTitle}</h2>
            {s.nearestText && <p className="mt-1 text-sm text-muted">{s.nearestText}</p>}
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {nearest.map((t) => (
                <TourCard key={t.id} tour={t} />
              ))}
            </div>
          </div>
        </section>
      )}
    </TourBookingProvider>
  );
}

function Section({
  id,
  title,
  icon,
  description,
  action,
  children,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-36 rounded-3xl border border-border bg-white p-5 shadow-soft sm:p-7 lg:scroll-mt-52">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-3 font-serif text-2xl font-bold text-brand-900">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700">{icon}</span>
            {title}
          </h2>
          {description && <p className="mt-2 text-sm text-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ServiceList({ title, items, kind }: { title: string; items: string[]; kind: "in" | "out" }) {
  const Icon = kind === "in" ? Check : X;
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 border-b border-border pb-3 font-semibold text-brand-900">
        {title}
        <span className="rounded-full bg-cream-200 px-2 py-0.5 text-[11px] font-bold text-brand-700">{items.length}</span>
      </h3>
      <ul className="divide-y divide-border">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 py-2.5 text-sm text-brand-800">
            <span
              className={cn(
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
                kind === "in" ? "bg-brand-50 text-brand-600" : "bg-red-50 text-red-500",
              )}
            >
              <Icon className="size-3" />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
