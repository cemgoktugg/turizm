import Link from "next/link";
import { ChevronRight, House } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { getContent } from "@/lib/content";
import { fill } from "@/lib/content/template";
import { Prose } from "@/components/site/prose";

export type LegalKey = "legal.kvkk" | "legal.cookies" | "legal.cancellation";

/** KVKK, çerez politikası, iptal/iade gibi yasal metin sayfaları */
export async function LegalPage({ blockKey }: { blockKey: LegalKey }) {
  const [c, settings, general] = await Promise.all([getContent(blockKey), getSettings(), getContent("ui.general")]);

  // Metindeki yer tutucular Site Ayarları'ndan doldurulur
  const vars = {
    unvan: settings.companyTitle || settings.siteName,
    marka: settings.siteName,
    adres: settings.address,
    telefon: settings.phone,
    eposta: settings.email,
    belgeNo: settings.tursabNo,
  };

  return (
    <>
      <section className="border-b border-border bg-cream-50">
        <div className="container-tr py-10 lg:py-14">
          <nav aria-label="Sayfa yolu" className="flex items-center gap-1.5 text-xs text-muted">
            <Link href="/" className="flex items-center gap-1 hover:text-brand-700">
              <House className="size-3.5" /> {general.breadcrumbHome}
            </Link>
            <ChevronRight className="size-3.5" />
            <span className="font-medium text-brand-800">{c.title}</span>
          </nav>
          <h1 className="mt-4 font-serif text-3xl font-bold text-brand-900 lg:text-4xl">{c.title}</h1>
          {c.description && <p className="mt-2 max-w-2xl text-muted">{c.description}</p>}
          {c.updated && <p className="mt-3 text-xs text-muted">{c.updated}</p>}
        </div>
      </section>
      <section className="py-12 lg:py-16">
        <div className="container-tr max-w-3xl">
          <Prose content={fill(c.content, vars)} />
        </div>
      </section>
    </>
  );
}
