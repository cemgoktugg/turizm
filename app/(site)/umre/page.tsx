import { TourListing } from "@/components/site/tour-listing";
import { pageMetadata } from "@/lib/content";
import { UMRE_CATEGORY_SLUGS } from "@/lib/categories";

export const generateMetadata = () => pageMetadata("page.umre");

export default function UmrePage() {
  return <TourListing contentKey="page.umre" categorySlugs={UMRE_CATEGORY_SLUGS} />;
}
