"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, ExternalLink, Link2, Link2Off, Loader2, RefreshCw, Smartphone } from "lucide-react";
import { disableGuideLink, renewGuideLink } from "@/app/actions/rooming";
import type { ActionResult } from "@/lib/types";

/**
 * Odalama sayfasında görevli bağlantısı: görevli giriş yapmadan odaları görür, isim arar,
 * otelin verdiği oda numaralarını yazar (fiyat, ödeme, T.C. görünmez).
 */
export function GuideLinkCard({ tourId, tourName, url }: { tourId: number; tourName: string; url: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function run(fn: () => Promise<ActionResult<unknown>>, question?: string) {
    if (question && !window.confirm(question)) return;
    start(async () => {
      const res = await fn();
      if (!res.ok) return void toast.error(res.message);
      toast.success(res.message);
      router.refresh();
    });
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Bağlantı kopyalandı.");
    } catch {
      toast.error("Kopyalanamadı; bağlantıyı seçip elle kopyalayın.");
    }
  }

  const whatsapp = url ? `https://wa.me/?text=${encodeURIComponent(`${tourName} oda listesi (görevli):\n${url}`)}` : "";
  const btn = "inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-brand-800 hover:bg-cream-100 disabled:opacity-50";

  return (
    <div className="mb-5 rounded-2xl border border-border bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Smartphone className="mt-0.5 size-5 shrink-0 text-brand-700" />
          <div className="min-w-0">
            <p className="font-semibold text-brand-900">Görevli bağlantısı</p>
            <p className="text-xs text-muted">
              Görevli giriş yapmadan odaları görür, isimle arar ve otelin verdiği oda numaralarını yazar. Fiyat, ödeme ve T.C. görünmez.
            </p>
          </div>
        </div>
        {url ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Görevli bağlantısı"
              className="h-9 w-full min-w-0 rounded-xl border border-border bg-cream-50 px-3 text-xs text-brand-900 sm:w-72"
            />
            <button type="button" onClick={copy} className={btn}>
              <Copy className="size-4" /> Kopyala
            </button>
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={`${btn} border-[#25D366] text-[#128C7E]`}>
              WhatsApp
            </a>
            <a href={url} target="_blank" rel="noopener noreferrer" className={btn} title="Görevlinin göreceği ekranı aç">
              <ExternalLink className="size-4" /> Aç
            </a>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => renewGuideLink(tourId), "Yeni bağlantı oluşturulacak; eski bağlantı artık açılmayacak. Devam edilsin mi?")}
              className={btn}
              title="Bağlantıyı yenile (eskisi çalışmaz)"
            >
              <RefreshCw className="size-4" /> Yenile
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => disableGuideLink(tourId), "Görevli bağlantısı kapatılsın mı? Bağlantı artık açılmayacak.")}
              className={`${btn} text-red-600 hover:bg-red-50`}
            >
              <Link2Off className="size-4" /> Kapat
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => renewGuideLink(tourId))}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />} Bağlantı oluştur
          </button>
        )}
      </div>
    </div>
  );
}
