import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { YetkiContent } from "@/components/site/yetki-content";
import { CtaBand } from "@/components/site/cta-band";

export const metadata: Metadata = {
  title: "Hac Yetki Belgeleri",
  description:
    "Hac organizasyonu için TÜRSAB, Diyanet ve IATA yetki belgelerimiz. Güvenle emin ellerdesiniz.",
  alternates: { canonical: "/hac/yetki-belgeleri" },
};

export default function HacYetkiPage() {
  return (
    <>
      <PageHero
        title="Hac Yetki Belgelerimiz"
        description="Hac ibadetinizi resmî yetki belgelerine sahip, güvenilir bir acenta ile gerçekleştirin."
        image="/images/belge-diyanet.svg"
        crumbs={[{ label: "Hac", href: "/hac" }, { label: "Yetki Belgeleri" }]}
      />
      <YetkiContent intro="Rotamız Huzura olarak hac organizasyonlarımızı, resmî kurumlar tarafından verilen yetki belgeleri çerçevesinde yürütüyoruz. TÜRSAB A grubu işletme belgemiz ve Diyanet İşleri Başkanlığı yetkimiz ile misafirlerimize güvenli bir hizmet sunuyoruz." />
      <CtaBand />
    </>
  );
}
