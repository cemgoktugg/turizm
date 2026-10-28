"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { ActionResult } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Durum rozeti gibi görünen, tıklanınca durumu değiştiren buton (Aktif/Pasif, İptal/Geri al) */
export function ToggleButton({
  action,
  id,
  on,
  labels,
  titles,
  confirm,
  variant = "pill",
}: {
  action: (id: string) => Promise<ActionResult>;
  id: number;
  on: boolean;
  labels: { on: string; off: string };
  titles?: { on: string; off: string };
  /** Açıkken kapatmadan önce sorulacak soru */
  confirm?: string;
  variant?: "pill" | "button";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function toggle() {
    if (on && confirm && !window.confirm(confirm)) return;
    start(async () => {
      const res = await action(String(id));
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else toast.error(res.message);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      title={titles ? (on ? titles.on : titles.off) : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold transition disabled:opacity-60",
        variant === "pill"
          ? cn("rounded-full px-3 py-1 text-xs", on ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200")
          : "h-9 rounded-full border border-border bg-white px-4 text-sm text-brand-800 hover:bg-cream-100",
      )}
    >
      {pending && <Loader2 className="size-3.5 animate-spin" />}
      {on ? labels.on : labels.off}
    </button>
  );
}
