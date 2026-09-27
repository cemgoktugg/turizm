import { PageHero } from "@/components/site/page-hero";
import { MenasikContent } from "@/components/site/menasik-content";
import { CtaBand } from "@/components/site/cta-band";
import { getContent, pageMetadata } from "@/lib/content";

export const generateMetadata = () => pageMetadata("page.hac-dua");

export default async function HacDuaPage() {
  const [c, parent] = await Promise.all([getContent("page.hac-dua"), getContent("page.hac")]);
  return (
    <>
      <PageHero
        title={c.title}
        description={c.description}
        image={c.image}
        crumbs={[{ label: parent.crumb, href: "/hac" }, { label: c.crumb }]}
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
