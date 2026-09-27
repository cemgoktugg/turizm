import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin, Plane, Building2, Bed, MessageCircle, CalendarX2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { activeTourWhere, getTourBySlug, isPastTour } from "@/lib/queries";
import { getSettings, whatsappLink } from "@/lib/settings";
import { getContent } from "@/lib/content";
import { fill } from "@/lib/content/template";
import { PageHero } from "@/components/site/page-hero";
import { TourGallery } from "@/components/site/tour-gallery";
import { TourDetailTabs } from "@/components/site/tour-detail-tabs";
import { BookingForm } from "@/components/site/booking-form";
import { TourCard, formatDuration } from "@/components/site/tour-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice, formatDateRange, splitLines } from "@/lib/utils";
import { TourJsonLd, FaqJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";

export async function generateStaticParams() {
  const tours = await prisma.tour.findMany({ where: activeTourWhere(), select: { slug: true } });
  return tours.map((t) => ({ slug: t.slug }));
}

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

export default async function TourDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) notFound();

  const past = isPastTour(tour.departureDate);
  const [settings, booking, ui, turlarPage, general, wa, similar] = await Promise.all([
    getSettings(),
    getContent("shared.booking"),
    getContent("ui.tours"),
    getContent("page.turlar"),
    getContent("ui.general"),
    getContent("ui.whatsapp"),
    past
      ? prisma.tour.findMany({
          where: activeTourWhere({ categoryId: tour.categoryId, id: { not: tour.id } }),
          include: { category: true },
          orderBy: { departureDate: "asc" },
          take: 3,
        })
      : Promise.resolve([]),
  ]);

  const galleryImages = [tour.coverImage, ...tour.images.map((i) => i.url)].filter(
    (v, i, arr): v is string => Boolean(v) && arr.indexOf(v) === i,
  );

  const included = splitLines(tour.includedServices);
  const excluded = splitLines(tour.excludedServices);
  const documents = splitLines(tour.requiredDocuments);
  const dateRange = formatDateRange(tour.departureDate, tour.returnDate);

  const t = ui.detail;
  const facts = [
    { icon: CalendarDays, label: t.factDate, value: dateRange },
    { icon: Clock, label: t.factDuration, value: formatDuration(tour.durationDays, tour.durationNights, ui.card) },
    { icon: MapPin, label: t.factDeparture, value: tour.departureCity },
    { icon: Plane, label: t.factAirline, value: tour.airline },
    { icon: Building2, label: t.factMakkahHotel, value: tour.makkahHotel },
    { icon: Building2, label: t.factMadinahHotel, value: tour.madinahHotel },
  ].filter((f) => f.value);

  const waText = fill(wa.tour, { tur: tour.title });

  return (
    <>
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

      <PageHero
        title={tour.title}
        description={tour.shortDescription || undefined}
        image={tour.coverImage || "/images/hero-2.svg"}
        crumbs={[
          { label: turlarPage.crumb, href: "/turlar" },
          { label: tour.category?.name || turlarPage.crumb, href: `/turlar?kategori=${tour.category?.slug}` },
        ]}
      />

      <section className="py-12 lg:py-16">
        <div className="container-tr grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          {/* Sol içerik */}
          <div>
            {past && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
                <CalendarX2 className="mt-0.5 size-6 shrink-0" />
                <div>
                  <p className="font-semibold">{booking.pastTourTitle}</p>
                  <p className="mt-1 text-sm">{booking.pastTourText}</p>
                </div>
              </div>
            )}

            <TourGallery images={galleryImages} title={tour.title} />

            {/* Hızlı bilgiler */}
            {facts.length > 0 && (
              <div className="mt-8 grid gap-4 rounded-3xl border border-border bg-cream-50 p-6 sm:grid-cols-2 lg:grid-cols-3">
                {facts.map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand-700 shadow-sm">
                      <f.icon className="size-5" />
                    </span>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted">{f.label}</p>
                      <p className="text-sm font-semibold text-brand-900">{f.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(tour.makkahDistance || tour.madinahDistance) && (
              <div className="mt-4 flex flex-wrap gap-3">
                {tour.makkahDistance && (
                  <Badge variant="gold" size="md" className="gap-1.5">
                    <MapPin className="size-3.5" /> {t.makkahPrefix}: {tour.makkahDistance}
                  </Badge>
                )}
                {tour.madinahDistance && (
                  <Badge variant="brand" size="md" className="gap-1.5">
                    <MapPin className="size-3.5" /> {t.madinahPrefix}: {tour.madinahDistance}
                  </Badge>
                )}
              </div>
            )}

            {/* Açıklama */}
            {tour.description && (
              <div className="mt-10">
                <h2 className="font-serif text-2xl font-bold text-brand-900">{t.aboutTitle}</h2>
                <div className="mt-4 space-y-3 leading-relaxed text-brand-800/90">
                  {splitLines(tour.description).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Oda fiyatları */}
            {tour.prices.length > 0 && (
              <div className="mt-10">
                <h2 className="flex items-center gap-2 font-serif text-2xl font-bold text-brand-900">
                  <Bed className="size-6 text-gold-500" /> {t.pricesTitle}
                </h2>
                <div className="mt-4 overflow-hidden rounded-2xl border border-border">
                  {tour.prices.map((p, i) => (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between px-5 py-4 ${i % 2 === 0 ? "bg-white" : "bg-cream-50"}`}
                    >
                      <span className="text-sm font-medium text-brand-800">{p.roomType}</span>
                      <span className="font-serif text-lg font-bold text-brand-700">{formatPrice(p.price, p.currency, ui.card.noPrice)}</span>
                    </div>
                  ))}
                </div>
                {booking.priceDisclaimer && <p className="mt-2 text-xs text-muted">{booking.priceDisclaimer}</p>}
              </div>
            )}

            {/* Sekmeler */}
            <div className="mt-10">
              <TourDetailTabs
                program={tour.dayPrograms}
                included={included}
                excluded={excluded}
                documents={documents}
                faqs={tour.faqs}
                labels={t}
              />
            </div>
          </div>

          {/* Sağ sidebar */}
          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-card">
              <div className="bg-brand-800 p-6 text-center text-white">
                <p className="text-sm text-cream-100/80">{t.priceBoxLabel}</p>
                <p className="mt-1 font-serif text-4xl font-bold text-white">
                  {formatPrice(tour.startingPrice, tour.currency ?? "USD", ui.card.noPrice)}
                </p>
                {tour.startingPrice != null && (
                  <p className="mt-1 text-xs text-cream-100/70">{tour.priceNote || booking.defaultPriceNote}</p>
                )}
              </div>
              <div className="p-6">
                {past ? (
                  <>
                    <h3 className="font-serif text-lg font-bold text-brand-900">{t.closedTitle}</h3>
                    <p className="mt-1 text-sm text-muted">{booking.pastTourText}</p>
                    <Link href="/turlar" className={`${buttonVariants({ variant: "primary" })} mt-4 w-full`}>
                      {t.closedButton}
                    </Link>
                  </>
                ) : (
                  <>
                    <h3 className="font-serif text-lg font-bold text-brand-900">{booking.sidebarTitle}</h3>
                    <p className="mt-1 text-sm text-muted">{booking.sidebarText}</p>
                    <div className="mt-4">
                      <BookingForm tourId={tour.id} tourTitle={tour.title} variant="bare" source="tur-detay" texts={booking} />
                    </div>
                  </>
                )}
                <a
                  href={whatsappLink(settings.whatsapp, waText)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-[#25D366] py-2.5 text-sm font-semibold text-[#1eb955] transition hover:bg-[#25D366] hover:text-white"
                >
                  <MessageCircle className="size-4" /> {t.whatsappButton}
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="bg-cream-50 py-16">
          <div className="container-tr">
            <h2 className="mb-8 font-serif text-2xl font-bold text-brand-900">{t.similarTitle}</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {similar.map((t) => (
                <TourCard key={t.id} tour={t} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
