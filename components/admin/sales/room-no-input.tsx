"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import type { ActionResult } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Otelin verdiği oda numarası (Mekke / Medine): yazıp alandan çıkınca ya da Enter'a
 * basınca kaydedilir. Odalama sayfasında ve görevli ekranında ortak.
 */
export function RoomNoInput({
  label,
  value,
  onSave,
  big,
}: {
  label: string;
  value: string | null | undefined;
  onSave: (value: string) => Promise<ActionResult>;
  /** Görevli ekranı: telefonda büyük alan */
  big?: boolean;
}) {
  const [text, setText] = useState(value ?? "");
  const [saved, setSaved] = useState(value ?? "");
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();

  function save() {
    const v = text.trim();
    if (v === saved) return;
    start(async () => {
      const res = await onSave(v);
      if (!res.ok) {
        toast.error(res.message);
        setText(saved);
        return;
      }
      setSaved(v);
      setText(v);
      setOk(true);
      window.setTimeout(() => setOk(false), 1500);
    });
  }

  return (
    <label className={cn("flex min-w-0 flex-1 items-center gap-1.5", big ? "text-sm" : "text-[11px]")} onClick={(e) => e.stopPropagation()}>
      <span className="shrink-0 font-semibold text-muted">{label}</span>
      <span className="relative min-w-0 flex-1">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          inputMode="text"
          maxLength={12}
          placeholder="—"
          aria-label={`${label} oda no`}
          className={cn(
            "w-full rounded-lg border border-border bg-white font-semibold text-brand-900 tabular-nums placeholder:text-muted/50 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100",
            big ? "h-11 px-3 pr-8 text-base" : "h-7 px-2 pr-6 text-xs",
          )}
        />
        {(pending || ok) && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">
            {pending ? <Loader2 className="size-3.5 animate-spin text-muted" /> : <Check className="size-3.5 text-green-600" />}
          </span>
        )}
      </span>
    </label>
  );
}
