"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, MoveRight, Star } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { buttonVariants } from "@/components/ui/button";
import { whatsappLink } from "@/lib/settings";
import { cn } from "@/lib/utils";

const SLIDE_TEXT = [
  { title: "Rotamız Huzura", sub: "Yetkili acenta güvencesiyle, manevi ve konforlu hac & umre yolculukları." },
  { title: "Kutsal Topraklara", sub: "Harem'e sıfır oteller, tecrübeli rehberlik ve unutulmaz bir manevi deneyim." },
  { title: "Huzurun Adresi", sub: "2026 sezonu hac ve umre programlarında kesin kayıtlar başladı." },
];

export function HeroSlider({
  slides,
  whatsapp,
}: {
  slides: string[];
  whatsapp: string;
}) {
  const [index, setIndex] = useState(0);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => clearInterval(id);
  }, [count]);

  const text = SLIDE_TEXT[index % SLIDE_TEXT.length];

  return (
    <section className="relative h-[88vh] min-h-[560px] w-full overflow-hidden bg-brand-950">
      {/* Slaytlar */}
      <AnimatePresence mode="sync">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <SmartImage
            src={slides[index]}
            alt="Rotamız Huzura"
            loading="eager"
            className="size-full"
          />
        </motion.div>
      </AnimatePresence>

      {/* Karartma */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-950/85 via-brand-950/55 to-brand-950/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-950/70 via-transparent to-brand-950/20" />

      {/* İçerik */}
      <div className="container-tr relative flex h-full flex-col justify-center">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold-300 backdrop-blur"
          >
            <Star className="size-3.5 fill-gold-400 text-gold-400" />
            TÜRSAB & Diyanet Yetki Belgeli
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.h1
              key={`t-${index}`}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5 }}
              className="mt-6 font-serif text-4xl font-bold leading-[1.05] text-white sm:text-6xl lg:text-7xl"
            >
              {text.title}
            </motion.h1>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.p
              key={`s-${index}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mt-5 max-w-xl text-base leading-relaxed text-cream-100/85 sm:text-lg"
            >
              {text.sub}
            </motion.p>
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Link href="/umre" className={buttonVariants({ variant: "gold", size: "lg" })}>
              Umre Turlarını İncele <MoveRight className="size-5" />
            </Link>
            <Link
              href="/hac/programlari"
              className={buttonVariants({ variant: "white", size: "lg" })}
            >
              Hac Programları
            </Link>
            <a
              href={whatsappLink(whatsapp, "Merhaba, hac/umre programları hakkında bilgi almak istiyorum.")}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "border border-white/30 bg-white/5 text-white backdrop-blur hover:bg-white/15 hover:text-white",
              )}
            >
              <MessageCircle className="size-5" /> WhatsApp'tan Bilgi Al
            </a>
          </motion.div>
        </div>
      </div>

      {/* Göstergeler */}
      {count > 1 && (
        <div className="absolute bottom-8 left-0 right-0">
          <div className="container-tr flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Slayt ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === index ? "w-10 bg-gold-400" : "w-4 bg-white/40 hover:bg-white/60",
                )}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
