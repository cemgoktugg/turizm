import { TourListing } from "@/components/site/tour-listing";
import { pageMetadata } from "@/lib/content";

export const generateMetadata = () => pageMetadata("page.umre-ramazan");

export default function RamazanUmresiPage() {
  return (
    <TourListing
      contentKey="page.umre-ramazan"
      parent={{ key: "page.umre", href: "/umre" }}
      categorySlugs={["ramazan-umresi"]}
    />
  );
}
