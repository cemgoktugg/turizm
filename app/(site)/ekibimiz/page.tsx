import { notFound } from "next/navigation";
import { getContent, pageMetadata } from "@/lib/content";
import { PageHero } from "@/components/site/page-hero";
import { TeamGrid } from "@/components/site/team-grid";
import { visibleMembers } from "@/lib/team";
import { CtaBand } from "@/components/site/cta-band";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const generateMetadata = () => pageMetadata("page.ekibimiz");

export default async function EkibimizPage() {
  const [c, ui] = await Promise.all([getContent("page.ekibimiz"), getContent("ui.general")]);
  const members = visibleMembers(c.members);
  // Panelden kişi eklenene kadar sayfa yayında değildir
  if (!members.length) notFound();

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: ui.breadcrumbHome, url: "/" },
          { name: c.crumb, url: "/ekibimiz" },
        ]}
      />
      <PageHero title={c.title} description={c.description} image={c.image} crumbs={[{ label: c.crumb }]} />

      <section className="py-16 lg:py-20">
        <div className="container-tr">
          {c.intro && <p className="mx-auto mb-12 max-w-3xl text-center text-lg leading-relaxed text-brand-800">{c.intro}</p>}
          <TeamGrid members={members} />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
