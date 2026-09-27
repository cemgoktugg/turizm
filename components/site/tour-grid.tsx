import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { TourCard, type TourCardData } from "./tour-card";
import { Reveal } from "@/components/ui/reveal";
import { buttonVariants } from "@/components/ui/button";
import { getContent } from "@/lib/content";

export async function TourGrid({
  tours,
  emptyText,
}: {
  tours: (TourCardData & { id: string })[];
  emptyText?: string;
}) {
  if (!tours.length) {
    const { list } = await getContent("ui.tours");
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-dashed border-border bg-cream-50 p-10 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-brand-50 text-brand-600">
          <PackageSearch className="size-7" />
        </div>
        <p className="mt-4 text-sm text-muted">{emptyText || list.emptyText}</p>
        {list.emptyButton && (
          <Link href="/turlar" className={`${buttonVariants({ variant: "outline", size: "sm" })} mt-5`}>
            {list.emptyButton}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {tours.map((tour, i) => (
        <Reveal key={tour.id} delay={i % 3}>
          <TourCard tour={tour} />
        </Reveal>
      ))}
    </div>
  );
}
