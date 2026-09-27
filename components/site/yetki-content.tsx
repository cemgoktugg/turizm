import { ShieldCheck, Award, FileCheck2, BadgeCheck } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { getCertificates } from "@/lib/queries";

const POINTS = [
  { icon: BadgeCheck, title: "TÜRSAB A Grubu", text: "A grubu seyahat acentası işletme belgesine sahibiz." },
  { icon: Award, title: "Diyanet Yetkisi", text: "Diyanet İşleri Başkanlığı'nca yetkilendirilmiş organizasyon." },
  { icon: FileCheck2, title: "IATA Üyeliği", text: "Uluslararası hava taşımacılığı akreditasyonu." },
  { icon: ShieldCheck, title: "Güvenli Ödeme", text: "Sözleşmeli, şeffaf ve güvenli ödeme altyapısı." },
];

export async function YetkiContent({ intro }: { intro: string }) {
  const certificates = await getCertificates();

  return (
    <>
      <section className="py-16 lg:py-20">
        <div className="container-tr">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-lg leading-relaxed text-muted">{intro}</p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {POINTS.map((p, i) => (
              <Reveal key={p.title} delay={i}>
                <div className="h-full rounded-3xl border border-border bg-white p-6 text-center shadow-soft">
                  <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                    <p.icon className="size-6" />
                  </span>
                  <h3 className="mt-4 font-serif text-base font-bold text-brand-900">
                    {p.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted">{p.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {certificates.length > 0 && (
        <section className="bg-cream-100 py-16 lg:py-20">
          <div className="container-tr">
            <SectionHeading
              eyebrow="Belgelerimiz"
              title="Resmî Yetki Belgeleri"
              description="Tüm belgelerimiz resmî kurumlar tarafından onaylanmıştır."
            />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {certificates.map((c, i) => (
                <Reveal key={c.id} delay={i}>
                  <figure className="group h-full overflow-hidden rounded-3xl border border-border bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
                    <div className="relative aspect-[3/4] overflow-hidden bg-brand-950">
                      <SmartImage
                        src={c.image}
                        alt={c.title}
                        className="size-full transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <figcaption className="p-5">
                      <h3 className="font-semibold text-brand-900">{c.title}</h3>
                      {c.description && (
                        <p className="mt-1 text-sm text-muted">{c.description}</p>
                      )}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
