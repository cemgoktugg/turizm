"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Images, MapPin, Play, X } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { fill } from "@/lib/content/template";
import { cn } from "@/lib/utils";
import { VideoButton } from "./video";

export type GalleryLabels = {
  galleryAll: string;
  galleryMore: string;
  videoButton: string;
  mapButton: string;
};

/** Alt sıradaki kutucuk sayısı (masaüstü) */
const BOTTOM_SLOTS = 5;

/**
 * Tur galerisi: büyük görsel + sağda iki görsel + alt sırada görseller,
 * video, harita ve "tüm fotoğraflar" kutucukları. Tıklanınca tam ekran açılır.
 */
export function TourGallery({
  images,
  title,
  videoUrl,
  mapUrl,
  labels,
}: {
  images: string[];
  title: string;
  videoUrl?: string | null;
  mapUrl?: string | null;
  labels: GalleryLabels;
}) {
  const list = images.length ? images : ["/images/logo-mark.svg"];
  const [viewer, setViewer] = useState<number | null>(null);

  const side = list.slice(1, 3);
  const rest = list.slice(3);
  const specials = (videoUrl ? 1 : 0) + (mapUrl ? 1 : 0);
  const showBottom = rest.length > 0 || specials > 0;
  const restShown = rest.slice(0, Math.max(0, BOTTOM_SLOTS - specials - 1));
  const hidden = rest.length - restShown.length;
  const allTileImage = rest[restShown.length] ?? list[list.length - 1];

  const open = (i: number) => setViewer(i);

  return (
    <div>
      <div className={cn("grid gap-3", side.length > 0 && "md:grid-cols-3")}>
        {/* Büyük görsel */}
        <button
          type="button"
          onClick={() => open(0)}
          className={cn(
            "group relative aspect-[4/3] overflow-hidden rounded-3xl bg-brand-950 sm:aspect-[16/10]",
            side.length > 0 && "md:col-span-2",
          )}
          aria-label={`${title} — fotoğrafları büyüt`}
        >
          <SmartImage
            src={list[0]}
            alt={title}
            loading="eager"
            className="size-full transition-transform duration-700 group-hover:scale-[1.03]"
          />
          {/* Mobil kısayollar */}
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-brand-950/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur md:hidden">
            <Images className="size-4" /> 1 / {list.length}
          </span>
        </button>

        {/* Sağdaki görseller */}
        {side.length > 0 && (
          <div className="hidden flex-col gap-3 md:flex">
            {side.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => open(i + 1)}
                className="group relative flex-1 overflow-hidden rounded-3xl bg-brand-950"
              >
                <SmartImage
                  src={src}
                  alt={`${title} — görsel ${i + 2}`}
                  className="absolute inset-0 size-full transition-transform duration-700 group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobil: video / harita / tüm fotoğraflar butonları */}
      {(list.length > 1 || videoUrl || mapUrl) && (
        <div className="mt-3 flex flex-wrap gap-2 md:hidden">
          {list.length > 1 && (
            <button type="button" onClick={() => open(0)} className={mobileChip}>
              <Images className="size-4" /> {labels.galleryAll} ({list.length})
            </button>
          )}
          {videoUrl && (
            <VideoButton url={videoUrl} className={mobileChip}>
              <Play className="size-4" /> {labels.videoButton}
            </VideoButton>
          )}
          {mapUrl && (
            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={mobileChip}>
              <MapPin className="size-4" /> {labels.mapButton}
            </a>
          )}
        </div>
      )}

      {/* Masaüstü alt sıra */}
      {showBottom && (
        <div className="mt-3 hidden grid-cols-5 gap-3 md:grid">
          {restShown.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => open(i + 3)}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-brand-950"
            >
              <SmartImage
                src={src}
                alt={`${title} — görsel ${i + 4}`}
                className="size-full transition-transform duration-700 group-hover:scale-105"
              />
            </button>
          ))}

          {videoUrl && (
            <VideoButton
              url={videoUrl}
              ariaLabel={labels.videoButton}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-brand-950"
            >
              <SmartImage src={list[1] ?? list[0]} alt="" className="size-full opacity-60 transition group-hover:opacity-50" />
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid size-12 place-items-center rounded-full bg-white/90 text-brand-800 shadow-lg transition group-hover:scale-110">
                  <Play className="ml-0.5 size-5 fill-current" />
                </span>
              </span>
              <span className="absolute inset-x-0 bottom-2 text-center text-xs font-semibold text-white drop-shadow">
                {labels.videoButton}
              </span>
            </VideoButton>
          )}

          {mapUrl && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl border border-border bg-[#edf3f4]"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgb(255 255 255 / 0.7) 2px, transparent 2px), linear-gradient(rgb(255 255 255 / 0.7) 2px, transparent 2px)",
                backgroundSize: "28px 28px",
              }}
            >
              <MapPin className="size-9 -translate-y-3 fill-red-500 text-red-700 drop-shadow transition group-hover:-translate-y-4" />
              <span className="absolute bottom-2 inline-flex items-center gap-1 rounded-full bg-brand-900 px-3 py-1 text-xs font-semibold text-white">
                <MapPin className="size-3.5" /> {labels.mapButton}
              </span>
            </a>
          )}

          <button
            type="button"
            onClick={() => open(Math.min(3 + restShown.length, list.length - 1))}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-brand-950"
          >
            <SmartImage src={allTileImage} alt="" className="size-full opacity-45 transition group-hover:scale-105" />
            <span className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center text-white">
              <span className="text-sm font-bold">{labels.galleryAll}</span>
              {hidden > 0 && <span className="text-xs text-white/85">{fill(labels.galleryMore, { sayi: hidden })}</span>}
            </span>
          </button>
        </div>
      )}

      {viewer !== null && (
        <Lightbox images={list} title={title} index={viewer} onIndex={setViewer} onClose={() => setViewer(null)} />
      )}
    </div>
  );
}

const mobileChip =
  "inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-2 text-xs font-semibold text-brand-800 shadow-sm";

function Lightbox({
  images,
  title,
  index,
  onIndex,
  onClose,
}: {
  images: string[];
  title: string;
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const touchX = useRef<number | null>(null);
  const thumbs = useRef<HTMLDivElement>(null);
  const go = useCallback(
    (delta: number) => onIndex((index + delta + images.length) % images.length),
    [index, images.length, onIndex],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [go, onClose]);

  // Aktif küçük resmi görünür tut
  useEffect(() => {
    thumbs.current?.children[index]?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [index]);

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex flex-col bg-brand-950/95 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} fotoğrafları`}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm font-semibold">
          {index + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="grid size-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
          aria-label="Kapat"
        >
          <X className="size-5" />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-4"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        <SmartImage
          key={images[index]}
          src={images[index]}
          alt={`${title} — görsel ${index + 1}`}
          loading="eager"
          className="max-h-full max-w-full rounded-xl object-contain"
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
              aria-label="Önceki"
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
              aria-label="Sonraki"
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div ref={thumbs} className="flex gap-2 overflow-x-auto px-4 py-4">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => onIndex(i)}
              className={cn(
                "size-16 shrink-0 overflow-hidden rounded-lg border-2 transition sm:size-20",
                i === index ? "border-gold-400" : "border-transparent opacity-50 hover:opacity-100",
              )}
            >
              <SmartImage src={src} alt="" className="size-full" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
