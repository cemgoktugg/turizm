import type { Metadata } from "next";
import { TourListing } from "@/components/site/tour-listing";

export const metadata: Metadata = {
  title: "Umre Turları",
  description:
    "Ekonomik, standart ve lüks umre programları. Merkezi oteller, tecrübeli rehberlik ve şeffaf fiyatlarla kesin kayıtlı umre turları.",
  alternates: { canonical: "/umre" },
};

export default function UmrePage() {
  return (
    <TourListing
      title="Umre Turları"
      description="Bütçenize ve tercihinize uygun, yıl boyunca farklı tarihlerde düzenlenen umre programlarımızı keşfedin."
      image="/images/kategori-umre.svg"
      crumbs={[{ label: "Umre" }]}
      categorySlugs={["umre", "luks-umre", "ramazan-umresi"]}
      sectionTitle="Tüm Umre Programları"
      sectionDescription="Aşağıdaki programlardan size en uygun olanı seçin veya danışmanlarımızdan destek alın."
    />
  );
}
