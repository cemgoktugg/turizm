import type { Metadata } from "next";
import Link from "next/link";
import { MoveRight } from "lucide-react";
import { getHotelsByCity } from "@/lib/queries";
import { PageHero } from "@/components/site/page-hero";
import { HotelCard } from "@/components/site/hotel-card";
import { CtaBand } from "@/components/site/cta-band";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Oteller",
  description:
    "Mekke ve Medine'de Harem'e yakın, konforlu otel seçeneklerimiz. Otel mesafeleri ve galeri görünümü.",
  alternates: { canonical: "/oteller" },
};

export default async function OtellerPage() {
  const [mekke, medine] = await Promise.all([
    getHotelsByCity("Mekke"),
    getHotelsByCity("Medine"),
  ]);

  const groups = [
    { city: "Mekke", href: "/oteller/mekke", hotels: mekke, desc: "Harem-i Şerif'e yürüme mesafesindeki otellerimiz." },
    { city: "Medine", href: "/oteller/medine", hotels: medine, desc: "Mescid-i Nebevi'ye yakın konforlu otellerimiz." },
  ];

  return (
    <>
      <PageHero
        title="Otellerimiz"
        description="Kutsal mekânlara yakın, konforlu ve güvenli konaklama seçeneklerimizle yolculuğunuz huzurlu geçsin."
        image="/images/otel-mekke-3.svg"
        crumbs={[{ label: "Oteller" }]}
      />

      {groups.map((g, gi) => (
        <section key={g.city} className={cn("py-16 lg:py-20", gi % 2 === 1 && "bg-cream-50")}>
          <div className="container-tr">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-end">
              <SectionHeading
                align="left"
                className="mx-0"
                eyebrow={`${g.city} Konaklama`}
                title={`${g.city} Otelleri`}
                description={g.desc}
              />
              <Link
                href={g.href}
                className={cn(buttonVariants({ variant: "outline" }), "hidden shrink-0 sm:inline-flex")}
              >
                Tümünü Gör <MoveRight className="size-4" />
              </Link>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {g.hotels.map((h, i) => (
                <Reveal key={h.id} delay={i % 3}>
                  <HotelCard hotel={h} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ))}

      <CtaBand />
    </>
  );
}
