"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, ChevronLeft, ChevronRight, Loader2, Play, Volume2, VolumeX, X } from "lucide-react";
import { MediaThumb } from "@/components/ui/media-thumb";
import { cn } from "@/lib/utils";
import { isResizable, uploadSrcSet } from "@/lib/image-variants";

export type StoryView = {
  id: string;
  /** Görüldü bilgisinin anahtarı (hikaye güncellenince yeniden "yeni" görünür) */
  seenKey: string;
  title: string;
  thumb: string;
  buttonLabel: string | null;
  buttonUrl: string | null;
  items: { id: string; url: string; caption: string | null; duration: number | null; isVideo: boolean }[];
};

export type StoryLabels = {
  unmuteLabel: string;
  muteLabel: string;
  closeLabel: string;
  prevLabel: string;
  nextLabel: string;
};

/** Fotoğrafların varsayılan ekranda kalma süresi (sn) */
const IMAGE_SECONDS = 5;

/**
 * Instagram hikayesi tarzı tam ekran oynatıcı.
 * Sağa dokun: sonraki · sola dokun: önceki · basılı tut: duraklat ·
 * yana kaydır: diğer hikaye · aşağı kaydır: kapat.
 */
export function StoryViewer({
  stories,
  start,
  onClose,
  onSeen,
  labels,
}: {
  stories: StoryView[];
  start: number;
  onClose: () => void;
  onSeen: (seenKey: string) => void;
  labels: StoryLabels;
}) {
  const [si, setSi] = useState(start);
  const [ii, setIi] = useState(0);
  const [restart, setRestart] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [readyId, setReadyId] = useState<string | null>(null);
  const [buffering, setBuffering] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const frameRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const press = useRef<{ x: number; y: number; t: number; timer: number } | null>(null);

  const story = stories[si];
  const item = story.items[Math.min(ii, story.items.length - 1)];
  const ready = readyId === item.id;

  const go = useCallback((nextSi: number, nextIi: number) => {
    setSi(nextSi);
    setIi(nextIi);
    setRestart((r) => r + 1);
    setBlocked(false);
    setBuffering(false);
  }, []);

  const next = useCallback(() => {
    if (ii < story.items.length - 1) go(si, ii + 1);
    else if (si < stories.length - 1) go(si + 1, 0);
    else onClose();
  }, [go, ii, si, story.items.length, stories.length, onClose]);

  const prev = useCallback(() => {
    if (ii > 0) go(si, ii - 1);
    else if (si > 0) go(si - 1, 0);
    else go(si, 0);
  }, [go, ii, si]);

  const nextStory = useCallback(() => (si < stories.length - 1 ? go(si + 1, 0) : onClose()), [go, si, stories.length, onClose]);
  const prevStory = useCallback(() => go(Math.max(0, si - 1), 0), [go, si]);

  // Döngü içinden en güncel değerlere erişmek için
  const live = useRef({ next, paused, ready });
  useEffect(() => {
    live.current = { next, paused, ready };
  });

  useEffect(() => onSeen(story.seenKey), [story.seenKey, onSeen]);

  // İlerleme çubuklarını içerik değişince sıfırla
  useLayoutEffect(() => {
    const bars = barsRef.current?.children;
    if (!bars) return;
    for (let k = 0; k < bars.length; k++) {
      const fill = bars[k].firstElementChild as HTMLElement | null;
      if (fill) fill.style.transform = `scaleX(${k < ii ? 1 : 0})`;
    }
  }, [si, ii, restart]);

  // İlerleme döngüsü: fotoğrafta süre sayar, videoda oynatma konumunu izler
  useEffect(() => {
    const total = (item.duration ?? IMAGE_SECONDS) * 1000;
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    const loop = (now: number) => {
      const dt = now - last;
      last = now;
      let p: number;
      if (item.isVideo) {
        const v = videoRef.current;
        p = v && v.duration ? v.currentTime / v.duration : 0;
      } else {
        if (!live.current.paused && live.current.ready) elapsed += dt;
        p = elapsed / total;
        if (p >= 1) {
          live.current.next();
          return;
        }
      }
      const fill = barsRef.current?.children[ii]?.firstElementChild as HTMLElement | null;
      if (fill) fill.style.transform = `scaleX(${Math.min(1, p)})`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [si, ii, restart, item.duration, item.isVideo]);

  // Videoyu duraklat / sürdür
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) v.pause();
    else v.play().catch(() => setBlocked(true));
  }, [paused, si, ii, restart]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  // Sıradaki fotoğrafı önceden yükle
  useEffect(() => {
    const upcoming = story.items[ii + 1] ?? stories[si + 1]?.items[0];
    if (upcoming && !upcoming.isVideo) new Image().src = upcoming.url;
  }, [si, ii, story.items, stories]);

  // Klavye ve sayfa kaydırma kilidi
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onClose]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("[data-story-ui]")) return;
    const timer = window.setTimeout(() => setPaused(true), 180);
    press.current = { x: e.clientX, y: e.clientY, t: Date.now(), timer };
  }

  function onPointerUp(e: React.PointerEvent) {
    const p = press.current;
    if (!p) return;
    window.clearTimeout(p.timer);
    press.current = null;
    setPaused(false);
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (dy > 90 && dy > Math.abs(dx)) return onClose();
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) return dx < 0 ? nextStory() : prevStory();
    if (Date.now() - p.t < 250) {
      const rect = frameRef.current?.getBoundingClientRect();
      if (rect && e.clientX - rect.left < rect.width * 0.3) prev();
      else next();
    }
  }

  function cancelPress() {
    if (press.current) window.clearTimeout(press.current.timer);
    press.current = null;
    setPaused(false);
  }

  const external = story.buttonUrl ? /^https?:\/\//i.test(story.buttonUrl) : false;
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95" role="dialog" aria-modal="true" aria-label={story.title}>
      <button
        type="button"
        onClick={prevStory}
        disabled={si === 0}
        aria-label={labels.prevLabel}
        className="mr-5 hidden size-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-20 sm:grid"
      >
        <ChevronLeft className="size-6" />
      </button>

      <div
        ref={frameRef}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={cancelPress}
        onPointerLeave={cancelPress}
        onContextMenu={(e) => e.preventDefault()}
        className="relative h-full w-full touch-none select-none overflow-hidden bg-black sm:aspect-[9/16] sm:h-[min(92dvh,860px)] sm:w-auto sm:rounded-2xl"
      >
        {/* İçerik */}
        {item.isVideo ? (
          <video
            key={`${item.id}-${restart}`}
            ref={videoRef}
            src={item.url}
            autoPlay
            muted={muted}
            playsInline
            preload="auto"
            onCanPlay={() => setReadyId(item.id)}
            onWaiting={() => setBuffering(true)}
            onPlaying={() => setBuffering(false)}
            onEnded={next}
            className="absolute inset-0 size-full object-contain"
          />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={isResizable(item.url) ? `${item.url}?w=480` : item.url}
              alt=""
              aria-hidden
              className="absolute inset-0 size-full scale-110 object-cover opacity-50 blur-2xl"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={item.id}
              src={item.url}
              srcSet={uploadSrcSet(item.url)}
              sizes="(min-width: 640px) 480px, 100vw"
              alt={item.caption ?? story.title}
              draggable={false}
              onLoad={() => setReadyId(item.id)}
              className="absolute inset-0 size-full object-contain"
            />
          </>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />

        {/* İlerleme çubukları */}
        <div ref={barsRef} className="absolute inset-x-3 top-3 flex gap-1">
          {story.items.map((it) => (
            <span key={it.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/35">
              <span className="block h-full origin-left bg-white" style={{ transform: "scaleX(0)" }} />
            </span>
          ))}
        </div>

        {/* Üst bilgi */}
        <div className="absolute inset-x-3 top-7 flex items-center gap-2.5">
          <span className="size-9 shrink-0 overflow-hidden rounded-full ring-2 ring-white/70">
            <MediaThumb src={story.thumb} badge={false} className="size-full" />
          </span>
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white drop-shadow">{story.title}</p>
          {item.isVideo && (
            <button
              type="button"
              data-story-ui
              onPointerDown={stop}
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? labels.unmuteLabel : labels.muteLabel}
              title={muted ? labels.unmuteLabel : labels.muteLabel}
              className="grid size-10 place-items-center rounded-full text-white transition hover:bg-white/15"
            >
              {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </button>
          )}
          <button
            type="button"
            data-story-ui
            onPointerDown={stop}
            onClick={onClose}
            aria-label={labels.closeLabel}
            title={labels.closeLabel}
            className="grid size-10 place-items-center rounded-full text-white transition hover:bg-white/15"
          >
            <X className="size-6" />
          </button>
        </div>

        {/* Yükleniyor / oynatma engellendi */}
        {(!ready || buffering) && !blocked && (
          <span className="pointer-events-none absolute inset-0 grid place-items-center">
            <Loader2 className="size-9 animate-spin text-white/80" />
          </span>
        )}
        {blocked && (
          <button
            type="button"
            data-story-ui
            onPointerDown={stop}
            onClick={() => {
              setBlocked(false);
              videoRef.current?.play().catch(() => setBlocked(true));
            }}
            aria-label="Oynat"
            className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-brand-900 shadow-xl"
          >
            <Play className="ml-1 size-7 fill-current" />
          </button>
        )}

        {/* Alt: açıklama ve buton */}
        {(item.caption || (story.buttonLabel && story.buttonUrl)) && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-5 pb-6 pt-20">
            {item.caption && <p className="text-sm leading-relaxed text-white drop-shadow">{item.caption}</p>}
            {story.buttonLabel && story.buttonUrl && (
              <a
                href={story.buttonUrl}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                data-story-ui
                onPointerDown={stop}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-bold text-brand-900 shadow-lg transition hover:bg-gold-100"
              >
                {story.buttonLabel} <ArrowUpRight className="size-4" />
              </a>
            )}
          </div>
        )}

        {paused && ready && !blocked && (
          <span className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white">
            ❚❚
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={nextStory}
        aria-label={labels.nextLabel}
        className={cn(
          "ml-5 hidden size-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:grid",
          si === stories.length - 1 && "opacity-20",
        )}
      >
        <ChevronRight className="size-6" />
      </button>
    </div>,
    document.body,
  );
}
