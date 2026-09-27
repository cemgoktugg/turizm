import { PageHero } from "@/components/site/page-hero";
import { MenasikContent } from "@/components/site/menasik-content";
import { CtaBand } from "@/components/site/cta-band";
import { getContent, pageMetadata } from "@/lib/content";

export const generateMetadata = () => pageMetadata("page.umre-dua");

export default async function UmreDuaPage() {
  const [c, parent] = await Promise.all([getContent("page.umre-dua"), getContent("page.umre")]);
  return (
    <>
      <PageHero
        title={c.title}
        description={c.description}
        image={c.image}
        crumbs={[{ label: parent.crumb, href: "/umre" }, { label: c.crumb }]}
      />
      <MenasikContent steps={c.steps} stepsTitle={c.stepsTitle} stepsEyebrow={c.stepsEyebrow} />
      <CtaBand />
    </>
  );
}
