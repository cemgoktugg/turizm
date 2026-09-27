import { DUALAR } from "@/lib/constants";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { Heart } from "lucide-react";

type Step = { step: string; title: string; text: string };

export function MenasikContent({
  steps,
  stepsTitle,
  stepsEyebrow = "Menasik",
  vazifeler,
}: {
  steps: readonly Step[];
  stepsTitle: string;
  stepsEyebrow?: string;
  vazifeler?: { title: string; items: string[] }[];
}) {
  return (
    <>
      {/* Menasik adımları */}
      <section className="py-16 lg:py-20">
        <div className="container-tr">
          <SectionHeading eyebrow={stepsEyebrow} title={stepsTitle} />
          <div className="mx-auto mt-12 max-w-4xl">
            <ol className="relative space-y-8 border-l-2 border-dashed border-brand-200 pl-8 sm:pl-10">
              {steps.map((s, i) => (
                <Reveal as="li" key={i} delay={i} className="relative">
                  <span className="absolute -left-[41px] grid size-9 place-items-center rounded-full bg-brand-700 text-sm font-bold text-white shadow-soft sm:-left-[49px]">
                    {s.step}
                  </span>
                  <h3 className="font-serif text-xl font-bold text-brand-900">
                    {s.title}
                  </h3>
                  <p className="mt-1.5 leading-relaxed text-muted">{s.text}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Vazifeler (opsiyonel) */}
      {vazifeler && vazifeler.length > 0 && (
        <section className="bg-cream-100 py-16 lg:py-20">
          <div className="container-tr">
            <SectionHeading eyebrow="Vazifeler" title="Farz, Vacip ve Sünnetler" />
            <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
              {vazifeler.map((v, i) => (
                <Reveal key={v.title} delay={i}>
                  <div className="h-full rounded-3xl border border-border bg-white p-6 shadow-soft">
                    <h3 className="font-serif text-lg font-bold text-brand-800">
                      {v.title}
                    </h3>
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
      <section className="py-16 lg:py-20">
        <div className="container-tr">
          <SectionHeading
            eyebrow="Dualar"
            title="Yolculukta Okunacak Dualar"
            description="İhrama girerken ve ibadetler esnasında okunan başlıca dualar."
          />
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
            {DUALAR.map((d, i) => (
              <Reveal key={d.title} delay={i}>
                <div className="flex h-full flex-col rounded-3xl border border-border bg-gradient-to-b from-white to-cream-50 p-6 shadow-soft">
                  <div className="flex items-center gap-2 text-gold-600">
                    <Heart className="size-4" />
                    <h3 className="font-serif text-lg font-bold text-brand-900">
                      {d.title}
                    </h3>
                  </div>
                  <p dir="rtl" className="mt-4 text-right font-serif text-2xl leading-relaxed text-brand-800">
                    {d.arabic}
                  </p>
                  <p className="mt-4 text-sm font-medium italic text-brand-700">
                    {d.text}
                  </p>
                  <p className="mt-3 border-t border-border pt-3 text-sm text-muted">
                    {d.meaning}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
