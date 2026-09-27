import { PageHero, type Crumb } from "./page-hero";
import { TourGrid } from "./tour-grid";
import { CtaBand } from "./cta-band";
import { SectionHeading } from "@/components/ui/section-heading";
import { getTours } from "@/lib/queries";
import { getContent } from "@/lib/content";

type ListingKey = "page.hac-programlari" | "page.umre" | "page.umre-kesin" | "page.umre-luks" | "page.umre-ramazan";

/** Kategori bazlı tur listeleme sayfası — metinler "Sayfa İçerikleri"nden gelir */
export async function TourListing({
  contentKey,
  parent,
  categorySlugs,
  requireDate = false,
}: {
  contentKey: ListingKey;
  /** Sayfa yolundaki üst sayfa (adı o sayfanın içerik bloğundan okunur) */
  parent?: { key: "page.hac" | "page.umre"; href: string };
  categorySlugs?: string[];
  requireDate?: boolean;
}) {
  const [content, tours, parentContent] = await Promise.all([
    getContent(contentKey),
    getTours(categorySlugs, requireDate),
    parent ? getContent(parent.key) : Promise.resolve(null),
  ]);

  const crumbs: Crumb[] = [
    ...(parent && parentContent ? [{ label: parentContent.crumb, href: parent.href }] : []),
    { label: content.crumb },
  ];

  return (
    <>
      <PageHero title={content.title} description={content.description} image={content.image} crumbs={crumbs} />

      <section className="py-16 lg:py-20">
        <div className="container-tr">
          {content.sectionTitle && (
            <SectionHeading className="mb-10" align="left" title={content.sectionTitle} description={content.sectionDescription} />
          )}
          <TourGrid tours={tours} />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
