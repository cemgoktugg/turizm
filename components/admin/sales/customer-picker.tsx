"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Search, UserPlus, X } from "lucide-react";
import { customerSchema, type CustomerInput } from "@/lib/validations";
import { createCustomer, searchCustomers, type CustomerOption } from "@/app/actions/sales";
import { Button } from "@/components/ui/button";
import { CustomerFields, type CustomerFormIn } from "./customer-form";
import { cn } from "@/lib/utils";

/** Satış formunda müşteri seçimi: ad / T.C. / telefonla arama, yoksa yerinde ekleme */
export function CustomerPicker({
  value,
  onChange,
  invalid,
}: {
  value: CustomerOption | null;
  onChange: (c: CustomerOption | null) => void;
  invalid?: boolean;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CustomerOption[]>([]);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [searching, startSearch] = useTransition();
  const seq = useRef(0);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const id = ++seq.current;
    const t = setTimeout(() => {
      startSearch(async () => {
        const res = await searchCustomers(term);
        // Yalnızca en son aramanın sonucunu göster
        if (id === seq.current) setResults(res.data ?? []);
      });
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-2.5">
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-brand-900">
            <span className="text-muted">#{value.id}</span> {value.fullName}
          </p>
          <p className="text-xs text-muted">
            {[value.tc && `T.C. ${value.tc}`, value.phone].filter(Boolean).join(" · ") || "T.C. / telefon girilmedi"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-brand-700 hover:bg-white"
          aria-label="Müşteriyi değiştir"
          title="Müşteriyi değiştir"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  if (adding) {
    return (
      <QuickAddCustomer
        initialName={/^\d+$/.test(q.trim()) ? "" : q.trim()}
        initialTc={/^\d{11}$/.test(q.trim()) ? q.trim() : ""}
        onCancel={() => setAdding(false)}
        onCreated={(c) => {
          setAdding(false);
          onChange(c);
        }}
      />
    );
  }

  const term = q.trim();
  return (
    <div className="relative">
      <Search className="absolute left-3 top-[22px] size-4 -translate-y-1/2 text-muted" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Ad, T.C. veya telefon ile arayın..."
        className={cn(
          "h-11 w-full rounded-xl border bg-white pl-9 pr-9 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100",
          invalid ? "border-red-400" : "border-border",
        )}
      />
      {searching && <Loader2 className="absolute right-3 top-[22px] size-4 -translate-y-1/2 animate-spin text-muted" />}
      {open && term.length >= 2 && (
        <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-border bg-white shadow-card">
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(c);
                setQ("");
                setResults([]);
              }}
              className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-cream-50"
            >
              <span className="font-semibold text-brand-900">
                <span className="text-muted">#{c.id}</span> {c.fullName}
              </span>
              <span className="text-xs text-muted">
                {[c.tc, c.phone].filter(Boolean).join(" · ")}
              </span>
            </button>
          ))}
          {!searching && results.length === 0 && <p className="px-4 py-2.5 text-sm text-muted">Kayıtlı müşteri bulunamadı.</p>}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setAdding(true)}
            className="flex w-full items-center gap-2 border-t border-border bg-cream-50 px-4 py-2.5 text-left text-sm font-semibold text-brand-700 hover:bg-cream-100"
          >
            <UserPlus className="size-4" /> Yeni müşteri ekle
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-gold-600"
      >
        <UserPlus className="size-3.5" /> Yeni müşteri ekle
      </button>
    </div>
  );
}

/** Satış formunun içinde açılan kısa müşteri formu (iç içe <form> olmasın diye butonla gönderilir) */
function QuickAddCustomer({
  initialName,
  initialTc,
  onCancel,
  onCreated,
}: {
  initialName: string;
  initialTc: string;
  onCancel: () => void;
  onCreated: (c: CustomerOption) => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormIn, unknown, CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: { fullName: initialName, tc: initialTc },
  });

  const save = handleSubmit(async (values) => {
    const res = await createCustomer(values);
    if (!res.ok || !res.data) {
      if (res.fieldErrors?.tc) setError("tc", { message: res.fieldErrors.tc });
      return void toast.error(res.message);
    }
    toast.success(res.message);
    onCreated(res.data);
  });

  return (
    <div
      className="rounded-xl border border-gold-300 bg-gold-50/40 p-4"
      onKeyDown={(e) => {
        // Enter dıştaki satış formunu göndermesin
        if (e.key === "Enter") {
          e.preventDefault();
          void save();
        }
      }}
    >
      <p className="mb-3 text-sm font-bold text-brand-900">Yeni Müşteri</p>
      <CustomerFields register={register} errors={errors} compact />
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Vazgeç
        </Button>
        <Button type="button" size="sm" disabled={isSubmitting} onClick={() => void save()}>
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
          Müşteriyi Kaydet
        </Button>
      </div>
    </div>
  );
}
