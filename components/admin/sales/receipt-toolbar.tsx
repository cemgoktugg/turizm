"use client";

import { useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Copy, Printer } from "lucide-react";
import { receiptHref } from "@/lib/sales-base";

/** Makbuz ve sözleşme sayfalarının üst çubuğu (çıktıda görünmez) */
export function ReceiptToolbar({
  backHref,
  backLabel,
  copiesHref,
  single,
  docName = "makbuzu",
  autoPrint,
}: {
  backHref: string;
  backLabel: string;
  /** Tek nüsha ↔ iki nüsha geçişi (yalnızca makbuzda) */
  copiesHref?: string;
  single?: boolean;
  /** Yazdırma ipucunda geçen belge adı */
  docName?: string;
  autoPrint?: boolean;
}) {
  useEffect(() => {
    if (!autoPrint) return;
    // Logo yüklensin diye kısa bir gecikmeyle yazdırma penceresini aç
    const t = window.setTimeout(() => window.print(), 600);
    return () => window.clearTimeout(t);
  }, [autoPrint]);

  return (
    <div className="mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-3 print:hidden">
      <Link href={backHref} scroll={false} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-gold-600">
        <ArrowLeft className="size-4" /> {backLabel}
      </Link>
      <div className="flex flex-wrap gap-2">
        {copiesHref && (
          <Link
            href={copiesHref}
            replace
            scroll={false}
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-white px-4 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
          >
            <Copy className="size-4" /> {single ? "İki nüsha yap" : "Tek nüsha yap"}
          </Link>
        )}
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand-700 px-5 text-sm font-semibold text-white transition hover:bg-brand-800"
        >
          <Printer className="size-4" /> Yazdır
        </button>
      </div>
      <p className="w-full text-xs text-muted">
        Yazdırma penceresinde hedef olarak &quot;PDF olarak kaydet&quot;i seçerseniz {docName} müşteriye WhatsApp&apos;tan da gönderebilirsiniz.
      </p>
    </div>
  );
}

/**
 * Tahsilat kaydedildi bildirimi; tahsilat varsa yanında "Makbuz Yazdır" düğmesi
 * (makbuz sayfası açılır ve yazdırma penceresi gelir).
 */
export function toastWithReceipt(message: string, paymentId: number | undefined, open: (href: string) => void) {
  if (!paymentId) return void toast.success(message);
  toast.success(message, {
    duration: 12000,
    action: { label: "Makbuz Yazdır", onClick: () => open(receiptHref(paymentId, true)) },
  });
}
