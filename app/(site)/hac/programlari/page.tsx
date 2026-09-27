import { TourListing } from "@/components/site/tour-listing";
import { pageMetadata } from "@/lib/content";

export const generateMetadata = () => pageMetadata("page.hac-programlari");

export default function HacProgramlariPage() {
  return (
    <TourListing
      contentKey="page.hac-programlari"
      parent={{ key: "page.hac", href: "/hac" }}
      categorySlugs={["hac"]}
    />
  );
}
