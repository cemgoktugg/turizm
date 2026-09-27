import { TourListing } from "@/components/site/tour-listing";
import { pageMetadata } from "@/lib/content";

export const generateMetadata = () => pageMetadata("page.umre-luks");

export default function LuksUmrePage() {
  return (
    <TourListing
      contentKey="page.umre-luks"
      parent={{ key: "page.umre", href: "/umre" }}
      categorySlugs={["luks-umre"]}
    />
  );
}
