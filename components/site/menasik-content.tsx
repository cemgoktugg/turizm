import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { Heart } from "lucide-react";
import { getContent } from "@/lib/content";

type Step = { title: string; text: string };

/** Menasik adımları + (opsiyonel) vazifeler + dualar */
export async function MenasikContent({
  steps,
  stepsTitle,
  stepsEyebrow,
  vazifeler,
  vazifelerTitle,
  vazifelerEyebrow,
}: {
  steps: Step[];
  stepsTitle: string;
  stepsEyebrow?: string;
  vazifeler?: { title: string; items: string[] }[];
  vazifelerTitle?: string;
  vazifelerEyebrow?: string;
}) {
  const dualar = await getContent("shared.dualar");

  return (
    <>
      {/* Menasik adımları */}
      {steps.length > 0 && (
        <section className="py-16 lg:py-20">
          <div className="container-tr">
            <SectionHeading eyebrow={stepsEyebrow} title={stepsTitle} />
            <div className="mx-auto mt-12 max-w-4xl">
              <ol className="relative space-y-8 border-l-2 border-dashed border-brand-200 pl-8 sm:pl-10">
                {steps.map((s, i) => (
                  <Reveal as="li" key={i} delay={i} className="relative">
                    <span className="absolute -left-[41px] grid size-9 place-items-center rounded-full bg-brand-700 text-sm font-bold text-white shadow-soft sm:-left-[49px]">
                      {i + 1}
                    </span>
                    <h3 className="font-serif text-xl font-bold text-brand-900">{s.title}</h3>
                    <p className="mt-1.5 leading-relaxed text-muted">{s.text}</p>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}

      {/* Vazifeler (opsiyonel) */}
      {vazifeler && vazifeler.length > 0 && (
        <section className="bg-cream-100 py-16 lg:py-20">
          <div className="container-tr">
            <SectionHeading eyebrow={vazifelerEyebrow} title={vazifelerTitle ?? ""} />
            <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
              {vazifeler.map((v, i) => (
                <Reveal key={i} delay={i}>
                  <div className="h-full rounded-3xl border border-border bg-white p-6 shadow-soft">
                    <h3 className="font-serif text-lg font-bold text-brand-800">{v.title}</h3>
                    <ul className="mt-4 space-y-2 text-sm text-muted">
                      {v.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Dualar */}
      {dualar.items.length > 0 && (
        <section className="py-16 lg:py-20">
          <div className="container-tr">
            <SectionHeading eyebrow={dualar.eyebrow} title={dualar.title} description={dualar.description} />
            <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
              {dualar.items.map((d, i) => (
                <Reveal key={i} delay={i}>
                  <div className="flex h-full flex-col rounded-3xl border border-border bg-gradient-to-b from-white to-cream-50 p-6 shadow-soft">
                    <div className="flex items-center gap-2 text-gold-600">
                      <Heart className="size-4" />
                      <h3 className="font-serif text-lg font-bold text-brand-900">{d.title}</h3>
                    </div>
                    {d.arabic && (
                      <p dir="rtl" className="mt-4 text-right font-serif text-2xl leading-relaxed text-brand-800">
                        {d.arabic}
                      </p>
                    )}
                    {d.text && <p className="mt-4 text-sm font-medium italic text-brand-700">{d.text}</p>}
                    {d.meaning && <p className="mt-3 border-t border-border pt-3 text-sm text-muted">{d.meaning}</p>}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
