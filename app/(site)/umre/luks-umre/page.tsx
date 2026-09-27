import { TourListing } from "@/components/site/tour-listing";
import { pageMetadata } from "@/lib/content";

export const generateMetadata = () => pageMetadata("page.umre-luks");

export default function LuksUmrePage() {
  return (
    <TourListing
      contentKey="page.umre-luks"
      crumbs={[{ label: "Umre", href: "/umre" }, { label: "Lüks Umre" }]}
      categorySlugs={["luks-umre"]}
    />
  );
}
