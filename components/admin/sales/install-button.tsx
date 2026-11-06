"use client";

import { useEffect, useState } from "react";
import { MonitorDown } from "lucide-react";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

/**
 * "Uygulamayı Yükle": tarayıcı kurulumu destekliyorsa (Chrome / Edge, Android)
 * görünür; program zaten uygulama olarak açıldıysa gizlenir. Safari'de
 * Paylaş › Ana Ekrana Ekle kullanılır (bu olay orada yoktur).
 */
export function InstallButton() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPromptEvent);
    };
    const onInstalled = () => setPrompt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!prompt) return null;
  return (
    <button
      type="button"
      onClick={async () => {
        await prompt.prompt();
        await prompt.userChoice;
        setPrompt(null);
      }}
      className="hidden h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-cream-200/80 transition hover:bg-white/10 hover:text-white sm:inline-flex"
      title="Satış Programı'nı bilgisayara / telefona uygulama olarak kur"
    >
      <MonitorDown className="size-4" /> Uygulamayı Yükle
    </button>
  );
}
