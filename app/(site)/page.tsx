import Link from "next/link";
import {
  MoveRight,
  Quote,
  Users,
  CalendarCheck,
  Building2,
  Star,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { WHY_US, PREP_INFO, CATEGORY_ICONS } from "@/lib/constants";
import { HeroSlider } from "@/components/site/hero-slider";
import { TourCard } from "@/components/site/tour-card";
import { HotelCard } from "@/components/site/hotel-card";
import { BlogCard } from "@/components/site/blog-card";
import { CertificateSection } from "@/components/site/certificate-section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { Icon, type IconName } from "@/components/ui/icon";
import { SmartImage } from "@/components/ui/smart-image";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TravelAgencyJsonLd } from "@/components/seo/json-ld";

export default async function HomePage() {
  const settings = await getSettings();

  const [featured, categories, mekke, medine, posts, certificates] =
    await Promise.all([
      prisma.tour.findMany({
        where: { isPublished: true, isFeatured: true },
        include: { category: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.tourCategory.findMany({ orderBy: { order: "asc" } }),
      prisma.hotel.findMany({
        where: { isPublished: true, city: "Mekke" },
        take: 3,
      }),
      prisma.hotel.findMany({
        where: { isPublished: true, city: "Medine" },
        take: 3,
      }),
      prisma.blogPost.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.documentCertificate.findMany({
        where: { isPublished: true },
        orderBy: { order: "asc" },
      }),
    ]);

  const hotels = [...mekke, ...medine];

  return (
    <>
      <TravelAgencyJsonLd settings={settings} />
      <HeroSlider slides={settings.heroSlides} whatsapp={settings.whatsapp} />

      {/* İstatistik şeridi */}
      <section className="border-b border-border bg-white">
        <div className="container-tr grid grid-cols-2 gap-6 py-8 lg:grid-cols-4">
          {[
            { icon: Users, value: "25.000+", label: "Mutlu Misafir" },
            { icon: CalendarCheck, value: "20+ Yıl", label: "Sektör Tecrübesi" },
            { icon: Building2, value: "50+", label: "Anlaşmalı Otel" },
            { icon: Star, value: "4.9/5", label: "Misafir Memnuniyeti" },
          ].map((s, i) => (
            <Reveal key={i} delay={i} className="flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                <s.icon className="size-6" />
              </span>
              <span>
                <span className="block font-serif text-xl font-bold text-brand-900">
                  {s.value}
                </span>
                <span className="text-xs text-muted">{s.label}</span>
              </span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Öne çıkan turlar */}
      <section className="bg-cream-50 py-20">
        <div className="container-tr">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-end">
            <SectionHeading
              align="left"
              eyebrow="Öne Çıkan Programlar"
              title="Sizin İçin Seçtiğimiz Turlar"
              description="En çok tercih edilen hac, umre ve kültür turlarımızı keşfedin."
              className="mx-0"
            />
            <Link
              href="/turlar"
              className={cn(buttonVariants({ variant: "outline" }), "hidden shrink-0 sm:inline-flex")}
            >
              Tüm Turlar <MoveRight className="size-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((tour, i) => (
              <Reveal key={tour.id} delay={i % 3}>
                <TourCard tour={tour} />
              </Reveal>
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link href="/turlar" className={buttonVariants({ variant: "outline" })}>
              Tüm Turlar <MoveRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Kategoriler */}
      <section className="py-20">
        <div className="container-tr">
          <SectionHeading
            eyebrow="Hizmetlerimiz"
            title="Yolculuk Kategorileri"
            description="İhtiyacınıza ve bütçenize en uygun program türünü seçin."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c, i) => (
              <Reveal key={c.id} delay={i % 3}>
                <Link
                  href={
                    c.slug === "hac"
                      ? "/hac"
                      : c.slug === "kultur-turlari"
                        ? "/turlar?kategori=kultur-turlari"
                        : c.slug === "umre"
                          ? "/umre"
                          : `/umre/${c.slug === "luks-umre" ? "luks-umre" : c.slug === "ramazan-umresi" ? "ramazan-umresi" : ""}`
                  }
                  className="group relative flex h-56 flex-col justify-end overflow-hidden rounded-3xl border border-border p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
                >
                  <SmartImage
                    src={c.image}
                    alt={c.name}
                    className="absolute inset-0 size-full transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-950/40 to-transparent" />
                  <div className="relative">
                    <span className="mb-3 grid size-11 place-items-center rounded-xl bg-gold-400 text-brand-950">
                      <Icon name={(CATEGORY_ICONS[c.slug] ?? "Sparkles") as IconName} className="size-5" />
                    </span>
                    <h3 className="font-serif text-xl font-bold text-white">{c.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-cream-100/80">
                      {c.description}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Neden biz */}
      <section className="relative overflow-hidden bg-brand-900 py-20 text-white">
        <SmartImage
          src="/images/cta-bg.svg"
          alt=""
          className="absolute inset-0 size-full opacity-20"
        />
        <div className="container-tr relative">
          <SectionHeading
            light
            eyebrow="Neden Rotamız Huzura?"
            title="Güvenle Emin Ellerdesiniz"
            description="20 yılı aşkın tecrübemizle, manevi yolculuğunuzu en güzel şekilde tamamlamanız için buradayız."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_US.map((f, i) => (
              <Reveal key={f.title} delay={i % 3}>
                <div className="group h-full rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-colors hover:border-gold-400/40 hover:bg-white/10">
                  <span className="grid size-12 place-items-center rounded-2xl bg-gold-400/15 text-gold-300 transition-colors group-hover:bg-gold-400 group-hover:text-brand-950">
                    <Icon name={f.icon as IconName} className="size-6" />
                  </span>
                  <h3 className="mt-4 font-serif text-lg font-bold text-white">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-cream-100/70">
                    {f.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Oteller */}
      <section className="bg-cream-50 py-20">
        <div className="container-tr">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-end">
            <SectionHeading
              align="left"
              eyebrow="Konaklama"
              title="Mekke & Medine Otellerimiz"
              description="Harem-i Şerif ve Mescid-i Nebevi'ye yürüme mesafesindeki seçkin otellerimiz."
              className="mx-0"
            />
            <div className="hidden shrink-0 gap-2 sm:flex">
              <Link href="/oteller/mekke" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Mekke Otelleri
              </Link>
              <Link href="/oteller/medine" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Medine Otelleri
              </Link>
            </div>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hotels.map((h, i) => (
              <Reveal key={h.id} delay={i % 3}>
                <HotelCard hotel={h} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Bilgilendirme */}
      <section className="py-20">
        <div className="container-tr">
          <SectionHeading
            eyebrow="Hazırlık Rehberi"
            title="Yolculuk Öncesi Bilmeniz Gerekenler"
            description="Umre ve hac yolculuğunuza hazırlanırken işinize yarayacak rehber içerikler."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {PREP_INFO.map((p, i) => (
              <Reveal key={p.title} delay={i % 5}>
                <Link
                  href={p.href}
                  className="group flex h-full flex-col rounded-3xl border border-border bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-gold-200 hover:shadow-card"
                >
                  <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-700 group-hover:text-white">
                    <Icon name={p.icon as IconName} className="size-5" />
                  </span>
                  <h3 className="mt-4 font-serif text-base font-bold text-brand-900">
                    {p.title}
                  </h3>
                  <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted">
                    {p.text}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Manevi alıntı */}
      <section className="bg-brand-950 py-16">
        <div className="container-tr">
          <Reveal className="mx-auto max-w-3xl text-center">
            <Quote className="mx-auto size-10 text-gold-400/60" />
            <p className="mt-6 font-serif text-2xl leading-relaxed text-cream-100 sm:text-3xl">
              “Hac ve umre yapanlar Allah'ın misafirleridir. Kendisine dua ederlerse
              dualarını kabul eder, bağışlanma dilerlerse onları bağışlar.”
            </p>
            <p className="mt-5 text-sm font-semibold uppercase tracking-widest text-gold-400">
              Hadis-i Şerif
            </p>
          </Reveal>
        </div>
      </section>

      {/* Blog */}
      {posts.length > 0 && (
        <section className="py-20">
          <div className="container-tr">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-end">
              <SectionHeading
                align="left"
                eyebrow="Blog & Rehber"
                title="Güncel Yazılar"
                description="Hac ve umre hakkında merak ettikleriniz."
                className="mx-0"
              />
              <Link
                href="/blog"
                className={cn(buttonVariants({ variant: "outline" }), "hidden shrink-0 sm:inline-flex")}
              >
                Tüm Yazılar <MoveRight className="size-4" />
              </Link>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {posts.map((p, i) => (
                <Reveal key={p.id} delay={i % 3}>
                  <BlogCard post={p} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Belgeler */}
      <CertificateSection certificates={certificates} />
    </>
  );
}
