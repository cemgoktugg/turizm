import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { getCertificates } from "@/lib/queries";
import { PageHero } from "@/components/site/page-hero";
import { CertificateSection } from "@/components/site/certificate-section";
import { CtaBand } from "@/components/site/cta-band";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { SmartImage } from "@/components/ui/smart-image";
import { Icon, type IconName } from "@/components/ui/icon";
import { WHY_US } from "@/lib/constants";
import { Target, Eye, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description:
    "Rotamız Huzura; TÜRSAB ve Diyanet yetki belgeli, 20 yılı aşkın tecrübesiyle hac, umre ve kültür turları düzenleyen premium seyahat acentası.",
  alternates: { canonical: "/hakkimizda" },
};

export default async function HakkimizdaPage() {
  const [settings, certificates] = await Promise.all([
    getSettings(),
    getCertificates(),
  ]);

  return (
    <>
      <PageHero
        title="Hakkımızda"
        description="Manevi yolculuğunuzu bir emanet olarak görüyor, güven ve samimiyetle hizmet veriyoruz."
        image="/images/about.svg"
        crumbs={[{ label: "Hakkımızda" }]}
      />

      {/* Hikaye */}
      <section className="py-16 lg:py-20">
        <div className="container-tr grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="relative">
              <div className="overflow-hidden rounded-3xl border border-border shadow-card">
                <SmartImage src="/images/about.svg" alt={settings.siteName} className="aspect-[4/3] w-full" />
              </div>
              <div className="absolute -bottom-6 -right-4 hidden rounded-2xl bg-gold-400 px-6 py-4 text-center shadow-gold sm:block">
                <span className="block font-serif text-3xl font-bold text-brand-950">20+</span>
                <span className="text-xs font-semibold text-brand-900">Yıllık Tecrübe</span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={1}>
            <span className="eyebrow">
              <span className="h-px w-6 bg-current opacity-60" /> Biz Kimiz?
            </span>
            <h2 className="mt-3 font-serif text-3xl font-bold text-brand-900 sm:text-4xl">
              {settings.siteName}
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              {settings.siteName}, 20 yılı aşkın süredir hac, umre ve kültür turları
              alanında hizmet veren, TÜRSAB ve Diyanet İşleri Başkanlığı yetki
              belgelerine sahip bir seyahat acentasıdır. Her misafirimizin kutsal
              yolculuğunu bir emanet bilinciyle titizlikle organize ediyoruz.
            </p>
            <p className="mt-3 leading-relaxed text-muted">
              Merkezi oteller, tecrübeli din görevlileri, şeffaf fiyat politikası ve
              7/24 destek anlayışımızla, ibadetinize huzur içinde odaklanmanızı
              sağlıyoruz. Bugüne kadar 25.000'den fazla misafirimizi kutsal
              topraklarla buluşturmanın mutluluğunu yaşadık.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Misyon Vizyon Değer */}
      <section className="bg-cream-100 py-16 lg:py-20">
        <div className="container-tr grid gap-6 md:grid-cols-3">
          {[
            { icon: Target, title: "Misyonumuz", text: "Her misafirimizin manevi yolculuğunu güven, konfor ve huzur içinde tamamlamasını sağlamak." },
            { icon: Eye, title: "Vizyonumuz", text: "Hac ve umre organizasyonunda kalite ve güvenin öncü markası olmak." },
            { icon: Heart, title: "Değerlerimiz", text: "Samimiyet, şeffaflık, emanet bilinci ve misafir memnuniyeti." },
          ].map((v, i) => (
            <Reveal key={v.title} delay={i}>
              <div className="h-full rounded-3xl border border-border bg-white p-8 shadow-soft">
                <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                  <v.icon className="size-6" />
                </span>
                <h3 className="mt-4 font-serif text-xl font-bold text-brand-900">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{v.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Neden biz */}
      <section className="py-16 lg:py-20">
        <div className="container-tr">
          <SectionHeading eyebrow="Farkımız" title="Neden Bizi Tercih Etmelisiniz?" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_US.map((f, i) => (
              <Reveal key={f.title} delay={i % 3}>
                <div className="flex h-full gap-4 rounded-3xl border border-border bg-white p-6 shadow-soft">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gold-100 text-gold-700">
                    <Icon name={f.icon as IconName} className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-serif text-base font-bold text-brand-900">{f.title}</h3>
                    <p className="mt-1 text-sm text-muted">{f.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CertificateSection certificates={certificates} />
      <CtaBand />
    </>
  );
}
