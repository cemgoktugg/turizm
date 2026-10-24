import Link from "next/link";
import { MessageCircle, MoveRight, Phone, Quote } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { contentVars, getSettings, telLink, whatsappLink } from "@/lib/settings";
import { prepareFaqGroups } from "@/lib/faq";
import { FAQAccordion } from "@/components/site/faq-accordion";
import { getContent } from "@/lib/content";
import { activeTourWhere, getStories } from "@/lib/queries";
import { isVideoUrl } from "@/lib/media-types";
import { categoryHref } from "@/lib/categories";
import { HeroSlider } from "@/components/site/hero-slider";
import { StoriesBar } from "@/components/site/stories/stories-bar";
import { TourCard } from "@/components/site/tour-card";
import { HotelCard } from "@/components/site/hotel-card";
import { BlogCard } from "@/components/site/blog-card";
import { CertificateSection } from "@/components/site/certificate-section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { Icon } from "@/components/ui/icon";
import { SmartImage } from "@/components/ui/smart-image";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TravelAgencyJsonLd } from "@/components/seo/json-ld";

export default async function HomePage() {
  const [settings, hero, storiesContent, sections, features, prep, quote, stories, faq] = await Promise.all([
    getSettings(),
    getContent("home.hero"),
    getContent("home.stories"),
    getContent("home.sections"),
    getContent("home.features"),
    getContent("home.prep"),
    getContent("home.quote"),
    getStories(),
    getContent("page.sss"),
  ]);

  const [featured, categories, mekke, medine, posts] = await Promise.all([
    prisma.tour.findMany({
      where: activeTourWhere({ isFeatured: true }),
      include: { category: true },
      orderBy: [{ departureDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
      take: 6,
    }),
    prisma.tourCategory.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
    prisma.hotel.findMany({ where: { isPublished: true, city: "Mekke" }, orderBy: { stars: "desc" }, take: 3 }),
    prisma.hotel.findMany({ where: { isPublished: true, city: "Medine" }, orderBy: { stars: "desc" }, take: 3 }),
    prisma.blogPost.findMany({ where: { isPublished: true }, orderBy: { createdAt: "desc" }, take: 3 }),
  ]);

  const hotels = [...mekke, ...medine];
  const faqCount = Number.parseInt(faq.home.count, 10) || 0;
  const homeFaqs = faq.home.title && faqCount > 0
    ? prepareFaqGroups(faq.groups, contentVars(settings)).flatMap((g) => g.items).slice(0, faqCount)
    : [];

  return (
    <>
      <TravelAgencyJsonLd settings={settings} />
      <HeroSlider content={hero} whatsapp={settings.whatsapp} />

      {/* Hikayeler (Instagram tarzı yuvarlak videolar) */}
      <StoriesBar
        title={storiesContent.title}
        labels={storiesContent}
        stories={stories.map((st) => ({
          id: st.id,
          seenKey: `${st.id}:${st.updatedAt.getTime()}`,
          title: st.title,
          thumb: st.cover || st.items.find((it) => !isVideoUrl(it.url))?.url || st.items[0].url,
          buttonLabel: st.buttonLabel,
          buttonUrl: st.buttonUrl,
          items: st.items.map((it) => ({
            id: it.id,
            url: it.url,
            caption: it.caption,
            duration: it.duration,
            isVideo: isVideoUrl(it.url),
          })),
        }))}
      />

      {/* Öne çıkan turlar */}
      {featured.length > 0 && (
        <section className="bg-cream-50 py-20">
          <div className="container-tr">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-end">
              <SectionHeading
                align="left"
                eyebrow={sections.featured.eyebrow}
                title={sections.featured.title}
                description={sections.featured.description}
                className="mx-0"
              />
              <Link href="/turlar" className={cn(buttonVariants({ variant: "outline" }), "hidden shrink-0 sm:inline-flex")}>
                {sections.featured.buttonLabel} <MoveRight className="size-4" />
              </Link>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((tour, i) => (
                <Reveal key={tour.id} delay={i % 3}>
                  <TourCard tour={tour} />
                </Reveal>
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link href="/turlar" className={buttonVariants({ variant: "outline" })}>
                {sections.featured.buttonLabel} <MoveRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Kategoriler */}
      {categories.length > 0 && (
        <section className="py-20">
          <div className="container-tr">
            <SectionHeading
              eyebrow={sections.categories.eyebrow}
              title={sections.categories.title}
              description={sections.categories.description}
            />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c, i) => (
                <Reveal key={c.id} delay={i % 3}>
                  <Link
                    href={categoryHref(c.slug)}
                    className="group relative flex h-56 flex-col justify-end overflow-hidden rounded-3xl border border-border p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
                  >
                    <SmartImage
                      src={c.image}
                      alt={c.name}
                      className="absolute inset-0 size-full transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-950/40 to-transparent" />
                    <div className="relative">
                      <span className="mb-3 grid size-11 place-items-center rounded-xl bg-gold-400 text-brand-950">
                        <Icon name={c.icon} className="size-5" />
                      </span>
                      <h3 className="font-serif text-xl font-bold text-white">{c.name}</h3>
                      {c.description && <p className="mt-1 line-clamp-2 text-sm text-cream-100/80">{c.description}</p>}
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Neden biz */}
      {features.items.length > 0 && (
        <section className="relative overflow-hidden bg-brand-900 py-20 text-white">
          <SmartImage src={features.image} alt="" className="absolute inset-0 size-full opacity-20" fallback="/images/cta-bg.svg" />
          <div className="container-tr relative">
            <SectionHeading light eyebrow={features.eyebrow} title={features.title} description={features.description} />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.items.map((f, i) => (
                <Reveal key={i} delay={i % 3}>
                  <div className="group h-full rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-colors hover:border-gold-400/40 hover:bg-white/10">
                    <span className="grid size-12 place-items-center rounded-2xl bg-gold-400/15 text-gold-300 transition-colors group-hover:bg-gold-400 group-hover:text-brand-950">
                      <Icon name={f.icon} className="size-6" />
                    </span>
                    <h3 className="mt-4 font-serif text-lg font-bold text-white">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-cream-100/70">{f.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Oteller */}
      {hotels.length > 0 && (
        <section className="bg-cream-50 py-20">
          <div className="container-tr">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-end">
              <SectionHeading
                align="left"
                eyebrow={sections.hotels.eyebrow}
                title={sections.hotels.title}
                description={sections.hotels.description}
                className="mx-0"
              />
              <div className="hidden shrink-0 gap-2 sm:flex">
                <Link href="/oteller/mekke" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  {sections.hotels.mekkeButton}
                </Link>
                <Link href="/oteller/medine" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  {sections.hotels.medineButton}
                </Link>
              </div>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {hotels.map((h, i) => (
                <Reveal key={h.id} delay={i % 3}>
                  <HotelCard hotel={h} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bilgilendirme */}
      {prep.items.length > 0 && (
        <section className="py-20">
          <div className="container-tr">
            <SectionHeading eyebrow={prep.eyebrow} title={prep.title} description={prep.description} />
            <div
              className={cn(
                "mt-12 grid gap-5 sm:grid-cols-2",
                prep.items.length >= 5 ? "lg:grid-cols-5" : prep.items.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
              )}
            >
              {prep.items.map((p, i) => (
                <Reveal key={i} delay={i % 5}>
                  <Link
                    href={p.href || "#"}
                    className="group flex h-full flex-col rounded-3xl border border-border bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-gold-200 hover:shadow-card"
                  >
                    <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-700 group-hover:text-white">
                      <Icon name={p.icon} className="size-5" />
                    </span>
                    <h3 className="mt-4 font-serif text-base font-bold text-brand-900">{p.title}</h3>
                    <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted">{p.text}</p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Manevi alıntı */}
      {quote.text && (
        <section className="bg-brand-950 py-16">
          <div className="container-tr">
            <Reveal className="mx-auto max-w-3xl text-center">
              <Quote className="mx-auto size-10 text-gold-400/60" />
              <p className="mt-6 font-serif text-2xl leading-relaxed text-cream-100 sm:text-3xl">“{quote.text}”</p>
              {quote.source && (
                <p className="mt-5 text-sm font-semibold uppercase tracking-widest text-gold-400">{quote.source}</p>
              )}
            </Reveal>
          </div>
        </section>
      )}

      {/* Blog */}
      {posts.length > 0 && (
        <section className="py-20">
          <div className="container-tr">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-end">
              <SectionHeading
                align="left"
                eyebrow={sections.blog.eyebrow}
                title={sections.blog.title}
                description={sections.blog.description}
                className="mx-0"
              />
              <Link href="/blog" className={cn(buttonVariants({ variant: "outline" }), "hidden shrink-0 sm:inline-flex")}>
                {sections.blog.buttonLabel} <MoveRight className="size-4" />
              </Link>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {posts.map((p, i) => (
                <Reveal key={p.id} delay={i % 3}>
                  <BlogCard post={p} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sık sorulan sorular */}
      {homeFaqs.length > 0 && (
        <section className="bg-cream-50 py-20">
          <div className="container-tr grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
            <div>
              <SectionHeading
                align="left"
                eyebrow={faq.home.eyebrow}
                title={faq.home.title}
                description={faq.home.description}
                className="mx-0"
              />
              <div className="mt-8 rounded-3xl bg-brand-900 p-6 text-white shadow-card">
                {faq.home.helpText && <p className="text-sm text-cream-100/80">{faq.home.helpText}</p>}
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <a href={telLink(settings.phone)} className={buttonVariants({ variant: "gold", size: "sm" })}>
                    <Phone className="size-4" /> {settings.phone}
                  </a>
                  <a
                    href={whatsappLink(settings.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/25 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    <MessageCircle className="size-4" /> WhatsApp
                  </a>
                </div>
              </div>
              {faq.home.buttonLabel && (
                <Link href="/sss" className={cn(buttonVariants({ variant: "outline" }), "mt-6")}>
                  {faq.home.buttonLabel} <MoveRight className="size-4" />
                </Link>
              )}
            </div>
            <FAQAccordion items={homeFaqs} />
          </div>
        </section>
      )}

      {/* Belgeler */}
      <CertificateSection />
    </>
  );
}
