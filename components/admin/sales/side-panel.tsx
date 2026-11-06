"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Maximize2, X } from "lucide-react";

/**
 * Satış listesinin üstünde sağdan açılan panel (?panel=...). Liste arkada
 * kalır; panel kapanınca filtreler ve kaydırma konumu korunur.
 * Esc / arka plana tıklama da kapatır; panelde yazılmış ama kaydedilmemiş bir
 * şey varsa önce sorar.
 */
export function SidePanel({
  title,
  closeHref,
  fullHref,
  children,
}: {
  title: string;
  closeHref: string;
  /** "Tam sayfa" bağlantısı */
  fullHref?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const dirty = useRef(false);

  const close = useCallback(() => {
    if (dirty.current && !window.confirm("Kaydedilmemiş bilgiler kaybolacak. Panel kapatılsın mı?")) return;
    router.push(closeHref, { scroll: false });
  }, [closeHref, router]);

  useEffect(() => {
    panelRef.current?.focus();
    // Panel açıkken arkadaki liste kaymasın
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 animate-[fade-in_150ms_ease-out] bg-brand-950/40 backdrop-blur-[2px]" onClick={close} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        // Yazılan her şey "kaydedilmemiş" sayılır; gönderilince sıfırlanır
        onInput={() => (dirty.current = true)}
        onSubmit={() => (dirty.current = false)}
        className="relative flex h-full w-full max-w-2xl animate-[slide-in_200ms_ease-out] flex-col bg-cream-100 shadow-2xl outline-none"
      >
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-white px-4 lg:px-8">
          <p id={titleId} className="flex-1 truncate font-serif text-lg font-bold text-brand-900">
            {title}
          </p>
          {fullHref && (
            <Link
              href={fullHref}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-brand-700 hover:bg-cream-100"
              title="Tam sayfada aç"
            >
              <Maximize2 className="size-4" /> <span className="hidden sm:inline">Tam sayfa</span>
            </Link>
          )}
          <button
            type="button"
            onClick={close}
            className="grid size-9 place-items-center rounded-xl text-brand-800 hover:bg-cream-100"
            aria-label="Kapat (Esc)"
            title="Kapat (Esc)"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
