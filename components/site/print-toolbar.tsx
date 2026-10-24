"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Printer } from "lucide-react";

/** Yazdırılabilir program sayfasının üst çubuğu (çıktıda görünmez) */
export function PrintToolbar({
  backHref,
  shareHref,
  labels,
  autoPrint,
}: {
  backHref: string;
  shareHref: string;
  labels: { printButton: string; shareButton: string; backButton: string; hint: string };
  autoPrint?: boolean;
}) {
  useEffect(() => {
    if (!autoPrint) return;
    // Görseller yüklensin diye kısa bir gecikmeyle yazdırma penceresini aç
    const t = window.setTimeout(() => window.print(), 600);
    return () => window.clearTimeout(t);
  }, [autoPrint]);

  return (
    <div className="sticky top-0 z-10 border-b border-border bg-cream-50/95 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-gold-600">
          <ArrowLeft className="size-4" /> {labels.backButton}
        </Link>
        <div className="flex flex-wrap gap-2">
          <a
            href={shareHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#25D366] px-4 text-sm font-semibold text-[#1eb955] transition hover:bg-[#25D366] hover:text-white"
          >
            <MessageCircle className="size-4" /> {labels.shareButton}
          </a>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand-700 px-5 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            <Printer className="size-4" /> {labels.printButton}
          </button>
        </div>
        {labels.hint && <p className="w-full text-xs text-muted">{labels.hint}</p>}
      </div>
    </div>
  );
}
