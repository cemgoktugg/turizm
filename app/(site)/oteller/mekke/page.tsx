import type { Metadata } from "next";
import { HotelsCity } from "@/components/site/hotels-city";

export const metadata: Metadata = {
  title: "Mekke Otelleri",
  description:
    "Harem-i Şerif'e yürüme mesafesindeki Mekke otellerimiz. Konfor, temizlik ve merkezi konum.",
  alternates: { canonical: "/oteller/mekke" },
};

export default function MekkeOtelleriPage() {
  return (
    <HotelsCity
      city="Mekke"
      title="Mekke Otelleri"
      description="Mescid-i Haram'a yürüme mesafesinde, konforlu ve merkezi Mekke otelleri."
      image="/images/otel-mekke-3.svg"
    />
  );
}
