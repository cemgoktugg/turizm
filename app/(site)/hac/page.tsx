import type { Metadata } from "next";
import Link from "next/link";
import { MoveRight } from "lucide-react";
import { getTours } from "@/lib/queries";
import { PageHero } from "@/components/site/page-hero";
import { TourGrid } from "@/components/site/tour-grid";
import { CtaBand } from "@/components/site/cta-band";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { buttonVariants } from "@/components/ui/button";
import { HAC_MENASIK } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Hac",
  description:
    "Ömürde bir kez farz olan hac ibadeti için Diyanet uyumlu, tecrübeli kadro ve merkezi otellerle hac programları.",
  alternates: { canonical: "/hac" },
};

export default async function HacPage() {
  const tours = await getTours("hac");

  return (
    <>
      <PageHero
        title="Hac İbadeti"
        description="İslam'ın beş şartından biri olan haccı, huzur ve güven içinde eda etmeniz için yanınızdayız."
        image="/images/kategori-hac.svg"
        crumbs={[{ label: "Hac" }]}
      />

      {/* Giriş */}
      <section className="py-16 lg:py-20">
        <div className="container-tr grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <span className="eyebrow">
              <span className="h-px w-6 bg-current opacity-60" /> Kutsal Vazife
            </span>
            <h2 className="mt-3 font-serif text-3xl font-bold text-brand-900 sm:text-4xl">
              Hayatın en anlamlı yolculuğu
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              Hac, maddî ve bedenî imkânı olan her Müslümana ömründe bir kez farz
              olan büyük bir ibadettir. Arafat vakfesinden ziyaret tavafına kadar
              her menasiki usulüne uygun eda etmeniz için tecrübeli din
              görevlilerimiz ve rehberlerimiz yanınızda olacak.
            </p>
            <p className="mt-3 leading-relaxed text-muted">
              Merkezi oteller, müstakil çadır düzeni ve kesintisiz destek ile hac
              yolculuğunuzu kolaylaştırıyoruz. 2026 sezonu ön kayıtlarımız
              başlamıştır.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/hac/programlari" className={buttonVariants({ variant: "primary" })}>
                Hac Programları <MoveRight className="size-4" />
              </Link>
              <Link href="/hac/dua-ve-vazifeler" className={buttonVariants({ variant: "outline" })}>
                Dua ve Vazifeler
              </Link>
            </div>
          </Reveal>

          <Reveal delay={1}>
            <div className="grid gap-4 sm:grid-cols-2">
              {HAC_MENASIK.slice(0, 4).map((m) => (
                <div key={m.step} className="rounded-2xl border border-border bg-cream-50 p-5">
                  <span className="grid size-9 place-items-center rounded-full bg-gold-400 text-sm font-bold text-brand-950">
                    {m.step}
                  </span>
                  <h3 className="mt-3 font-semibold text-brand-900">{m.title}</h3>
                  <p className="mt-1 text-sm text-muted">{m.text}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Programlar */}
      <section className="bg-cream-50 py-16 lg:py-20">
        <div className="container-tr">
          <SectionHeading
            align="left"
            className="mb-10"
            eyebrow="Programlar"
            title="Hac Programlarımız"
            description="2026 hac sezonu için hazırlanan paketlerimiz."
          />
          <TourGrid tours={tours} emptyText="Hac programları yakında yayınlanacaktır. Ön kayıt için bizimle iletişime geçin." />
        </div>
      </section>

      <CtaBand title="2026 Hac Ön Kaydınızı Yaptırın" description="Kontenjanlar sınırlıdır. Danışmanlarımız ön kayıt sürecinde size yardımcı olacaktır." />
    </>
  );
}
