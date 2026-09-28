"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Uzun içeriği kısaltıp "Devamını oku" ile açar; kısa içerikte buton göstermez */
export function ReadMore({
  children,
  collapsedHeight = 320,
  moreLabel,
  lessLabel,
}: {
  children: React.ReactNode;
  collapsedHeight?: number;
  moreLabel: string;
  lessLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el) setOverflows(el.scrollHeight > collapsedHeight + 40);
  }, [collapsedHeight]);

  const clamped = overflows && !open;

  return (
    <div>
      <div
        ref={ref}
        className={cn("relative", clamped && "overflow-hidden")}
        style={clamped ? { maxHeight: collapsedHeight } : undefined}
      >
        {children}
        {clamped && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />}
      </div>
      {overflows && (
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2 text-sm font-bold text-brand-800 shadow-sm transition hover:bg-cream-50"
          >
            {open ? lessLabel : moreLabel}
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
          </button>
        </div>
      )}
    </div>
  );
}
