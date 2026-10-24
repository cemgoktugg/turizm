import { ShieldCheck, ZoomIn } from "lucide-react";
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
                {/* Belge yatay ya da dikey olabilir: kırpılmadan tamamı gösterilir, tıklayınca büyür */}
                <a
                  href={c.image}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${c.title} — büyüt`}
                  className="relative block aspect-[4/3] overflow-hidden border-b border-border bg-cream-50"
                >
                  <SmartImage
                    src={c.image}
                    alt={c.title}
                    className="size-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <span className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-white/90 text-brand-700 opacity-0 shadow-soft transition group-hover:opacity-100">
                    <ZoomIn className="size-4" />
                  </span>
                </a>
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
