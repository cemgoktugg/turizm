"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cookie } from "lucide-react";
import { track } from "@/lib/track";
import type { ContentData } from "@/lib/content/registry";

/* Çerez tercihi tarayıcıda saklanır: "granted" | "denied" */
const CONSENT_KEY = "nemira-cookie-consent";
const OPEN_EVENT = "nemira:cookie-settings";
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}
function getConsent(): string | null {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return "denied";
  }
}
function setConsent(value: "granted" | "denied") {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* gizli sekme */
  }
  listeners.forEach((l) => l());
}

type W = Window & { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void; fbq?: ((...a: unknown[]) => void) & Record<string, unknown> };

function loadGa(id: string) {
  const w = window as W;
  if (w.gtag) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag() {
    // gtag, dizi değil "arguments" nesnesi bekler
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments);
  };
  w.gtag("js", new Date());
  w.gtag("config", id);
}

type PixelFn = ((...a: unknown[]) => void) & {
  callMethod?: (...a: unknown[]) => void;
  queue: unknown[];
  push?: unknown;
  loaded?: boolean;
  version?: string;
};

/** Meta'nın resmi piksel yükleme kodunun eşdeğeri */
function loadPixel(id: string) {
  const w = window as W;
  if (w.fbq) return;
  const n = function () {
    // eslint-disable-next-line prefer-rest-params
    const args = arguments as unknown as unknown[];
    if (n.callMethod) n.callMethod(...args);
    else n.queue.push(args);
  } as PixelFn;
  n.queue = [];
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  w.fbq = n as unknown as W["fbq"];
  (w as unknown as { _fbq: unknown })._fbq = n;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(s);
  n("init", id);
  n("track", "PageView");
}

export type CookieTexts = ContentData<"ui.cookies">;

/**
 * Ölçüm araçları + çerez onay bandı. Kimlik girilmemişse bant gösterilmez ve
 * hiçbir dış betik yüklenmez. WhatsApp ve telefon tıklamaları dönüşüm sayılır.
 */
export function Analytics({ gaId, pixelId, texts }: { gaId: string; pixelId: string; texts: CookieTexts }) {
  const enabled = Boolean(gaId || pixelId);
  const consent = useSyncExternalStore(subscribe, getConsent, () => "denied");
  const [reopened, setReopened] = useState(false);
  const pathname = usePathname();
  const firstPath = useRef(true);

  // Onay verildiyse betikleri yükle
  useEffect(() => {
    if (!enabled || consent !== "granted") return;
    if (gaId) loadGa(gaId);
    if (pixelId) loadPixel(pixelId);
  }, [enabled, consent, gaId, pixelId]);

  // Sayfa geçişlerinde Meta'ya sayfa görüntüleme bildir (GA4 bunu kendisi yapar)
  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    (window as W).fbq?.("track", "PageView");
  }, [pathname]);

  // WhatsApp / telefon bağlantı tıklamaları
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      if (/wa\.me|api\.whatsapp\.com/i.test(href)) track("whatsapp", { page: location.pathname });
      else if (href.startsWith("tel:")) track("phone", { page: location.pathname });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Footer'daki "Çerez tercihleri" bağlantısı bandı yeniden açar
  useEffect(() => {
    const open = () => setReopened(true);
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  const choose = useCallback((value: "granted" | "denied") => {
    setConsent(value);
    setReopened(false);
    // Onay geri çekildiyse yüklenmiş betikleri kaldırmanın en temiz yolu sayfayı yenilemek
    if (value === "denied" && ((window as W).gtag || (window as W).fbq)) location.reload();
  }, []);

  if (!enabled || (consent && !reopened)) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={texts.policyLabel}
      className="fixed inset-x-3 bottom-20 z-[60] rounded-2xl border border-border bg-white p-4 shadow-card md:inset-x-auto md:bottom-6 md:left-6 md:max-w-md"
    >
      <div className="flex gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <Cookie className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm leading-relaxed text-brand-900">
            {texts.text}{" "}
            <Link href="/cerez-politikasi" className="font-semibold text-brand-700 underline underline-offset-2">
              {texts.policyLabel}
            </Link>
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => choose("denied")}
              className="flex-1 rounded-full border border-border px-4 py-2 text-sm font-semibold text-brand-800 transition hover:bg-cream-100"
            >
              {texts.rejectLabel}
            </button>
            <button
              type="button"
              onClick={() => choose("granted")}
              className="flex-1 rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
            >
              {texts.acceptLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Footer'daki "Çerez tercihleri" bağlantısı */
export function CookieSettingsButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))} className="hover:text-gold-300">
      {label}
    </button>
  );
}
