"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Loader2, Eye, EyeOff, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/app/actions/leads";

export function EditLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="grid size-9 place-items-center rounded-lg border border-border text-brand-700 transition hover:bg-brand-50"
      aria-label="Düzenle"
    >
      <Pencil className="size-4" />
    </Link>
  );
}

export function DeleteButton({
  action,
  id,
  label = "Bu kaydı silmek istediğinize emin misiniz?",
}: {
  action: (id: string) => Promise<ActionResult>;
  id: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleDelete() {
    start(async () => {
      const res = await action(id);
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
      setConfirming(false);
    });
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={pending}
          className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : "Sil"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-brand-700"
        >
          Vazgeç
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      title={label}
      className="grid size-9 place-items-center rounded-lg border border-border text-red-600 transition hover:bg-red-50"
      aria-label="Sil"
    >
      <Trash2 className="size-4" />
    </button>
  );
}

export function FlagToggle({
  action,
  id,
  field,
  value,
}: {
  action: (id: string, field: "isPublished" | "isFeatured") => Promise<ActionResult>;
  id: string;
  field: "isPublished" | "isFeatured";
  value: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function toggle() {
    start(async () => {
      const res = await action(id, field);
      if (res.ok) router.refresh();
      else toast.error(res.message);
    });
  }

  const isPub = field === "isPublished";
  const Icon = pending ? Loader2 : isPub ? (value ? Eye : EyeOff) : Star;

  return (
    <button
      onClick={toggle}
      disabled={pending}
      title={isPub ? (value ? "Yayında" : "Pasif") : value ? "Öne çıkan" : "Normal"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition",
        value
          ? isPub
            ? "bg-green-100 text-green-700"
            : "bg-gold-100 text-gold-700"
          : "bg-slate-100 text-slate-500",
      )}
    >
      <Icon className={cn("size-3.5", pending && "animate-spin")} />
      {isPub ? (value ? "Yayında" : "Pasif") : value ? "Öne Çıkan" : "Öne Çıkar"}
    </button>
  );
}
