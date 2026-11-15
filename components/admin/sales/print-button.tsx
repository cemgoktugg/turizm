"use client";

import { Printer } from "lucide-react";

/** Sayfayı yazdırır (çıktıda görünmez) */
export function PrintButton({ label = "Yazdır" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 print:hidden"
    >
      <Printer className="size-4" /> {label}
    </button>
  );
}
