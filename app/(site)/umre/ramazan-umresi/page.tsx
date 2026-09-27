import type { Metadata } from "next";
import { TourListing } from "@/components/site/tour-listing";

export const metadata: Metadata = {
  title: "Ramazan Umresi",
  description:
    "Ramazan'ın bereketinde, mukabele ve iftar programları eşliğinde unutulmaz umre. Sevabı kat kat artan bir fırsat.",
  alternates: { canonical: "/umre/ramazan-umresi" },
};

export default function RamazanUmresiPage() {
  return (
    <TourListing
      title="Ramazan Umresi"
      description="Ramazan ayında yapılan umrenin sevabı kat kat artar. Teravih, mukabele ve iftar organizasyonları ile Ramazan'ı kutsal topraklarda idrak edin."
      image="/images/kategori-ramazan.svg"
      crumbs={[{ label: "Umre", href: "/umre" }, { label: "Ramazan Umresi" }]}
      categorySlugs={["ramazan-umresi"]}
      sectionTitle="Ramazan Umresi Programları"
      sectionDescription="Ramazan'ın manevi ikliminde, özel programlarla düzenlenen umre turları."
    />
  );
}
