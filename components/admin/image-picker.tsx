"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Images,
  Link2,
  Loader2,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { listMedia, type MediaLibrary } from "@/app/actions/media";
import { SmartImage } from "@/components/ui/smart-image";
import { MediaThumb } from "@/components/ui/media-thumb";
import { isVideoUrl, type UploadKind } from "@/lib/media-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { ACCEPT_IMAGES, acceptFor, uploadFiles } from "./upload";

/* ------------------------------------------------------------------ */
/* Yükleme kancası                                                      */
/* ------------------------------------------------------------------ */

export function useUploader(onUploaded: (urls: string[]) => void, kind: UploadKind = "image") {
  const [uploading, setUploading] = useState(false);
  const upload = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      setUploading(true);
      const res = await uploadFiles(files, kind);
      setUploading(false);
      res.errors.forEach((e) => toast.error(e));
      if (res.files.length) {
        toast.success(res.files.length === 1 ? "Dosya yüklendi." : `${res.files.length} dosya yüklendi.`);
        onUploaded(res.files.map((f) => f.url));
      }
    },
    [onUploaded, kind],
  );
  return { uploading, upload };
}

export function useDropZone(onFiles: (files: File[]) => void) {
  const [over, setOver] = useState(false);
  return {
    over,
    props: {
      onDragOver: (e: React.DragEvent) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setOver(true);
      },
      onDragLeave: () => setOver(false),
      onDrop: (e: React.DragEvent) => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        setOver(false);
        onFiles(Array.from(e.dataTransfer.files));
      },
    },
  };
}

/* ------------------------------------------------------------------ */
/* Medya kütüphanesi penceresi                                          */
/* ------------------------------------------------------------------ */

type LibraryProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (urls: string[]) => void;
  multiple?: boolean;
  /** "media": videolar da listelenir ve yüklenebilir */
  kind?: UploadKind;
};

/** Her açılışta sıfırdan mount edilir; seçim ve arama durumu kendiliğinden temizlenir */
export function MediaLibraryDialog(props: LibraryProps) {
  if (!props.open) return null;
  return <MediaLibraryInner {...props} />;
}

