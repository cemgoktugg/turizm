"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, ExternalLink, Pencil, Trash2, Loader2, Eye, EyeOff, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/types";

const iconBtn =
  "grid size-9 place-items-center rounded-lg border border-border text-brand-700 transition hover:bg-brand-50 disabled:opacity-50";

export function EditLink({ href }: { href: string }) {
  return (
    <Link href={href} className={iconBtn} aria-label="Düzenle" title="Düzenle">
      <Pencil className="size-4" />
    </Link>
  );
}

/** Kaydı sitede yeni sekmede açar */
export function ViewLink({ href, disabled }: { href: string; disabled?: boolean }) {
  if (disabled) {
    return (
      <span className={cn(iconBtn, "cursor-not-allowed opacity-40")} title="Yayında değil — sitede görünmez">
        <ExternalLink className="size-4" />
      </span>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={iconBtn} aria-label="Sitede gör" title="Sitede gör">
      <ExternalLink className="size-4" />
    </a>
  );
}

export function DeleteButton({
  action,
  id,
  label = "Bu kaydı silmek istediğinize emin misiniz?",
}: {
  action: (id: string) => Promise<ActionResult<unknown>>;
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
      <span className="inline-flex items-center gap-1" title={label}>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : "Sil"}
        </button>
        <button
          type="button"
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
      type="button"
      onClick={() => setConfirming(true)}
      title={label}
      className="grid size-9 place-items-center rounded-lg border border-border text-red-600 transition hover:bg-red-50"
      aria-label="Sil"
    >
      <Trash2 className="size-4" />
    </button>
  );
}

/** Turu kopyalayıp yeni kopyanın düzenleme sayfasına gider */
export function DuplicateButton({
  action,
  id,
  editBase,
}: {
  action: (id: string) => Promise<ActionResult<{ id: string }>>;
  id: string;
  editBase: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await action(id);
          if (res.ok && res.data) {
            toast.success(res.message);
            router.push(`${editBase}/${res.data.id}/edit`);
          } else toast.error(res.message);
        })
      }
      className={iconBtn}
      aria-label="Kopyala"
      title="Kopyala (taslak olarak)"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Copy className="size-4" />}
    </button>
  );
}

export function FlagToggle({
  action,
  id,
  field,
  value,
  labels,
}: {
  action: (id: string, field: "isPublished" | "isFeatured") => Promise<ActionResult>;
  id: string;
  field: "isPublished" | "isFeatured";
  value: boolean;
  labels?: { on: string; off: string };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function toggle() {
    start(async () => {
      const res = await action(id, field);
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else toast.error(res.message);
    });
  }

  const isPub = field === "isPublished";
  const Icon = pending ? Loader2 : isPub ? (value ? Eye : EyeOff) : Star;
  const text = labels
    ? value
      ? labels.on
      : labels.off
    : isPub
      ? value
        ? "Yayında"
        : "Taslak"
      : value
        ? "Öne Çıkan"
        : "Öne Çıkar";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      title={isPub ? (value ? "Yayından kaldırmak için tıklayın" : "Yayına almak için tıklayın") : value ? "Öne çıkanlardan kaldır" : "Ana sayfada öne çıkar"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition",
        value
          ? isPub
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : "bg-gold-100 text-gold-700 hover:bg-gold-200"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200",
      )}
    >
      <Icon className={cn("size-3.5", pending && "animate-spin", !isPub && value && "fill-current")} />
      {text}
    </button>
  );
}
