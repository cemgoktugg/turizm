"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Clock, MapPin, Plus, X } from "lucide-react";
import { fill } from "@/lib/content/template";
import { cn } from "@/lib/utils";

export type ProgramDay = {
  dayNumber: number;
  title: string;
  description: string;
  time?: string | null;
  place?: string | null;
  /** Gidiş tarihinden hesaplanan gün tarihi (ör. "8 Kasım Pazar") */
  dateLabel?: string | null;
};

/** Numaralı zaman çizelgesi üzerinde açılır-kapanır gün kartları */
export function DayProgram({ days, dayFormat }: { days: ProgramDay[]; dayFormat: string }) {
  const [open, setOpen] = useState<number | null>(days[0]?.dayNumber ?? null);

  return (
    <ol className="relative space-y-3">
      {/* Dikey çizgi */}
      <span className="absolute bottom-5 left-[15px] top-5 w-0.5 bg-brand-100" aria-hidden />
      {days.map((d) => {
        const isOpen = open === d.dayNumber;
        const meta = [
          d.dateLabel && { icon: CalendarDays, text: d.dateLabel },
          d.time && { icon: Clock, text: d.time },
          d.place && { icon: MapPin, text: d.place },
        ].filter(Boolean) as { icon: typeof Clock; text: string }[];
        const hasBody = meta.length > 0 || Boolean(d.description);

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
                onClick={() => hasBody && setOpen(isOpen ? null : d.dayNumber)}
                aria-expanded={hasBody ? isOpen : undefined}
                className={cn("flex w-full items-center gap-3 px-4 py-3.5 text-left sm:px-5", !hasBody && "cursor-default")}
              >
                <span className="min-w-0 flex-1">
                  <span className={cn("font-serif text-base font-bold", isOpen ? "text-white" : "text-brand-900")}>
                    {fill(dayFormat, { gun: d.dayNumber })}:
                  </span>{" "}
                  <span className={cn("text-sm", isOpen ? "font-semibold text-gold-200" : "text-muted")}>{d.title}</span>
                </span>
                {d.time && !isOpen && (
                  <span className="hidden shrink-0 items-center gap-1 rounded-full bg-cream-100 px-2.5 py-1 text-xs font-semibold text-brand-800 sm:inline-flex">
                    <Clock className="size-3.5" /> {d.time}
                  </span>
                )}
                {hasBody && (
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full transition-colors",
                      isOpen ? "bg-white/15 text-white" : "bg-cream-100 text-brand-800",
                    )}
                  >
                    {isOpen ? <X className="size-4" /> : <Plus className="size-4" />}
                  </span>
                )}
              </button>
              <AnimatePresence initial={false}>
                {isOpen && hasBody && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2.5 px-4 pb-4 sm:px-5">
                      {meta.length > 0 && (
                        <ul className="flex flex-wrap gap-2">
                          {meta.map(({ icon: Icon, text }) => (
                            <li
                              key={text}
                              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-cream-100"
                            >
                              <Icon className="size-3.5 text-gold-200" /> {text}
                            </li>
                          ))}
                        </ul>
                      )}
                      {d.description && (
                        <p className="whitespace-pre-line text-sm leading-relaxed text-cream-100/90">{d.description}</p>
                      )}
                    </div>
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
