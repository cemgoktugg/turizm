import type { Metadata } from "next";
import { TourListing } from "@/components/site/tour-listing";

export const metadata: Metadata = {
  title: "Lüks Umre Turları",
  description:
    "Harem'e sıfır 5 yıldızlı oteller, VIP transfer ve özel rehberlik ile ayrıcalıklı lüks umre programları.",
  alternates: { canonical: "/umre/luks-umre" },
};

export default function LuksUmrePage() {
  return (
    <TourListing
      title="Lüks Umre"
      description="Konforun zirvesinde bir manevi yolculuk. Harem manzaralı 5 yıldızlı oteller ve VIP hizmet ile ayrıcalıklı umre deneyimi."
      image="/images/kategori-luks.svg"
      crumbs={[{ label: "Umre", href: "/umre" }, { label: "Lüks Umre" }]}
      categorySlugs={["luks-umre"]}
      sectionTitle="Lüks Umre Programları"
      sectionDescription="Harem'e sıfır konaklama ve sınırlı kişi sayısıyla özel kafileler."
    />
  );
}
