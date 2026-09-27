import { PageHero } from "@/components/site/page-hero";
import { MenasikContent } from "@/components/site/menasik-content";
import { CtaBand } from "@/components/site/cta-band";
import { getContent, pageMetadata } from "@/lib/content";

export const generateMetadata = () => pageMetadata("page.hac-dua");

export default async function HacDuaPage() {
  const c = await getContent("page.hac-dua");
  return (
    <>
      <PageHero
        title={c.title}
        description={c.description}
        image={c.image}
        crumbs={[{ label: "Hac", href: "/hac" }, { label: "Dua ve Vazifeler" }]}
      />
      <MenasikContent
        steps={c.steps}
        stepsTitle={c.stepsTitle}
        stepsEyebrow={c.stepsEyebrow}
        vazifeler={c.vazifeler}
        vazifelerTitle={c.vazifelerTitle}
        vazifelerEyebrow={c.vazifelerEyebrow}
      />
      <CtaBand />
    </>
  );
}
