import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { MenasikContent } from "@/components/site/menasik-content";
import { CtaBand } from "@/components/site/cta-band";
import { HAC_MENASIK } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Hac Dua ve Vazifeler",
  description:
    "Haccın farzları, vacipleri, sünnetleri ve menasiki. İhram, Arafat vakfesi, şeytan taşlama ve okunacak dualar.",
  alternates: { canonical: "/hac/dua-ve-vazifeler" },
};

const VAZIFELER = [
  {
    title: "Farzlar",
    items: ["İhrama girmek (şart)", "Arafat'ta vakfe yapmak", "Ziyaret (ifada) tavafı"],
  },
  {
    title: "Vacipler",
    items: ["Müzdelife vakfesi", "Şeytan taşlama (cemre)", "Sa'y", "Tıraş / kısaltma", "Veda tavafı"],
  },
  {
    title: "Sünnetler",
    items: ["Kudüm tavafı", "Hutbeler", "Mina'da gecelemek", "Telbiye, tekbir ve dualar"],
  },
];

export default function HacDuaPage() {
  return (
    <>
      <PageHero
        title="Hac Dua ve Vazifeler"
        description="Haccın menasikini adım adım öğrenin; farz, vacip ve sünnetleri ile okunacak duaları keşfedin."
        image="/images/kategori-hac.svg"
        crumbs={[{ label: "Hac", href: "/hac" }, { label: "Dua ve Vazifeler" }]}
      />
      <MenasikContent
        steps={HAC_MENASIK}
        stepsTitle="Hac Menasiki — Adım Adım"
        stepsEyebrow="Menasik"
        vazifeler={VAZIFELER}
      />
      <CtaBand />
    </>
  );
}
