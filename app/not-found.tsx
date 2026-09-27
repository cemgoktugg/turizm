import Link from "next/link";
import { Home, Search } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-brand-950 p-6 text-center">
      <SmartImage src="/images/cta-bg.svg" alt="" className="absolute inset-0 size-full opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-950 to-brand-900/50" />
      <div className="relative max-w-md">
        <p className="font-serif text-7xl font-bold text-gold-400">404</p>
        <h1 className="mt-4 font-serif text-2xl font-bold text-white">Sayfa Bulunamadı</h1>
        <p className="mt-3 text-cream-200/70">
          Aradığınız sayfa taşınmış veya kaldırılmış olabilir. Ana sayfaya dönerek
          yolculuğunuza devam edebilirsiniz.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className={buttonVariants({ variant: "gold" })}>
            <Home className="size-4" /> Ana Sayfa
          </Link>
          <Link href="/turlar" className={buttonVariants({ variant: "white" })}>
            <Search className="size-4" /> Turları İncele
          </Link>
        </div>
      </div>
    </div>
  );
}
