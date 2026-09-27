import type { Metadata } from "next";
import { TourListing } from "@/components/site/tour-listing";

export const metadata: Metadata = {
  title: "Kesin Tarihli Umre Turları",
  description:
    "Gidiş-dönüş tarihleri kesinleşmiş, kayıtları açık umre turları. Yerinizi hemen ayırtın.",
  alternates: { canonical: "/umre/kesin-tarihli-turlar" },
};

export default function KesinTarihliPage() {
  return (
    <TourListing
      title="Kesin Tarihli Umre Turları"
      description="Tarihleri belli, kontenjanı sınırlı ve kayıtları açık umre programlarımız. Planınızı bugünden netleştirin."
      image="/images/tur-20-gun-umre.svg"
      crumbs={[{ label: "Umre", href: "/umre" }, { label: "Kesin Tarihli Turlar" }]}
      categorySlugs={["umre", "luks-umre", "ramazan-umresi"]}
      requireDate
      sectionTitle="Tarihi Belli Programlar"
      sectionDescription="Aşağıdaki turlarda gidiş tarihi kesinleşmiştir. Kontenjanlar sınırlıdır."
    />
  );
}
