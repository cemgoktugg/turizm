import { prisma } from "@/lib/prisma";
import { activeTourWhere } from "@/lib/queries";
import { getContent, pageMetadata } from "@/lib/content";
import { getTryRates } from "@/lib/exchange";
import {
  buildFilterChoices,
  dominantCurrency,
  filterTours,
  filtersToQuery,
  parseTourFilters,
  sortTours,
} from "@/lib/tour-search";
import { PageHero } from "@/components/site/page-hero";
import { TourFilter, type FilterOption } from "@/components/site/tour-filter";
import { TourSearchBar } from "@/components/site/tour-search-bar";
import { TourGrid } from "@/components/site/tour-grid";
import { CtaBand } from "@/components/site/cta-band";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const generateMetadata = () => pageMetadata("page.turlar");

export default async function TurlarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseTourFilters(await searchParams);
  const { kategori } = filters;

  const [c, ui, tourUi, categories, allTours, rates] = await Promise.all([
    getContent("page.turlar"),
    getContent("ui.general"),
    getContent("ui.tours"),
    prisma.tourCategory.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: { _count: { select: { tours: { where: activeTourWhere() } } } },
    }),
    prisma.tour.findMany({ where: activeTourWhere(), include: { category: true } }),
    getTryRates(),
  ]);

  const currency = dominantCurrency(allTours);
  // Kategori dışındaki filtrelere uyan turlar: kategori sayıları bundan hesaplanır
  const matched = filterTours(allTours, filters, rates, currency);
  const tours = sortTours(kategori ? matched.filter((t) => t.category.slug === kategori) : matched, filters.sirala, rates);
  const inCategory = kategori ? allTours.filter((t) => t.category.slug === kategori) : allTours;
  const choices = buildFilterChoices(inCategory, rates, currency, tourUi.list.budgetFormat, filters);

  // Sadece listelenecek turu olan kategoriler (ve seçili olan) filtrede gösterilir
  const options: FilterOption[] = categories
    .filter((cat) => cat._count.tours > 0 || cat.slug === kategori)
    .map((cat) => ({ label: cat.name, slug: cat.slug, count: matched.filter((t) => t.categoryId === cat.id).length }));

  const hasSearch = Boolean(filters.q || filters.ay || filters.sure || filters.kalkis || filters.butce);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: ui.breadcrumbHome, url: "/" },
          { name: c.crumb, url: "/turlar" },
        ]}
      />
      <PageHero title={c.title} description={c.description} image={c.image} crumbs={[{ label: c.crumb }]} />

      <section className="py-12 lg:py-16">
        <div className="container-tr">
          <div className="mb-10 space-y-4">
            <TourSearchBar filters={filters} choices={choices} labels={tourUi.list} resultCount={tours.length} />
            <TourFilter options={options} active={kategori} query={filtersToQuery({ ...filters, kategori: undefined })} />
          </div>
          <TourGrid tours={tours} emptyText={hasSearch ? tourUi.list.noResults : undefined} />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
