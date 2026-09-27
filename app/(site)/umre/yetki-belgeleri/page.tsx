import { PageHero } from "@/components/site/page-hero";
import { YetkiContent } from "@/components/site/yetki-content";
import { CtaBand } from "@/components/site/cta-band";
import { getContent, pageMetadata } from "@/lib/content";

export const generateMetadata = () => pageMetadata("page.umre-yetki");

export default async function UmreYetkiPage() {
  const [c, parent] = await Promise.all([getContent("page.umre-yetki"), getContent("page.umre")]);
  return (
    <>
      <PageHero
        title={c.title}
        description={c.description}
        image={c.image}
        crumbs={[{ label: parent.crumb, href: "/umre" }, { label: c.crumb }]}
      />
      <YetkiContent intro={c.intro} />
      <CtaBand />
    </>
  );
}
