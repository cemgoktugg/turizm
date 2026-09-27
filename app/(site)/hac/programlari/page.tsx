import type { Metadata } from "next";
import { TourListing } from "@/components/site/tour-listing";

export const metadata: Metadata = {
  title: "Hac Programları",
  description:
    "2026 hac sezonu ön kayıtları başladı. Diyanet uyumlu, tecrübeli kadro ve merkezi otellerle hac programları.",
  alternates: { canonical: "/hac/programlari" },
};

export default function HacProgramlariPage() {
  return (
    <TourListing
      title="Hac Programları"
      description="Ömürde bir kez farz olan hac ibadetini huzur içinde eda etmeniz için özenle hazırlanmış programlarımız."
      image="/images/kategori-hac.svg"
      crumbs={[{ label: "Hac", href: "/hac" }, { label: "Hac Programları" }]}
      categorySlugs={["hac"]}
      sectionTitle="2026 Hac Programları"
      sectionDescription="Kontenjanlar sınırlıdır. Ön kayıt için danışmanlarımızla iletişime geçin."
    />
  );
}
