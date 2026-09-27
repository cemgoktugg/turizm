import Link from "next/link";
import { MoveRight } from "lucide-react";
import { getHotelsByCity } from "@/lib/queries";
import { getContent, pageMetadata } from "@/lib/content";
import { PageHero } from "@/components/site/page-hero";
import { HotelCard } from "@/components/site/hotel-card";
import { CtaBand } from "@/components/site/cta-band";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const generateMetadata = () => pageMetadata("page.oteller");

export default async function OtellerPage() {
  const [c, mekke, medine] = await Promise.all([
    getContent("page.oteller"),
    getHotelsByCity("Mekke"),
    getHotelsByCity("Medine"),
  ]);

  const groups = [
    { city: "Mekke", href: "/oteller/mekke", hotels: mekke, eyebrow: c.mekkeEyebrow, title: c.mekkeTitle, desc: c.mekkeDescription },
    { city: "Medine", href: "/oteller/medine", hotels: medine, eyebrow: c.medineEyebrow, title: c.medineTitle, desc: c.medineDescription },
  ].filter((g) => g.hotels.length > 0);

  return (
    <>
      <PageHero title={c.title} description={c.description} image={c.image} crumbs={[{ label: c.crumb }]} />

      {groups.map((g, gi) => (
        <section key={g.city} className={cn("py-16 lg:py-20", gi % 2 === 1 && "bg-cream-50")}>
          <div className="container-tr">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-end">
              <SectionHeading
                align="left"
                className="mx-0"
                eyebrow={g.eyebrow}
                title={g.title}
                description={g.desc}
              />
              <Link href={g.href} className={cn(buttonVariants({ variant: "outline" }), "hidden shrink-0 sm:inline-flex")}>
                {c.allButton} <MoveRight className="size-4" />
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