function MediaLibraryInner({ open, onClose, onSelect, multiple = false, kind = "image" }: LibraryProps) {
  const [lib, setLib] = useState<MediaLibrary | null>(null);
  const [tab, setTab] = useState<"uploads" | "builtin">("uploads");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // İlk açılışta listeyi getir
  useEffect(() => {
    let alive = true;
    void listMedia().then((res) => {
      if (!alive) return;
      if (res.ok && res.data) {
        setLib(res.data);
        if (!res.data.uploads.some((m) => kind === "media" || !m.mimeType.startsWith("video/"))) setTab("builtin");
      } else toast.error(res.message || "Medya listesi alınamadı.");
    });
    return () => {
      alive = false;
    };
  }, [kind]);

  const { uploading, upload } = useUploader(
    useCallback(
      (urls: string[]) => {
        void listMedia().then((res) => res.ok && res.data && setLib(res.data));
        setTab("uploads");
        setSelected((s) => (multiple ? [...s, ...urls] : urls.slice(-1)));
      },
      [multiple],
    ),
    kind,
  );
  const drop = useDropZone((files) => void upload(files));

  const items = useMemo(() => {
    if (!lib) return [];
    const list =
      tab === "uploads"
        ? lib.uploads
            .filter((m) => kind === "media" || !m.mimeType.startsWith("video/"))
            .map((m) => ({
              url: m.url,
              name: m.originalName,
              meta: m.mimeType.startsWith("video/") ? "Video" : m.width ? `${m.width}×${m.height}` : "",
            }))
        : lib.builtin.map((u) => ({ url: u, name: u.split("/").pop() ?? u, meta: "Hazır görsel" }));
    const q = query.trim().toLocaleLowerCase("tr");
    return q ? list.filter((i) => i.name.toLocaleLowerCase("tr").includes(q)) : list;
  }, [lib, tab, query, kind]);

  function toggle(url: string) {
    if (!multiple) {
      onSelect([url]);
      onClose();
      return;
    }
    setSelected((s) => (s.includes(url) ? s.filter((u) => u !== url) : [...s, url]));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Medya Kütüphanesi"
      size="xl"
      footer={
        multiple ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted">{selected.length} dosya seçildi</span>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Vazgeç
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!selected.length}
                onClick={() => {
                  onSelect(selected);
                  onClose();
                }}
              >
                <Check className="size-4" /> Seçilenleri Ekle
              </Button>
            </div>
          </div>
        ) : undefined
      }
    >
      <div {...drop.props} className={cn("rounded-2xl transition", drop.over && "bg-brand-50 ring-2 ring-brand-300")}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-full border border-border bg-cream-50 p-1 text-sm font-semibold">
            {(
              [
                ["uploads", `Yüklenenler${lib ? ` (${lib.uploads.length})` : ""}`],
                ["builtin", "Hazır Görseller"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn("rounded-full px-4 py-1.5 transition", tab === id ? "bg-brand-700 text-white" : "text-brand-800 hover:bg-white")}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ara..." className="h-10 py-2 pl-9" />
            </div>
            <Button type="button" size="sm" className="h-10" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Yükle
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept={acceptFor(kind)}
              multiple
              hidden
              onChange={(e) => {
                void upload(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
          </div>
        </div>

        {!lib ? (
          <div className="grid h-60 place-items-center text-muted">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="grid h-60 place-items-center rounded-2xl border border-dashed border-border text-center text-sm text-muted">
            <div>
              <Images className="mx-auto mb-2 size-8 text-brand-300" />
              {tab === "uploads"
                ? `Henüz ${kind === "media" ? "dosya" : "görsel"} yüklenmemiş. Dosyaları buraya sürükleyin veya 'Yükle'ye tıklayın.`
                : "Sonuç bulunamadı."}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((item) => {
              const isSel = selected.includes(item.url);
              return (
                <button
                  key={item.url}
                  type="button"
                  onClick={() => toggle(item.url)}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border-2 bg-white text-left transition",
                    isSel ? "border-brand-600 ring-2 ring-brand-200" : "border-border hover:border-brand-300",
                  )}
                >
                  <div className="aspect-[4/3] bg-brand-950/5">
                    <MediaThumb src={item.url} alt={item.name} className="size-full" />
                  </div>
                  <div className="px-2 py-1.5">
                    <p className="truncate text-xs font-semibold text-brand-900">{item.name}</p>
                    <p className="truncate text-[11px] text-muted">{item.meta}</p>
                  </div>
                  {isSel && (
                    <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-brand-600 text-white shadow">
                      <Check className="size-4" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Tek görsel seçici                                                    */
/* ------------------------------------------------------------------ */

export function ImagePicker({
  value,
  onChange,
  aspect = "video",
  invalid,
  kind = "image",
  surface = "dark",
  contain = false,
}: {
  value?: string | null;
  onChange: (url: string) => void;
  aspect?: "video" | "square" | "portrait" | "wide" | "story";
  invalid?: boolean;
  /** "media": video da seçilebilir (hikayeler) */
  kind?: UploadKind;
  /** Önizleme zemini — logolar için açık veya koyu */
  surface?: "dark" | "light";
  /** Görseli kırpmadan sığdır (logolar) */
  contain?: boolean;
}) {
  const [libOpen, setLibOpen] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { uploading, upload } = useUploader(
    useCallback((urls: string[]) => onChange(urls[0]), [onChange]),
    kind,
  );
  const drop = useDropZone((files) => void upload(files.slice(0, 1)));

  const aspectClass = {
    video: "aspect-video",
    square: "aspect-square max-w-[200px]",
    portrait: "aspect-[3/4] max-w-[220px]",
    wide: "aspect-[21/9]",
    story: "aspect-[9/16] max-w-[180px]",
  }[aspect];

  return (
    <div>
      <div
        {...drop.props}
        className={cn(
          "group relative overflow-hidden rounded-2xl border-2 border-dashed transition",
          aspectClass,
          value ? (surface === "light" ? "border-border bg-white" : "border-transparent bg-brand-950") : "border-border bg-cream-50",
          drop.over && "border-brand-500 bg-brand-50",
          invalid && "border-red-400",
        )}
      >
        {value ? (
          <>
            {isVideoUrl(value) ? (
              <video src={`${value}#t=0.1`} muted playsInline preload="metadata" className="size-full object-cover" />
            ) : (
              <SmartImage src={value} alt="" className={cn("size-full", contain && "object-contain p-3")} />
            )}
            <div className="absolute inset-0 flex items-end justify-end gap-2 bg-gradient-to-t from-brand-950/70 via-transparent to-transparent p-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              <Button type="button" size="sm" variant="white" onClick={() => setLibOpen(true)}>
                <Images className="size-4" /> Değiştir
              </Button>
              <Button type="button" size="sm" variant="white" onClick={() => fileRef.current?.click()} aria-label="Yeni görsel yükle">
                <Upload className="size-4" />
              </Button>
              <Button type="button" size="sm" variant="danger" onClick={() => onChange("")} aria-label="Görseli kaldır">
                <Trash2 className="size-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-3 p-4 text-center">
            <ImagePlus className="size-8 text-brand-300" />
            <p className="text-xs text-muted">{kind === "media" ? "Video veya görseli buraya sürükleyin" : "Görseli buraya sürükleyin"}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="size-4" /> Yükle
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setLibOpen(true)}>
                <Images className="size-4" /> Kütüphane
              </Button>
            </div>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 grid place-items-center bg-white/70 backdrop-blur-sm">
            <Loader2 className="size-7 animate-spin text-brand-700" />
          </div>
        )}
      </div>

      <div className="mt-1.5 flex items-center gap-2 text-xs">
        {value && !urlMode && <span className="min-w-0 flex-1 truncate font-mono text-muted" title={value}>{value}</span>}
        {urlMode ? (
          <div className="flex w-full gap-2">
            <Input
              autoFocus
              defaultValue={value ?? ""}
              placeholder="/images/ornek.jpg veya https://..."
              className="h-9 py-1.5 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onChange((e.target as HTMLInputElement).value.trim());
                  setUrlMode(false);
                }
              }}
              onBlur={(e) => {
                onChange(e.target.value.trim());
                setUrlMode(false);
              }}
            />
          </div>
        ) : (
          <button type="button" onClick={() => setUrlMode(true)} className="ml-auto inline-flex shrink-0 items-center gap-1 font-semibold text-brand-700 hover:text-gold-600">
            <Link2 className="size-3.5" /> URL ile
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={acceptFor(kind)}
        hidden
        onChange={(e) => {
          void upload(Array.from(e.target.files ?? []).slice(0, 1));
          e.target.value = "";
        }}
      />
      <MediaLibraryDialog
        open={libOpen}
        onClose={() => setLibOpen(false)}
        onSelect={(urls) => urls[0] && onChange(urls[0])}
        kind={kind}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Çoklu görsel (galeri) seçici                                         */
/* ------------------------------------------------------------------ */

export function GalleryPicker({
  value,
  onChange,
  max = 30,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const [libOpen, setLibOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const list = value;

  const add = useCallback(
    (urls: string[]) => {
      const merged = [...list, ...urls.filter((u) => !list.includes(u))];
      if (merged.length > max) toast.warning(`En fazla ${max} görsel eklenebilir.`);
      onChange(merged.slice(0, max));
    },
    [list, max, onChange],
  );
  const { uploading, upload } = useUploader(add);
  const drop = useDropZone((files) => void upload(files));

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div {...drop.props} className={cn("rounded-2xl p-1 transition", drop.over && "bg-brand-50 ring-2 ring-brand-300")}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {list.map((url, i) => (
          <div key={url + i} className="group relative overflow-hidden rounded-xl border border-border bg-brand-950">
            <div className="aspect-[4/3]">
              <SmartImage src={url} alt="" className="size-full" />
            </div>
            <span className="absolute left-1.5 top-1.5 rounded-md bg-white/90 px-1.5 text-[11px] font-bold text-brand-900">{i + 1}</span>
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-brand-950/80 to-transparent p-1.5">
              <div className="flex gap-1">
                <IconBtn label="Sola taşı" onClick={() => move(i, -1)} disabled={i === 0}>
                  <ArrowLeft className="size-3.5" />
                </IconBtn>
                <IconBtn label="Sağa taşı" onClick={() => move(i, 1)} disabled={i === list.length - 1}>
                  <ArrowRight className="size-3.5" />
                </IconBtn>
              </div>
              <IconBtn label="Kaldır" danger onClick={() => onChange(list.filter((_, k) => k !== i))}>
                <X className="size-3.5" />
              </IconBtn>
            </div>
          </div>
        ))}

        {list.length < max && (
          <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-cream-50 p-2 text-center">
            {uploading ? (
              <Loader2 className="size-6 animate-spin text-brand-700" />
            ) : (
              <>
                <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-gold-600">
                  <Upload className="size-3.5" /> Yükle
                </button>
                <button type="button" onClick={() => setLibOpen(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-gold-600">
                  <Images className="size-3.5" /> Kütüphaneden
                </button>
              </>
            )}
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">
        Görselleri sürükleyip bırakabilirsiniz. Oklarla sıralamayı değiştirin; ilk görsel öne çıkar.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT_IMAGES}
        multiple
        hidden
        onChange={(e) => {
          void upload(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      <MediaLibraryDialog open={libOpen} onClose={() => setLibOpen(false)} onSelect={add} multiple />
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-7 place-items-center rounded-md bg-white/90 text-brand-900 transition hover:bg-white disabled:opacity-30",
        danger && "text-red-600",
      )}
    >
      {children}
    </button>
  );
}
