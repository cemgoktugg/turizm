import { getHotelsByCity } from "@/lib/queries";
import { getContent } from "@/lib/content";
import { PageHero } from "./page-hero";
import { HotelCard } from "./hotel-card";
import { CtaBand } from "./cta-band";
import { Reveal } from "@/components/ui/reveal";
import { Building2 } from "lucide-react";

export async function HotelsCity({ city }: { city: "Mekke" | "Medine" }) {
  const [hotels, content] = await Promise.all([
    getHotelsByCity(city),
    getContent(city === "Mekke" ? "page.oteller-mekke" : "page.oteller-medine"),
  ]);

  return (
    <>
      <PageHero
        title={content.title}
        description={content.description}
        image={content.image}
        crumbs={[{ label: "Oteller", href: "/oteller" }, { label: `${city} Otelleri` }]}
      />

      <section className="py-16 lg:py-20">
        <div className="container-tr">
          {hotels.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {hotels.map((h, i) => (
                <Reveal key={h.id} delay={i % 3}>
                  <HotelCard hotel={h} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-md rounded-3xl border border-dashed border-border bg-cream-50 p-10 text-center">
              <div className="mx-auto grid size-14 place-items-center rounded-full bg-brand-50 text-brand-600">
                <Building2 className="size-7" />
              </div>
              <p className="mt-4 text-sm text-muted">Bu şehir için otel bilgisi yakında eklenecektir.</p>
            </div>
          )}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
