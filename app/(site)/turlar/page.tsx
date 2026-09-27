import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/site/page-hero";
import { TourFilter, type FilterOption } from "@/components/site/tour-filter";
import { TourGrid } from "@/components/site/tour-grid";
import { CtaBand } from "@/components/site/cta-band";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Tüm Turlar",
  description:
    "Hac, umre, lüks umre, Ramazan umresi ve kültür turlarının tamamı. Kategoriye göre filtreleyin.",
  alternates: { canonical: "/turlar" },
};

export default async function TurlarPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { kategori } = await searchParams;

  const categories = await prisma.tourCategory.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { tours: { where: { isPublished: true } } } } },
  });

  const options: FilterOption[] = categories.map((c) => ({
    label: c.name,
    slug: c.slug,
    count: c._count.tours,
  }));

  const where: Prisma.TourWhereInput = { isPublished: true };
  if (kategori) where.category = { slug: kategori };

  const tours = await prisma.tour.findMany({
    where,
    include: { category: true },
    orderBy: [{ isFeatured: "desc" }, { departureDate: "asc" }],
  });

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Ana Sayfa", url: "/" },
          { name: "Turlar", url: "/turlar" },
        ]}
      />
      <PageHero
        title="Tüm Turlarımız"
        description="Hac ve umreden kültür turlarına, tüm programlarımızı tek bir yerde inceleyin."
        image="/images/hero-2.svg"
        crumbs={[{ label: "Turlar" }]}
      />

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
