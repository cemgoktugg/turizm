"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, CircleHelp, Clock, FileText, ListChecks, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  overview: FileText,
  dates: CalendarDays,
  services: ListChecks,
  program: Clock,
  faq: CircleHelp,
  reviews: Star,
} as const;

export type SectionKey = keyof typeof ICONS;

/** Bölümlere atlayan, kaydırmayla aktif bölümü vurgulayan yapışkan menü */
export function SectionNav({ items }: { items: { id: string; key: SectionKey; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => Boolean(el));
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-190px 0px -55% 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [items]);

  // Mobilde aktif sekmeyi görünür tut
  useEffect(() => {
    const el = bar.current?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    el?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active]);

  if (items.length < 2) return null;

  return (
    <div className="sticky top-16 z-30 -mx-5 bg-cream-50/95 px-5 py-3 backdrop-blur lg:top-[120px] lg:mx-0 lg:px-0">
      <div
        ref={bar}
        className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-white p-1.5 shadow-soft [scrollbar-width:none] lg:justify-between"
      >
        {items.map((item) => {
          const Icon = ICONS[item.key];
          const isActive = active === item.id;
          return (
            <a
              key={item.id}
              data-id={item.id}
              href={`#${item.id}`}
              onClick={() => setActive(item.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors lg:flex-1 lg:justify-center",
                isActive ? "bg-brand-800 text-white" : "text-brand-800 hover:bg-cream-100",
              )}
            >
              <Icon className="size-4" /> {item.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}
