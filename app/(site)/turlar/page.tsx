import { prisma } from "@/lib/prisma";
import { activeTourWhere } from "@/lib/queries";
import { getContent, pageMetadata } from "@/lib/content";
import { PageHero } from "@/components/site/page-hero";
import { TourFilter, type FilterOption } from "@/components/site/tour-filter";
import { TourGrid } from "@/components/site/tour-grid";
import { CtaBand } from "@/components/site/cta-band";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const generateMetadata = () => pageMetadata("page.turlar");

export default async function TurlarPage({ searchParams }: { searchParams: Promise<{ kategori?: string }> }) {
  const { kategori } = await searchParams;

  const [c, categories, tours] = await Promise.all([
    getContent("page.turlar"),
    prisma.tourCategory.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: { _count: { select: { tours: { where: activeTourWhere() } } } },
    }),
    prisma.tour.findMany({
      where: activeTourWhere(kategori ? { category: { slug: kategori } } : {}),
      include: { category: true },
      orderBy: [{ isFeatured: "desc" }, { departureDate: "asc" }],
    }),
  ]);

  // Sadece listelenecek turu olan kategoriler (ve seçili olan) filtrede gösterilir
  const options: FilterOption[] = categories
    .filter((cat) => cat._count.tours > 0 || cat.slug === kategori)
    .map((cat) => ({ label: cat.name, slug: cat.slug, count: cat._count.tours }));

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Ana Sayfa", url: "/" },
          { name: c.title, url: "/turlar" },
        ]}
      />
      <PageHero title={c.title} description={c.description} image={c.image} crumbs={[{ label: "Turlar" }]} />

      <section className="py-16 lg:py-20">
        <div className="container-tr">
          <div className="mb-10">
            <TourFilter options={options} active={kategori} />
          </div>
          <TourGrid tours={tours} />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
