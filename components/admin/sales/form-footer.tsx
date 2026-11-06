"use client";

import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Satış modülü formlarının altta sabit kaydet / iptal çubuğu */
export function FormFooter({
  cancelHref,
  submitting,
  label,
  keepScroll = false,
}: {
  cancelHref: string;
  submitting: boolean;
  label: string;
  /** Yan panelde: İptal arkadaki listenin kaydırma konumunu korur */
  keepScroll?: boolean;
}) {
  const router = useRouter();
  return (
    <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-end gap-3 border-t border-border bg-cream-100/95 px-4 py-4 backdrop-blur lg:-mx-8 lg:px-8">
      <Button type="button" variant="ghost" onClick={() => router.push(cancelHref, { scroll: !keepScroll })}>
        İptal
      </Button>
      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
        {label}
      </Button>
    </div>
  );
}
