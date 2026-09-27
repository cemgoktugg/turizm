import { ShieldCheck } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { getCertificates } from "@/lib/queries";
import { getContent } from "@/lib/content";

/** Yayındaki belgeler — başlık "Ortak Bölümler › Belgeler ve Yetki Bölümü"nden gelir */
export async function CertificateSection({ className = "bg-cream-100" }: { className?: string }) {
  const [certificates, heading] = await Promise.all([getCertificates(), getContent("shared.certificates")]);
  if (!certificates.length) return null;

  return (
    <section className={`${className} py-20`}>
      <div className="container-tr">
        <SectionHeading eyebrow={heading.eyebrow} title={heading.title} description={heading.description} />
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
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="mt-0.5 size-5 shrink-0 text-gold-500" />
                    <div>
                      <h3 className="font-semibold text-brand-900">{c.title}</h3>
                      {c.description && <p className="mt-1 text-sm text-muted">{c.description}</p>}
                    </div>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
