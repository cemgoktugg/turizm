import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleHelp, MoveRight } from "lucide-react";
import { getContent } from "@/lib/content";
import { fill } from "@/lib/content/template";
import { contentVars, getSettings } from "@/lib/settings";
import { getTryRates } from "@/lib/exchange";
import { getLandingBySlug, getLandingTours, parseFaqs } from "@/lib/landing";
import { PageHero } from "@/components/site/page-hero";
import { TourGrid } from "@/components/site/tour-grid";
import { FAQAccordion } from "@/components/site/faq-accordion";
import { CtaBand } from "@/components/site/cta-band";
import { Prose, plainText } from "@/components/site/prose";
import { SectionHeading } from "@/components/ui/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo/json-ld";

type Props = { params: Promise<{ slug: string }> };

/** Panelden oluşturulan arama motoru açılış sayfaları (ör. /sivas-umre) */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getLandingBySlug(slug);
  if (!page) return { title: "Sayfa bulunamadı" };
  const description = page.seoDescription || page.description || undefined;
  return {
    title: page.seoTitle || page.title,
    description,
    alternates: { canonical: `/${page.slug}` },
    openGraph: {
      title: page.seoTitle || page.title,
      description,
      images: page.image ? [page.image] : undefined,
    },
  };
}

export default async function LandingPage({ params }: Props) {
  const { slug } = await params;
  const page = await getLandingBySlug(slug);
  if (!page) notFound();

  const [settings, ui, general, rates] = await Promise.all([
    getSettings(),
    getContent("ui.landing"),
    getContent("ui.general"),
    getTryRates(),
  ]);
  const tours = await getLandingTours(page, rates);
  const vars = contentVars(settings);
  const faqs = parseFaqs(page.faqs).map((f) => ({ question: fill(f.question, vars), answer: fill(f.answer, vars) }));

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: general.breadcrumbHome, url: "/" },
          { name: page.title, url: `/${page.slug}` },
        ]}
      />
      <FaqJsonLd faqs={faqs.map((f) => ({ question: f.question, answer: plainText(f.answer) }))} />
      <PageHero title={page.title} description={page.description ?? undefined} image={page.image ?? undefined} crumbs={[{ label: page.title }]} />

      <section className="py-14 lg:py-16">
        <div className="container-tr max-w-3xl text-[15px] leading-relaxed">
          <Prose content={fill(page.content, vars)} />
        </div>
      </section>

      <section className="bg-cream-50 py-16 lg:py-20">
        <div className="container-tr">
          <div className="mb-10 flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-end">
            <SectionHeading align="left" title={page.toursTitle || ui.toursTitle} className="mx-0" />
            {ui.toursButton && (
              <Link href="/turlar" className={buttonVariants({ variant: "outline" })}>
                {ui.toursButton} <MoveRight className="size-4" />
              </Link>
            )}
          </div>
          <TourGrid tours={tours} emptyText={ui.toursEmpty} />
        </div>
      </section>

      {faqs.length > 0 && (
        <section className="py-16 lg:py-20">
          <div className="container-tr max-w-3xl">
            <h2 className="mb-6 flex items-center gap-3 font-serif text-2xl font-bold text-brand-900 sm:text-3xl">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold-50 text-gold-600">
                <CircleHelp className="size-5" />
              </span>
              {ui.faqTitle}
            </h2>
            <FAQAccordion items={faqs} />
          </div>
        </section>
      )}

      <CtaBand title={ui.ctaTitle} description={ui.ctaDescription} />
    </>
  );
}
