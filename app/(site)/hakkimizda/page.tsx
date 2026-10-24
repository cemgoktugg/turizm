import { getSettings } from "@/lib/settings";
import { getContent, pageMetadata } from "@/lib/content";
import { PageHero } from "@/components/site/page-hero";
import { CertificateSection } from "@/components/site/certificate-section";
import { CtaBand } from "@/components/site/cta-band";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { SmartImage } from "@/components/ui/smart-image";
import { Icon } from "@/components/ui/icon";
import Link from "next/link";
import { MoveRight } from "lucide-react";
import { TeamGrid } from "@/components/site/team-grid";
import { visibleMembers } from "@/lib/team";
import { buttonVariants } from "@/components/ui/button";

export const generateMetadata = () => pageMetadata("page.hakkimizda");

export default async function HakkimizdaPage() {
  const [settings, c, features, team] = await Promise.all([
    getSettings(),
    getContent("page.hakkimizda"),
    getContent("home.features"),
    getContent("page.ekibimiz"),
  ]);
  const members = visibleMembers(team.members);

  return (
    <>
      <PageHero title={c.title} description={c.description} image={c.image} crumbs={[{ label: c.crumb }]} />

      {/* Hikaye */}
      <section className="py-16 lg:py-20">
        <div className="container-tr grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="relative">
              <div className="overflow-hidden rounded-3xl border border-border shadow-card">
                <SmartImage src={c.storyImage} alt={settings.siteName} sizes="(min-width: 1024px) 600px, 100vw" className="aspect-[4/3] w-full" />
              </div>
              {c.badgeValue && (
                <div className="absolute -bottom-6 -right-4 hidden rounded-2xl bg-gold-400 px-6 py-4 text-center shadow-gold sm:block">
                  <span className="block font-serif text-3xl font-bold text-brand-950">{c.badgeValue}</span>
                  <span className="text-xs font-semibold text-brand-900">{c.badgeLabel}</span>
                </div>
              )}
            </div>
          </Reveal>

          <Reveal delay={1}>
            {c.storyEyebrow && (
              <span className="eyebrow">
                <span className="h-px w-6 bg-current opacity-60" /> {c.storyEyebrow}
              </span>
            )}
            <h2 className="mt-3 font-serif text-3xl font-bold text-brand-900 sm:text-4xl">{c.storyTitle || settings.siteName}</h2>
            {c.storyParagraphs.map((p, i) => (
              <p key={i} className={i === 0 ? "mt-4 leading-relaxed text-muted" : "mt-3 leading-relaxed text-muted"}>
                {p}
              </p>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Misyon Vizyon Değer */}
      {c.values.length > 0 && (
        <section className="bg-cream-100 py-16 lg:py-20">
          <div className="container-tr grid gap-6 md:grid-cols-3">
            {c.values.map((v, i) => (
              <Reveal key={i} delay={i}>
                <div className="h-full rounded-3xl border border-border bg-white p-8 shadow-soft">
                  <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                    <Icon name={v.icon} className="size-6" />
                  </span>
                  <h3 className="mt-4 font-serif text-xl font-bold text-brand-900">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{v.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Neden biz */}
      {features.items.length > 0 && (
        <section className="py-16 lg:py-20">
          <div className="container-tr">
            <SectionHeading eyebrow={c.featuresEyebrow} title={c.featuresTitle} />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.items.map((f, i) => (
                <Reveal key={i} delay={i % 3}>
                  <div className="flex h-full gap-4 rounded-3xl border border-border bg-white p-6 shadow-soft">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gold-100 text-gold-700">
                      <Icon name={f.icon} className="size-5" />
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
      )}

      {/* Ekip (panelden kişi eklenince görünür) */}
      {members.length > 0 && (
        <section className="py-16 lg:py-20">
          <div className="container-tr">
            <SectionHeading title={team.aboutTitle} description={team.description} />
            <div className="mt-10">
              <TeamGrid members={members.slice(0, 4)} compact />
            </div>
            {team.aboutButton && (
              <div className="mt-10 text-center">
                <Link href="/ekibimiz" className={buttonVariants({ variant: "outline" })}>
                  {team.aboutButton} <MoveRight className="size-4" />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      <CertificateSection />
      <CtaBand />
    </>
  );
}
