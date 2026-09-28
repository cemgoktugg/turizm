"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Link2, Mail, MessageCircle, Share2 } from "lucide-react";
import { SocialIcon } from "@/components/site/social-icon";

/** Tur sayfasını WhatsApp, Facebook, X, e-posta ile paylaşma menüsü */
export function ShareMenu({
  title,
  labels,
}: {
  title: string;
  labels: { shareButton: string; shareCopy: string; shareCopied: string };
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const url = () => window.location.href.split("#")[0];
  const enc = encodeURIComponent;
  const targets = [
    { label: "WhatsApp", icon: <MessageCircle className="size-4 text-[#1eb955]" />, href: () => `https://wa.me/?text=${enc(`${title} ${url()}`)}` },
    { label: "Facebook", icon: <SocialIcon name="facebook" className="size-4 text-[#1877f2]" />, href: () => `https://www.facebook.com/sharer/sharer.php?u=${enc(url())}` },
    { label: "X", icon: <SocialIcon name="twitter" className="size-4" />, href: () => `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url())}` },
    { label: "E-posta", icon: <Mail className="size-4 text-brand-700" />, href: () => `mailto:?subject=${enc(title)}&body=${enc(url())}` },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
      toast.success(labels.shareCopied);
    } catch {
      toast.error(url());
    }
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-brand-800 transition hover:bg-cream-100"
      >
        <Share2 className="size-3.5" /> {labels.shareButton}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-2xl border border-border bg-white py-1.5 shadow-card">
          {targets.map((t) => (
            <a
              key={t.label}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.open(t.href(), "_blank", "noopener,noreferrer");
                setOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-2 text-sm text-brand-800 hover:bg-cream-50"
            >
              {t.icon} {t.label}
            </a>
          ))}
          <button type="button" onClick={copy} className="flex w-full items-center gap-3 border-t border-border px-4 py-2 text-left text-sm text-brand-800 hover:bg-cream-50">
            <Link2 className="size-4 text-muted" /> {labels.shareCopy}
          </button>
        </div>
      )}
    </div>
  );
}
