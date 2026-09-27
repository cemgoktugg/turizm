import { Reveal } from "@/components/ui/reveal";
import { Icon } from "@/components/ui/icon";
import { getContent } from "@/lib/content";
import { CertificateSection } from "./certificate-section";

export async function YetkiContent({ intro }: { intro: string }) {
  const content = await getContent("shared.certificates");

  return (
    <>
      <section className="py-16 lg:py-20">
        <div className="container-tr">
          {intro && (
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-lg leading-relaxed text-muted">{intro}</p>
            </div>
          )}

          {content.points.length > 0 && (
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {content.points.map((p, i) => (
                <Reveal key={i} delay={i}>
                  <div className="h-full rounded-3xl border border-border bg-white p-6 text-center shadow-soft">
                    <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                      <Icon name={p.icon} className="size-6" />
                    </span>
                    <h3 className="mt-4 font-serif text-base font-bold text-brand-900">{p.title}</h3>
                    <p className="mt-1.5 text-sm text-muted">{p.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <CertificateSection />
    </>
  );
}
