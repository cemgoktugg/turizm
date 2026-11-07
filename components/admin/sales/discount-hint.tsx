import { AlertTriangle } from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import { DISCOUNT_WARN_RATE, discountOf, percent } from "@/lib/sale-pricing";

/**
 * Ücret alanının altındaki satır: "Liste 1.690 $ · İndirim 140 $ (%8,3)".
 * İndirim %10'u geçerse sarı uyarı olur; kaydı engellemez.
 */
export function DiscountHint({
  listPrice,
  price,
  currency,
  className,
}: {
  listPrice: number | null | undefined;
  price: number | null | undefined;
  currency: string;
  className?: string;
}) {
  if (listPrice == null) return null;
  const fmt = (v: number) => formatPrice(v, currency, "0");
  const d = discountOf(listPrice, price);
  return (
    <p className={cn("mt-1 text-xs", d?.warn ? "font-semibold text-amber-700" : "text-muted", className)}>
      {d?.warn && <AlertTriangle className="mr-1 inline size-3.5 -translate-y-px" />}
      Liste {fmt(listPrice)}
      {d && (
        <>
          {" · "}İndirim {fmt(d.amount)} ({percent(d.rate)})
          {d.warn && ` · %${DISCOUNT_WARN_RATE * 100} üstü indirim`}
        </>
      )}
    </p>
  );
}
