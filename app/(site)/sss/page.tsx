import { CircleHelp } from "lucide-react";
import { getContent, pageMetadata } from "@/lib/content";
import { contentVars, getSettings } from "@/lib/settings";
import { prepareFaqGroups } from "@/lib/faq";
import { PageHero } from "@/components/site/page-hero";
import { FAQAccordion } from "@/components/site/faq-accordion";
import { CtaBand } from "@/components/site/cta-band";
import { plainText } from "@/components/site/prose";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo/json-ld";

export const generateMetadata = () => pageMetadata("page.sss");

export default async function SssPage() {
  const [c, settings, ui] = await Promise.all([getContent("page.sss"), getSettings(), getContent("ui.general")]);
  const groups = prepareFaqGroups(c.groups, contentVars(settings));
  const all = groups.flatMap((g) => g.items);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: ui.breadcrumbHome, url: "/" },
          { name: c.crumb, url: "/sss" },
        ]}
      />
      <FaqJsonLd faqs={all.map((f) => ({ question: f.question, answer: plainText(f.answer) }))} />
      <PageHero title={c.title} description={c.description} image={c.image} crumbs={[{ label: c.crumb }]} />

      <section className="py-14 lg:py-20">
        <div className="container-tr grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
          {/* Grup menüsü: mobilde yatay kaydırmalı, masaüstünde sabit */}
          {groups.length > 1 && (
            <nav aria-label={c.title} className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
              <ul className="flex gap-2 lg:sticky lg:top-32 lg:flex-col lg:gap-1">
                {groups.map((g) => (
                  <li key={g.id} className="shrink-0">
                    <a
                      href={`#${g.id}`}
                      className="flex items-center justify-between gap-3 whitespace-nowrap rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-brand-800 transition hover:border-brand-300 hover:bg-brand-50 lg:rounded-xl lg:border-transparent lg:bg-transparent"
                    >
                      {g.title}
                      <span className="rounded-full bg-cream-200 px-1.5 text-xs text-brand-700">{g.items.length}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div className={groups.length > 1 ? "space-y-12" : "space-y-12 lg:col-span-2"}>
            {groups.map((g, i) => (
              <section key={g.id} id={g.id} className="scroll-mt-32">
                <h2 className="mb-5 flex items-center gap-3 font-serif text-2xl font-bold text-brand-900">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold-50 text-gold-600">
                    <CircleHelp className="size-5" />
                  </span>
                  {g.title}
                </h2>
                <FAQAccordion items={g.items} defaultOpen={i === 0 ? 0 : null} />
              </section>
            ))}
          </div>
        </div>
      </section>

      <CtaBand title={c.ctaTitle} description={c.ctaDescription} />
    </>
  );
}
