import { PageHero } from "@/components/site/page-hero";
import { YetkiContent } from "@/components/site/yetki-content";
import { CtaBand } from "@/components/site/cta-band";
import { getContent, pageMetadata } from "@/lib/content";

export const generateMetadata = () => pageMetadata("page.hac-yetki");

export default async function HacYetkiPage() {
  const [c, parent] = await Promise.all([getContent("page.hac-yetki"), getContent("page.hac")]);
  return (
    <>
      <PageHero
        title={c.title}
        description={c.description}
        image={c.image}
        crumbs={[{ label: parent.crumb, href: "/hac" }, { label: c.crumb }]}
      />
      <YetkiContent intro={c.intro} />
      <CtaBand />
    </>
  );
}
