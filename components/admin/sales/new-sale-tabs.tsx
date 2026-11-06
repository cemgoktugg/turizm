"use client";

import { useState } from "react";
import { User, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";

/** Yeni satış: tek kişi / aile-grup arasında geçiş (iki form da hazır gelir) */
export function NewSaleTabs({ single, group, initial = "single" }: { single: React.ReactNode; group: React.ReactNode; initial?: "single" | "group" }) {
  const [mode, setMode] = useState(initial);
  const tab = (value: "single" | "group", label: string, Icon: typeof User) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === value}
      onClick={() => setMode(value)}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:flex-none",
        mode === value ? "bg-white text-brand-900 shadow-soft" : "text-muted hover:text-brand-800",
      )}
    >
      <Icon className="size-4" /> {label}
    </button>
  );
  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Satış türü" className="flex gap-1 rounded-2xl bg-cream-200/70 p-1 sm:inline-flex">
        {tab("single", "Tek kişi", User)}
        {tab("group", "Aile / Grup", UsersRound)}
      </div>
      {/* İki form da yerinde kalır; geçişte yazılanlar kaybolmaz */}
      <div hidden={mode !== "single"}>{single}</div>
      <div hidden={mode !== "group"}>{group}</div>
    </div>
  );
}
