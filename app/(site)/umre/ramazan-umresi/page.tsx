import { TourListing } from "@/components/site/tour-listing";
import { pageMetadata } from "@/lib/content";

export const generateMetadata = () => pageMetadata("page.umre-ramazan");

export default function RamazanUmresiPage() {
  return (
    <TourListing
      contentKey="page.umre-ramazan"
      crumbs={[{ label: "Umre", href: "/umre" }, { label: "Ramazan Umresi" }]}
      categorySlugs={["ramazan-umresi"]}
    />
  );
}
