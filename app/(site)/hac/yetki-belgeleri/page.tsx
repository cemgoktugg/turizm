import { PageHero } from "@/components/site/page-hero";
import { YetkiContent } from "@/components/site/yetki-content";
import { CtaBand } from "@/components/site/cta-band";
import { getContent, pageMetadata } from "@/lib/content";

export const generateMetadata = () => pageMetadata("page.hac-yetki");

export default async function HacYetkiPage() {
  const c = await getContent("page.hac-yetki");
  return (
    <>
      <PageHero
        title={c.title}
        description={c.description}
        image={c.image}
        crumbs={[{ label: "Hac", href: "/hac" }, { label: "Yetki Belgeleri" }]}
      />
      <YetkiContent intro={c.intro} />
      <CtaBand />
    </>
  );
}
