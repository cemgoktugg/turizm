"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, StickyNote } from "lucide-react";
import { LEAD_STATUSES } from "@/lib/validations";
import { updateLeadNote, updateLeadStatus } from "@/app/actions/leads";
import { cn } from "@/lib/utils";

export function LeadStatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    start(async () => {
      const res = await updateLeadStatus(id, next);
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <select
      value={status}
      onChange={onChange}
      disabled={pending}
      aria-label="Başvuru durumu"
      className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-50"
    >
      {LEAD_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

/** Başvuruya iç not (yalnızca panelde görünür) */
export function LeadNote({ id, note }: { id: string; note: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(note ?? "");
  const [pending, start] = useTransition();
  const dirty = value.trim() !== (note ?? "").trim();

  function save() {
    start(async () => {
      const res = await updateLeadNote(id, value);
      if (res.ok) {
        toast.success(res.message);
        setOpen(false);
        router.refresh();
      } else toast.error(res.message);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "mt-2 flex max-w-xs items-start gap-1.5 rounded-lg px-2 py-1 text-left text-xs transition",
          note ? "bg-amber-50 text-amber-900 hover:bg-amber-100" : "text-muted hover:bg-cream-100 hover:text-brand-700",
        )}
      >
        <StickyNote className="mt-0.5 size-3.5 shrink-0" />
        <span className="line-clamp-2">{note || "Not ekle"}</span>
      </button>
    );
  }

  return (
    <div className="mt-2 max-w-xs">
      <textarea
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Görüşme notu, teklif detayı..."
        className="w-full rounded-lg border border-border bg-white px-2.5 py-2 text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
      <div className="mt-1 flex gap-1.5">
        <button
          type="button"
          onClick={save}
          disabled={pending || !dirty}
          className="inline-flex items-center gap-1 rounded-lg bg-brand-700 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />} Kaydet
        </button>
        <button
          type="button"
          onClick={() => {
            setValue(note ?? "");
            setOpen(false);
          }}
          className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-brand-700"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}
