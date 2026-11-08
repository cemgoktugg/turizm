"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, Eye, Loader2, MoreHorizontal, Pencil, ReceiptText, RotateCcw, Trash2 } from "lucide-react";
import { deleteSale, toggleSaleCancel } from "@/app/actions/sales";
import { receiptHref } from "@/lib/sales-base";
import { cn } from "@/lib/utils";

const MENU_WIDTH = 240;
/** Menüde gösterilen en fazla makbuz (en yeniler); fazlası satış detayında */
const MAX_RECEIPTS = 4;

/**
 * Satış listesindeki "⋯" menüsü: Detay, Makbuzlar, Düzenle, İptal Et / Geri Al, Sil.
 * Tablo yatay kaydırmalı ve sütun sabit (sticky) olduğundan menü body'ye
 * açılır ve konumu butona göre hesaplanır; kaydırınca kapanır.
 */
export function SaleRowMenu({
  id,
  isCancelled,
  hasPayments,
  receipts,
  detailHref,
  editHref,
}: {
  id: number;
  isCancelled: boolean;
  /** Tahsilatı olan satış silinemez (yalnızca iptal edilebilir) */
  hasPayments: boolean;
  /** Tahsilat / iade kayıtları (eskiden yeniye); her biri için makbuz bağlantısı */
  receipts: { id: number; label: string; date: string }[];
  detailHref: string;
  editHref: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [pending, start] = useTransition();
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Menü butonun altına, sağ kenarı hizalı; ekranın altına taşarsa üstüne açılır
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const h = menuRef.current?.offsetHeight ?? 180;
    const below = r.bottom + 6 + h <= window.innerHeight;
    setPos({ top: below ? r.bottom + 6 : r.top - 6 - h, left: Math.max(8, r.right - MENU_WIDTH) });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !btnRef.current?.contains(t)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        btnRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  function run(action: (id: string) => Promise<{ ok: boolean; message: string }>, question: string) {
    setOpen(false);
    if (!window.confirm(question)) return;
    start(async () => {
      const res = await action(String(id));
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else toast.error(res.message);
    });
  }

  const shown = receipts.slice(-MAX_RECEIPTS).reverse();
  const item = "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm font-medium text-brand-900 hover:bg-cream-50";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Satış #${id} işlemleri`}
        title="İşlemler"
        className={cn(
          "grid size-9 place-items-center rounded-lg border border-border text-brand-700 transition hover:bg-brand-50 disabled:opacity-50",
          open && "bg-brand-50",
        )}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: MENU_WIDTH }}
            className="fixed z-50 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-card"
          >
            <Link href={detailHref} scroll={false} role="menuitem" className={item} onClick={() => setOpen(false)}>
              <Eye className="size-4 text-muted" /> Detay / Tahsilat
            </Link>
            {shown.length > 0 && (
              <>
                <div className="my-1 border-t border-border" />
                {shown.map((r) => (
                  <Link key={r.id} href={receiptHref(r.id)} role="menuitem" className={cn(item, "items-start")} onClick={() => setOpen(false)}>
                    <ReceiptText className="mt-0.5 size-4 shrink-0 text-brand-600" />
                    <span className="min-w-0">
                      {r.label}
                      <span className="block text-xs font-normal text-muted tabular-nums">{r.date}</span>
                    </span>
                  </Link>
                ))}
                {receipts.length > MAX_RECEIPTS && (
                  <p className="px-3.5 pb-1 text-xs text-muted">Diğer {receipts.length - MAX_RECEIPTS} makbuz satış detayında.</p>
                )}
                <div className="my-1 border-t border-border" />
              </>
            )}
            <Link href={editHref} role="menuitem" className={item} onClick={() => setOpen(false)}>
              <Pencil className="size-4 text-muted" /> Düzenle
            </Link>
            <button
              type="button"
              role="menuitem"
              className={item}
              onClick={() =>
                run(
                  toggleSaleCancel,
                  isCancelled
                    ? `Satış #${id} iptali geri alınsın mı?`
                    : `Satış #${id} iptal edilsin mi? İptal edilen satış toplamlara ve müşteri bakiyesine girmez. Alınan para varsa satış sayfasından iadesini kaydedin.`,
                )
              }
            >
              {isCancelled ? <RotateCcw className="size-4 text-muted" /> : <Ban className="size-4 text-amber-600" />}
              {isCancelled ? "İptali Geri Al" : "İptal Et"}
            </button>
            <div className="my-1 border-t border-border" />
            {/* Sil her zaman görünür; tahsilatı olan satışta pasif ve sebebi yazılı */}
            <button
              type="button"
              role="menuitem"
              disabled={hasPayments}
              title={hasPayments ? "Tahsilatı olan satış silinemez; iptal edebilirsiniz." : undefined}
              className={cn(item, "items-start text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300 disabled:hover:bg-transparent")}
              onClick={() => run(deleteSale, `Satış #${id} kalıcı olarak silinsin mi? Bu işlem geri alınamaz.`)}
            >
              <Trash2 className="mt-0.5 size-4 shrink-0" />
              <span>
                Sil
                {hasPayments && <span className="block text-xs font-normal text-muted">Tahsilatı var; silinemez, iptal edebilirsiniz.</span>}
              </span>
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
