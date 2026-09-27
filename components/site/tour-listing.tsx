import { prisma } from "@/lib/prisma";
import { PageHero, type Crumb } from "./page-hero";
import { TourGrid } from "./tour-grid";
import { CtaBand } from "./cta-band";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Prisma } from "@prisma/client";

export async function TourListing({
  title,
  description,
  image,
  crumbs,
  categorySlugs,
  requireDate = false,
  sectionTitle,
  sectionDescription,
  intro,
}: {
  title: string;
  description?: string;
  image?: string;
  crumbs?: Crumb[];
  categorySlugs?: string[];
  requireDate?: boolean;
  sectionTitle?: string;
  sectionDescription?: string;
  intro?: React.ReactNode;
}) {
  const where: Prisma.TourWhereInput = { isPublished: true };
  if (categorySlugs?.length) {
    where.category = { slug: { in: categorySlugs } };
  }
  if (requireDate) {
    where.departureDate = { not: null };
  }

  const tours = await prisma.tour.findMany({
    where,
    include: { category: true },
    orderBy: [{ isFeatured: "desc" }, { departureDate: "asc" }],
  });

  return (
    <>
      <PageHero title={title} description={description} image={image} crumbs={crumbs} />

      <section className="py-16 lg:py-20">
        <div className="container-tr">
          {intro}
          {sectionTitle && (
            <SectionHeading
              className="mb-10"
              align="left"
              title={sectionTitle}
              description={sectionDescription}
            />
          )}
          <TourGrid tours={tours} />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
