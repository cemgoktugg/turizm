import { TourListing } from "@/components/site/tour-listing";
import { pageMetadata } from "@/lib/content";
import { UMRE_CATEGORY_SLUGS } from "@/lib/categories";

export const generateMetadata = () => pageMetadata("page.umre-kesin");

export default function KesinTarihliPage() {
  return (
    <TourListing
      contentKey="page.umre-kesin"
      crumbs={[{ label: "Umre", href: "/umre" }, { label: "Kesin Tarihli Turlar" }]}
      categorySlugs={UMRE_CATEGORY_SLUGS}
      requireDate
    />
  );
}
