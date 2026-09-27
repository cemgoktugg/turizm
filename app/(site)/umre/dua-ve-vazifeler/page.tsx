import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { MenasikContent } from "@/components/site/menasik-content";
import { CtaBand } from "@/components/site/cta-band";
import { UMRE_MENASIK } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Umre Dua ve Vazifeler",
  description:
    "Umrenin nasıl yapıldığı, menasiki ve okunacak dualar. İhram, tavaf, sa'y ve tıraş adımları.",
  alternates: { canonical: "/umre/dua-ve-vazifeler" },
};

export default function UmreDuaPage() {
  return (
    <>
      <PageHero
        title="Umre Dua ve Vazifeler"
        description="Umrenin adımlarını ve okunacak duaları öğrenerek ibadetinize hazırlanın."
        image="/images/kategori-umre.svg"
        crumbs={[{ label: "Umre", href: "/umre" }, { label: "Dua ve Vazifeler" }]}
      />
      <MenasikContent
        steps={UMRE_MENASIK}
        stepsTitle="Umre Menasiki — Adım Adım"
        stepsEyebrow="Menasik"
      />
      <CtaBand />
    </>
  );
}
