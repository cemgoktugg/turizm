import Link from "next/link";
import { ArrowLeft, Download, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PeriodTours } from "@/lib/sales";
import { PeriodTourSelect } from "./period-tour-select";

/** Tablo hücre sınıfları (satış modülü listelerinde ortak) */
export const th = "whitespace-nowrap px-3 py-3 font-semibold";
export const td = "whitespace-nowrap px-3 py-2.5";
export const num = "text-right tabular-nums";
export const theadRow = "border-b border-border bg-cream-50 text-left text-xs uppercase tracking-wide text-muted";

const control =
  "h-10 rounded-xl border border-border bg-white px-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

/** Arama paneli: dönem seçimi + arama kutusu + Listele (GET formu; tour verilirse dönem altında turlar da seçilir) */
export function FilterBar({
  action,
  periods,
  tours,
  donem,
  tur = "",
  q,
  searchPlaceholder = "Ara...",
  exportHref,
  hidden,
  children,
}: {
  action: string;
  periods: string[];
  /** Verilirse dönem listesinde her dönemin altında turları da sıralanır (seçilince liste yenilenir) */
  tours?: PeriodTours[];
  donem: string;
  tur?: string;
  /** undefined ise arama kutusu gösterilmez */
  q?: string;
  searchPlaceholder?: string;
  exportHref?: string;
  /** Formla birlikte gönderilecek sabit alanlar (ör. rapor türü) */
  hidden?: Record<string, string>;
  children?: React.ReactNode;
}) {
  return (
    <form action={action} className="mb-5 flex flex-col gap-2 rounded-2xl border border-border bg-white p-3 shadow-soft sm:flex-row sm:flex-wrap sm:items-center">
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {tours ? (
        <PeriodTourSelect groups={tours} donem={donem} tur={tur} className={cn(control, "sm:w-80")} />
      ) : (
        <select name="donem" defaultValue={donem} aria-label="Dönem" className={cn(control, "sm:w-56")}>
          <option value="">Tüm dönemler</option>
          {periods.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      )}
      {q !== undefined && (
        <div className="relative flex-1 sm:min-w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={q} placeholder={searchPlaceholder} className={cn(control, "w-full pl-9")} />
        </div>
      )}
      {children}
      <button type="submit" className="h-10 rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800">
        Listele
      </button>
      {exportHref && (
        <a
          href={exportHref}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border px-4 text-sm font-semibold text-brand-800 hover:bg-cream-100"
          title="Listeyi Excel (CSV) olarak indir"
        >
          <Download className="size-4" /> Excel
        </a>
      )}
    </form>
  );
}

/** Süzgeç seçimi (ilk seçenek "tümü") */
export function FilterSelect({
  name,
  value,
  label,
  allLabel,
  options,
}: {
  name: string;
  value: string;
  label: string;
  allLabel: string;
  options: (string | { value: string; label: string })[];
}) {
  return (
    <select name={name} defaultValue={value} aria-label={label} className={cn(control, "sm:w-44")}>
      <option value="">{allLabel}</option>
      {options.map((o) => {
        const opt = typeof o === "string" ? { value: o, label: o } : o;
        return (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        );
      })}
    </select>
  );
}

export function DateInput({ name, value, label }: { name: string; value: string; label: string }) {
  return <input type="date" name={name} defaultValue={value} aria-label={label} title={label} className={cn(control, "sm:w-40")} />;
}

/** Üstteki özet kutuları */
export function StatBox({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "green" | "red" }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p
        className={cn(
          "mt-1 text-xl font-bold tabular-nums",
          tone === "green" ? "text-green-700" : tone === "red" ? "text-red-600" : "text-brand-900",
        )}
      >
        {value}
      </p>
    </div>
  );
}

/** Geri dönüş bağlantısı */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-gold-600">
      <ArrowLeft className="size-4" /> {label}
    </Link>
  );
}

/** URL sorgu dizesi (boş değerler atlanır) */
export function qs(params: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Adrese sorgu parametresi ekler / değiştirir (ör. listede yan paneli açmak için ?panel=12) */
export function withParam(href: string, key: string, value: string) {
  const [path, query = ""] = href.split("?");
  const p = new URLSearchParams(query);
  p.set(key, value);
  return `${path}?${p}`;
}
