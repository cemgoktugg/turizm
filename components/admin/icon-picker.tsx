"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Icon, ICON_OPTIONS } from "@/components/ui/icon";
import { Input } from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";

/** İkon seçici: önizlemeli buton + aranabilir ikon ızgarası */
export function IconPicker({ value, onChange }: { value?: string; onChange: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const current = ICON_OPTIONS.find((o) => o.name === value);
  const term = q.trim().toLocaleLowerCase("tr");
  const list = term
    ? ICON_OPTIONS.filter((o) => o.label.toLocaleLowerCase("tr").includes(term) || o.name.toLowerCase().includes(term))
    : ICON_OPTIONS;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-[42px] w-full items-center gap-3 rounded-xl border border-border bg-white px-3 text-left text-sm shadow-sm transition hover:border-brand-300"
      >
        <span className="grid size-7 place-items-center rounded-lg bg-brand-50 text-brand-700">
          <Icon name={value} className="size-4" />
        </span>
        <span className="flex-1 truncate text-brand-900">{current?.label ?? (value || "İkon seçin")}</span>
        <ChevronDown className="size-4 text-muted" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="İkon Seçin" size="lg">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="İkon ara (ör. otel, uçak, güven)" className="pl-9" />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
          {list.map((o) => (
            <button
              key={o.name}
              type="button"
              onClick={() => {
                onChange(o.name);
                setOpen(false);
              }}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition",
                o.name === value ? "border-brand-600 bg-brand-50" : "border-border hover:border-brand-300 hover:bg-cream-50",
              )}
            >
              <Icon name={o.name} className="size-6 text-brand-700" />
              <span className="text-[11px] leading-tight text-brand-900">{o.label}</span>
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
