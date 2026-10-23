"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, ImageOff, Loader2, Search, Trash2, Upload, X } from "lucide-react";
import { deleteMedia, getMediaUsage, updateMediaAlt, type MediaItem } from "@/app/actions/media";
import type { MediaUsage } from "@/lib/media-types";
import { SmartImage } from "@/components/ui/smart-image";
import { MediaThumb } from "@/components/ui/media-thumb";
import { isVideoUrl } from "@/lib/media-types";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { cn, formatDate } from "@/lib/utils";
import { AdminCard } from "./ui";
import { ACCEPT_MEDIA, formatBytes, uploadFiles } from "./upload";

export function MediaManager({ items }: { items: MediaItem[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [over, setOver] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = items.find((i) => i.id === selectedId) ?? null;

  async function upload(files: File[]) {
    if (!files.length) return;
    setUploading(true);
    const res = await uploadFiles(files, "media");
    setUploading(false);
    res.errors.forEach((e) => toast.error(e));
    if (res.files.length) {
      toast.success(`${res.files.length} dosya yüklendi.`);
      router.refresh();
    }
  }

  const q = query.trim().toLocaleLowerCase("tr");
  const filtered = q ? items.filter((i) => i.originalName.toLocaleLowerCase("tr").includes(q) || (i.alt ?? "").toLocaleLowerCase("tr").includes(q)) : items;
  const totalSize = items.reduce((s, i) => s + i.size, 0);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div>
        {/* Yükleme alanı */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            void upload(Array.from(e.dataTransfer.files));
          }}
          className={cn(
            "mb-5 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition",
            over ? "border-brand-500 bg-brand-50" : "border-border bg-white",
          )}
        >
          {uploading ? (
            <Loader2 className="size-8 animate-spin text-brand-700" />
          ) : (
            <Upload className="size-8 text-brand-300" />
          )}
          <div>
            <p className="font-semibold text-brand-900">Görselleri veya videoları buraya sürükleyip bırakın</p>
            <p className="text-xs text-muted">
              Görsel: JPG, PNG, WEBP, GIF, AVIF · en fazla 10 MB (otomatik küçültülüp WEBP&apos;ye çevrilir)
              <br />
              Video: MP4, MOV veya WEBM · en fazla 50 MB · hikayeler için dikey, 15-30 saniyelik klipler önerilir
            </p>
          </div>
          <Button type="button" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload className="size-4" /> Dosya Seç
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT_MEDIA}
            multiple
            hidden
            onChange={(e) => {
              void upload(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            {items.length} dosya · toplam {formatBytes(totalSize)}
          </p>
          <div className="relative sm:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Dosya adı veya açıklama ara" className="h-10 py-2 pl-9" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center text-sm text-muted">
            <ImageOff className="mx-auto mb-2 size-8 text-brand-300" />
            {items.length ? "Aramaya uygun dosya yok." : "Henüz dosya yüklenmemiş."}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedId(m.id)}
                className={cn(
                  "overflow-hidden rounded-xl border-2 bg-white text-left transition",
                  selectedId === m.id ? "border-brand-600 ring-2 ring-brand-200" : "border-border hover:border-brand-300",
                )}
              >
                <div className="aspect-[4/3] bg-brand-950/5">
                  <MediaThumb src={m.url} alt={m.alt ?? m.originalName} className="size-full" />
                </div>
                <div className="px-2.5 py-2">
                  <p className="truncate text-xs font-semibold text-brand-900">{m.originalName}</p>
                  <p className="text-[11px] text-muted">
                    {m.width ? `${m.width}×${m.height} · ` : ""}
                    {formatBytes(m.size)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detay paneli */}
      <div className="xl:sticky xl:top-24 xl:h-fit">
        {selected ? (
          <MediaDetail key={selected.id} item={selected} onClose={() => setSelectedId(null)} />
        ) : (
          <AdminCard className="p-6 text-center text-sm text-muted">
            Ayrıntılarını görmek, bağlantısını kopyalamak veya silmek için bir dosya seçin.
          </AdminCard>
        )}
      </div>
    </div>
  );
}

function MediaDetail({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  const router = useRouter();
  const [alt, setAlt] = useState(item.alt ?? "");
  const [usage, setUsage] = useState<MediaUsage[] | null>(null);
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    void getMediaUsage(item.url).then((res) => {
      if (alive) setUsage(res.data ?? []);
    });
    return () => {
      alive = false;
    };
  }, [item.url]);

  function copy() {
    void navigator.clipboard.writeText(item.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <AdminCard className="overflow-hidden">
      <div className="relative bg-brand-950">
        {isVideoUrl(item.url) ? (
          <video src={item.url} controls playsInline preload="metadata" className="max-h-72 w-full bg-black" />
        ) : (
          <SmartImage src={item.url} alt={item.alt ?? ""} className="max-h-72 w-full object-contain" />
        )}
        <button type="button" onClick={onClose} className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-white/90 text-brand-900" aria-label="Kapat">
          <X className="size-4" />
        </button>
      </div>
      <div className="space-y-4 p-5">
        <div>
          <p className="break-all font-semibold text-brand-900">{item.originalName}</p>
          <p className="text-xs text-muted">
            {item.width ? `${item.width}×${item.height} px · ` : ""}
            {formatBytes(item.size)} · {formatDate(item.createdAt)}
          </p>
        </div>

        <div className="flex gap-2">
          <Input readOnly value={item.url} className="h-10 py-2 font-mono text-xs" onFocus={(e) => e.target.select()} />
          <Button type="button" variant="outline" size="sm" className="h-10 shrink-0" onClick={copy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </div>

        <Field label="Açıklama (alt metin)">
          <div className="flex gap-2">
            <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Görselde ne var?" className="h-10 py-2" />
            <Button
              type="button"
              size="sm"
              className="h-10 shrink-0"
              disabled={saving || alt === (item.alt ?? "")}
              onClick={() =>
                startSave(async () => {
                  const res = await updateMediaAlt(item.id, alt);
                  if (res.ok) {
                    toast.success(res.message);
                    router.refresh();
                  } else toast.error(res.message);
                })
              }
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Kaydet"}
            </Button>
          </div>
        </Field>

        <div>
          <p className="mb-1.5 text-sm font-semibold text-brand-900">Kullanıldığı yerler</p>
          {usage === null ? (
            <Loader2 className="size-4 animate-spin text-muted" />
          ) : usage.length === 0 ? (
            <p className="text-xs text-muted">Bu dosya sitede kullanılmıyor.</p>
          ) : (
            <ul className="space-y-1">
              {usage.map((u, i) => (
                <li key={i}>
                  <Link href={u.href} className="text-xs font-semibold text-brand-700 hover:text-gold-600">
                    → {u.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Button
          type="button"
          variant="danger"
          size="sm"
          className="w-full"
          disabled={deleting || (usage?.length ?? 0) > 0}
          title={(usage?.length ?? 0) > 0 ? "Kullanımdaki dosya silinemez" : undefined}
          onClick={() => {
            if (!confirm("Bu dosya kalıcı olarak silinecek. Emin misiniz?")) return;
            startDelete(async () => {
              const res = await deleteMedia(item.id);
              if (res.ok) {
                toast.success(res.message);
                onClose();
                router.refresh();
              } else {
                if (res.data) setUsage(res.data);
                toast.error(res.message);
              }
            });
          }}
        >
          {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          {(usage?.length ?? 0) > 0 ? "Kullanımda — silinemez" : "Dosyayı Sil"}
        </Button>
      </div>
    </AdminCard>
  );
}
