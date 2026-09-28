"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** YouTube / Vimeo bağlantısını gömülebilir adrese çevirir; tanınmazsa null */
export function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}?autoplay=1&rel=0`;
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const id =
        u.searchParams.get("v") ?? u.pathname.match(/\/(?:embed|shorts|live)\/([\w-]+)/)?.[1] ?? null;
      return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` : null;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.match(/\/(\d+)/)?.[1];
      return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : null;
    }
  } catch {
    return null;
  }
  return null;
}

/** Tam ekran video penceresi */
function VideoDialog({ embed, onClose }: { embed: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[110] grid place-items-center bg-black/90 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        aria-label="Kapat"
      >
        <X className="size-6" />
      </button>
      <div className="aspect-video w-full max-w-5xl overflow-hidden rounded-2xl bg-black shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <iframe
          src={embed}
          title="Video"
          className="size-full"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    </div>,
    document.body,
  );
}

/**
 * Videoyu sayfa içinde açan buton. Bağlantı gömülemiyorsa (ör. Instagram)
 * yeni sekmede açılır.
 */
export function VideoButton({
  url,
  className,
  children,
  ariaLabel,
}: {
  url: string;
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const embed = toEmbedUrl(url);

  if (!embed) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={className} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn(className)} aria-label={ariaLabel}>
        {children}
      </button>
      {open && <VideoDialog embed={embed} onClose={() => setOpen(false)} />}
    </>
  );
}
