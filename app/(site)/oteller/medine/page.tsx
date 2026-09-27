import type { Metadata } from "next";
import { HotelsCity } from "@/components/site/hotels-city";

export const metadata: Metadata = {
  title: "Medine Otelleri",
  description:
    "Mescid-i Nebevi'ye yakın Medine otellerimiz. Ravza-i Mutahhara'ya yürüme mesafesinde konaklama.",
  alternates: { canonical: "/oteller/medine" },
};

export default function MedineOtelleriPage() {
  return (
    <HotelsCity
      city="Medine"
      title="Medine Otelleri"
      description="Mescid-i Nebevi ve Ravza-i Mutahhara'ya yakın, huzurlu Medine otelleri."
      image="/images/otel-medine-3.svg"
    />
  );
}
