import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { TourCard, type TourCardData } from "./tour-card";
import { Reveal } from "@/components/ui/reveal";
import { buttonVariants } from "@/components/ui/button";

export function TourGrid({
  tours,
  emptyText = "Bu kategoride şu anda aktif tur bulunmuyor. Lütfen daha sonra tekrar kontrol edin veya bizimle iletişime geçin.",
}: {
  tours: (TourCardData & { id: string })[];
  emptyText?: string;
}) {
  if (!tours.length) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-dashed border-border bg-cream-50 p-10 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-brand-50 text-brand-600">
          <PackageSearch className="size-7" />
        </div>
        <p className="mt-4 text-sm text-muted">{emptyText}</p>
        <Link href="/turlar" className={`${buttonVariants({ variant: "outline", size: "sm" })} mt-5`}>
          Tüm Turlara Göz At
        </Link>
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
