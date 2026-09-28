"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { fill } from "@/lib/content/template";
import { cn } from "@/lib/utils";

type Day = { dayNumber: number; title: string; description: string };

/** Numaralı zaman çizelgesi üzerinde açılır-kapanır gün kartları */
export function DayProgram({ days, dayFormat }: { days: Day[]; dayFormat: string }) {
  const [open, setOpen] = useState<number | null>(days[0]?.dayNumber ?? null);

  return (
    <ol className="relative space-y-3">
      {/* Dikey çizgi */}
      <span className="absolute bottom-5 left-[15px] top-5 w-0.5 bg-brand-100" aria-hidden />
      {days.map((d) => {
        const isOpen = open === d.dayNumber;
        return (
          <li key={d.dayNumber} className="relative flex gap-3 sm:gap-4">
            <span
              className={cn(
                "relative z-10 mt-3 grid size-8 shrink-0 place-items-center rounded-full border-2 text-xs font-bold transition-colors",
                isOpen ? "border-brand-800 bg-brand-800 text-white" : "border-brand-100 bg-white text-brand-700",
              )}
            >
              {d.dayNumber}
            </span>
            <div
              className={cn(
                "min-w-0 flex-1 overflow-hidden rounded-2xl border transition-colors",
                isOpen ? "border-brand-800 bg-brand-800 text-white shadow-card" : "border-border bg-white hover:border-brand-200",
              )}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : d.dayNumber)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left sm:px-5"
              >
                <span className="min-w-0 flex-1">
                  <span className={cn("font-serif text-base font-bold", isOpen ? "text-white" : "text-brand-900")}>
                    {fill(dayFormat, { gun: d.dayNumber })}:
                  </span>{" "}
                  <span className={cn("text-sm", isOpen ? "font-semibold text-gold-200" : "text-muted")}>{d.title}</span>
                </span>
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full transition-colors",
                    isOpen ? "bg-white/15 text-white" : "bg-cream-100 text-brand-800",
                  )}
                >
                  {isOpen ? <X className="size-4" /> : <Plus className="size-4" />}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="whitespace-pre-line px-4 pb-4 text-sm leading-relaxed text-cream-100/90 sm:px-5">
                      {d.description}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
