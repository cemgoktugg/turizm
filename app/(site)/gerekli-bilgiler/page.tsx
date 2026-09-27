import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { CtaBand } from "@/components/site/cta-band";
import { Reveal } from "@/components/ui/reveal";
import { GEREKLI_BILGILER } from "@/lib/constants";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Gerekli Bilgiler",
  description:
    "Umre ve hac yolculuğu öncesi bilmeniz gerekenler: pasaport, vize, aşı, valiz listesi, döviz ve iletişim.",
  alternates: { canonical: "/gerekli-bilgiler" },
};

export default function GerekliBilgilerPage() {
  return (
    <>
      <PageHero
        title="Gerekli Bilgiler"
        description="Kutsal yolculuğunuza sorunsuz bir şekilde hazırlanmanız için bilmeniz gereken her şey."
        image="/images/blog-valiz.svg"
        crumbs={[{ label: "Gerekli Bilgiler" }]}
      />

      <section className="py-16 lg:py-20">
        <div className="container-tr">
          <div className="mx-auto max-w-4xl space-y-6">
            {GEREKLI_BILGILER.map((section, i) => (
              <Reveal key={section.id} delay={i % 3}>
                <div
                  id={section.id}
                  className="scroll-mt-28 overflow-hidden rounded-3xl border border-border bg-white shadow-soft"
                >
                  <div className="flex items-center gap-3 border-b border-border bg-cream-50 px-6 py-4">
                    <span className="grid size-9 place-items-center rounded-full bg-brand-700 text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <h2 className="font-serif text-xl font-bold text-brand-900">
                      {section.title}
                    </h2>
                  </div>
                  <ul className="space-y-3 p-6">
                    {section.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm text-brand-800">
                        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-600" />
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

      <CtaBand title="Sorularınız mı var?" description="Yolculuk hazırlıklarınızla ilgili tüm sorularınız için danışmanlarımız yanınızda." />
    </>
  );
}
