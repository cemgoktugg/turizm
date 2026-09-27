import Link from "next/link";
import { MessageCircle, MoveRight } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { buttonVariants } from "@/components/ui/button";
import { getSettings, whatsappLink } from "@/lib/settings";
import { getContent } from "@/lib/content";

/** Sayfa altı çağrı bandı — metinler "Ortak Bölümler › Çağrı Bandı"ndan, sayfa özelinde başlık verilebilir */
export async function CtaBand({ title, description }: { title?: string; description?: string }) {
  const [settings, cta] = await Promise.all([getSettings(), getContent("shared.cta")]);
  return (
    <section className="py-20">
      <div className="container-tr">
        <div className="relative overflow-hidden rounded-3xl bg-brand-900 px-6 py-14 text-center shadow-card sm:px-12">
          <SmartImage src={cta.image} alt="" className="absolute inset-0 size-full opacity-25" fallback="/images/cta-bg.svg" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-950/80 to-brand-900/40" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-serif text-3xl font-bold text-white text-balance sm:text-4xl">{title || cta.title}</h2>
            <p className="mt-4 text-cream-100/80">{description || cta.description}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/rezervasyon" className={buttonVariants({ variant: "gold", size: "lg" })}>
                {cta.primaryLabel || "Rezervasyon Yap"} <MoveRight className="size-5" />
              </Link>
              <a
                href={whatsappLink(settings.whatsapp, "Merhaba, bilgi almak istiyorum.")}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "whatsapp", size: "lg" })}
              >
                <MessageCircle className="size-5" /> {cta.whatsappLabel || "WhatsApp'tan Yazın"}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
