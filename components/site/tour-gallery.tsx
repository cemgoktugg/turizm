"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SmartImage } from "@/components/ui/smart-image";
import { cn } from "@/lib/utils";

export function TourGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const list = images.length ? images : ["/images/logo-mark.svg"];
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-border bg-brand-950 shadow-card">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <SmartImage
              src={list[active]}
              alt={`${title} — görsel ${active + 1}`}
              loading="eager"
              className="size-full"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {list.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {list.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-xl border-2 transition-all",
                i === active
                  ? "border-gold-400 ring-2 ring-gold-200"
                  : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <SmartImage src={img} alt="" className="size-full" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
