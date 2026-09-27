import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { YetkiContent } from "@/components/site/yetki-content";
import { CtaBand } from "@/components/site/cta-band";

export const metadata: Metadata = {
  title: "Umre Yetki Belgeleri",
  description:
    "Umre organizasyonu için TÜRSAB, Diyanet ve IATA yetki belgelerimiz. Şeffaf ve güvenilir hizmet.",
  alternates: { canonical: "/umre/yetki-belgeleri" },
};

export default function UmreYetkiPage() {
  return (
    <>
      <PageHero
        title="Umre Yetki Belgelerimiz"
        description="Umre programlarımızı resmî yetki belgeleri ile düzenliyor, güveninize layık olmak için çalışıyoruz."
        image="/images/belge-tursab.svg"
        crumbs={[{ label: "Umre", href: "/umre" }, { label: "Yetki Belgeleri" }]}
      />
      <YetkiContent intro="Umre organizasyonlarımız TÜRSAB A grubu işletme belgesi ve Diyanet İşleri Başkanlığı yetkisi ile yürütülmektedir. Tüm süreçlerimiz şeffaf, güvenli ve mevzuata uygun şekilde gerçekleştirilir." />
      <CtaBand />
    </>
  );
}
