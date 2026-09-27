import { PageHero } from "@/components/site/page-hero";
import { YetkiContent } from "@/components/site/yetki-content";
import { CtaBand } from "@/components/site/cta-band";
import { getContent, pageMetadata } from "@/lib/content";

export const generateMetadata = () => pageMetadata("page.umre-yetki");

export default async function UmreYetkiPage() {
  const c = await getContent("page.umre-yetki");
  return (
    <>
      <PageHero
        title={c.title}
        description={c.description}
        image={c.image}
        crumbs={[{ label: "Umre", href: "/umre" }, { label: "Yetki Belgeleri" }]}
      />
      <YetkiContent intro={c.intro} />
      <CtaBand />
    </>
  );
}
