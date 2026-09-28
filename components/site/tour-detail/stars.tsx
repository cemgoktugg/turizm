import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** 0-5 arası dolu / boş yıldızlar */
export function Stars({ value, className }: { value: number; className?: string }) {
  const rounded = Math.round(value);
  return (
    <span className={cn("inline-flex gap-0.5", className)} aria-label={`5 üzerinden ${value}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn("size-4", n <= rounded ? "fill-gold-400 text-gold-400" : "fill-slate-200 text-slate-200")} />
      ))}
    </span>
  );
}
