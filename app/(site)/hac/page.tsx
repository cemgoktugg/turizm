import Link from "next/link";
import { MoveRight } from "lucide-react";
import { getTours } from "@/lib/queries";
import { getContent, pageMetadata } from "@/lib/content";
import { PageHero } from "@/components/site/page-hero";
import { TourGrid } from "@/components/site/tour-grid";
import { CtaBand } from "@/components/site/cta-band";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { buttonVariants } from "@/components/ui/button";

export const generateMetadata = () => pageMetadata("page.hac");

export default async function HacPage() {
  const [c, menasik, tours] = await Promise.all([getContent("page.hac"), getContent("page.hac-dua"), getTours(["hac"])]);

  return (
    <>
      <PageHero title={c.title} description={c.description} image={c.image} crumbs={[{ label: c.crumb }]} />

      {/* Giriş */}
      <section className="py-16 lg:py-20">
        <div className="container-tr grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            {c.introEyebrow && (
              <span className="eyebrow">
                <span className="h-px w-6 bg-current opacity-60" /> {c.introEyebrow}
              </span>
            )}
            <h2 className="mt-3 font-serif text-3xl font-bold text-brand-900 sm:text-4xl">{c.introTitle}</h2>
            {c.introParagraphs.map((p, i) => (
              <p key={i} className={i === 0 ? "mt-4 leading-relaxed text-muted" : "mt-3 leading-relaxed text-muted"}>
                {p}
              </p>
            ))}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/hac/programlari" className={buttonVariants({ variant: "primary" })}>
                {c.primaryButton} <MoveRight className="size-4" />
              </Link>
              <Link href="/hac/dua-ve-vazifeler" className={buttonVariants({ variant: "outline" })}>
                {c.secondaryButton}
              </Link>
            </div>
          </Reveal>

          {menasik.steps.length > 0 && (
            <Reveal delay={1}>
              <div className="grid gap-4 sm:grid-cols-2">
                {menasik.steps.slice(0, 4).map((m, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-cream-50 p-5">
                    <span className="grid size-9 place-items-center rounded-full bg-gold-400 text-sm font-bold text-brand-950">
                      {i + 1}
                    </span>
                    <h3 className="mt-3 font-semibold text-brand-900">{m.title}</h3>
                    <p className="mt-1 text-sm text-muted">{m.text}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* Programlar */}
      <section className="bg-cream-50 py-16 lg:py-20">
        <div className="container-tr">
          <SectionHeading
            align="left"
            className="mb-10"
            eyebrow={c.programsEyebrow}
            title={c.programsTitle}
            description={c.programsDescription}
          />
          <TourGrid tours={tours} emptyText={c.emptyText} />
        </div>
      </section>

      <CtaBand title={c.ctaTitle} description={c.ctaDescription} />
    </>
  );
}
