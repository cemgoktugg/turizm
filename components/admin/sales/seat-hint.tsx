import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { FEW_SEATS, seatsLeft } from "@/lib/capacity";

/**
 * Tur seçiminin altındaki doluluk satırı: "13 boş yer · 45 kişilik kontenjan".
 * adding: kaydedilecek kişi sayısı; boş yerden fazlaysa kırmızı olur (sunucu da kaydı engeller).
 * Düzenlemede tur değişmediyse 0 verilir (satış zaten yer kaplıyor).
 */
export function SeatHint({ capacity, sold, adding = 1, className }: { capacity: number | null; sold: number; adding?: number; className?: string }) {
  const left = seatsLeft(capacity, sold);
  if (left == null) return null;
  const blocked = adding > left;
  const few = left <= FEW_SEATS;
  const full = `Kontenjan dolu (${sold}/${capacity} kişi)`;
  const text = blocked
    ? left <= 0
      ? `${full}; yeni satış yapılamaz`
      : `${left} boş yer var; ${adding} kişi eklenemez`
    : left <= 0
      ? full
      : `${few ? "Son " : ""}${left} boş yer · ${capacity} kişilik kontenjan`;
  return (
    <p className={cn("mt-1 text-xs", blocked ? "font-semibold text-red-600" : few ? "font-semibold text-amber-700" : "text-muted", className)}>
      {(blocked || few) && <AlertTriangle className="mr-1 inline size-3.5 -translate-y-px" />}
      {text}
    </p>
  );
}

/** Tur listesindeki doluluk çubuğu (kontenjan girilmiş turlarda) */
export function SeatBar({ capacity, sold }: { capacity: number; sold: number }) {
  const left = capacity - sold;
  const ratio = Math.min(sold / capacity, 1);
  return (
    <div className="mx-auto mt-1 w-20">
      <div className="h-1.5 overflow-hidden rounded-full bg-cream-200">
        <div
          className={cn("h-full rounded-full", left <= 0 ? "bg-red-500" : left <= FEW_SEATS ? "bg-amber-500" : "bg-green-600")}
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
      <p className={cn("mt-0.5 text-[11px] font-semibold", left <= 0 ? "text-red-600" : left <= FEW_SEATS ? "text-amber-700" : "text-muted")}>
        {left <= 0 ? "Dolu" : `${left} boş`}
      </p>
    </div>
  );
}
