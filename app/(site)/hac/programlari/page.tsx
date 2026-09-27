import { TourListing } from "@/components/site/tour-listing";
import { pageMetadata } from "@/lib/content";

export const generateMetadata = () => pageMetadata("page.hac-programlari");

export default function HacProgramlariPage() {
  return (
    <TourListing
      contentKey="page.hac-programlari"
      crumbs={[{ label: "Hac", href: "/hac" }, { label: "Hac Programları" }]}
      categorySlugs={["hac"]}
    />
  );
}
