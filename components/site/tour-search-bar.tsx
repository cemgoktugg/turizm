"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { Select } from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";
import { fill } from "@/lib/content/template";
import type { FilterChoices, TourFilters } from "@/lib/tour-search";
import type { ContentData } from "@/lib/content/registry";

type ListLabels = ContentData<"ui.tours">["list"];

const control = "h-11 rounded-xl border-border bg-cream-50/60 py-0 text-[13px] font-medium text-brand-900";

/** /turlar arama ve filtre çubuğu — seçim değişince sonuçlar anında yenilenir */
export function TourSearchBar({
  basePath = "/turlar",
  filters,
  choices,
  labels,
  resultCount,
}: {
  basePath?: string;
  filters: TourFilters;
  choices: FilterChoices;
  labels: ListLabels;
  resultCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function apply(form: HTMLFormElement) {
    const params = new URLSearchParams();
    for (const [name, value] of new FormData(form)) {
      const v = String(value).trim();
      if (v && !(name === "sirala" && v === "onerilen")) params.set(name, v);
    }
    const qs = params.toString();
    startTransition(() => router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false }));
  }

  const active = Boolean(filters.q || filters.ay || filters.sure || filters.kalkis || filters.butce);
  const clearHref = filters.kategori ? `${basePath}?kategori=${encodeURIComponent(filters.kategori)}` : basePath;

  return (
    <form
      // Adres değişince (ör. "Temizle") alanlar yeni değerlerle yeniden kurulur
      key={JSON.stringify(filters)}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        apply(e.currentTarget);
      }}
      onChange={(e) => {
        if (e.target instanceof HTMLSelectElement) apply(e.currentTarget);
      }}
      className="rounded-3xl border border-border bg-white p-3 shadow-soft sm:p-4"
    >
      {filters.kategori && <input type="hidden" name="kategori" value={filters.kategori} />}

      <div className="flex flex-wrap gap-2.5">
        <div className="relative flex min-w-0 flex-[2_1_100%] gap-2 lg:flex-[2_1_260px]">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{labels.searchPlaceholder}</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-500" />
            <input
              type="search"
              name="q"
              defaultValue={filters.q}
              placeholder={labels.searchPlaceholder}
              maxLength={100}
              className={cn(
                control,
                "w-full border pl-10 pr-3 shadow-sm placeholder:text-muted/70 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100",
              )}
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            <span className="hidden sm:inline">{labels.searchButton}</span>
          </button>
        </div>

        {choices.months.length > 0 && (
          <FilterSelect name="ay" value={filters.ay} allLabel={labels.monthAll}>
            {choices.months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </FilterSelect>
        )}
        {choices.durations.length > 0 && (
          <FilterSelect name="sure" value={filters.sure} allLabel={labels.durationAll}>
            {choices.durations.map((d) => (
              <option key={d} value={d}>
                {fill(labels.durationFormat, { gun: d })}
              </option>
            ))}
          </FilterSelect>
        )}
        {choices.cities.length > 1 && (
          <FilterSelect name="kalkis" value={filters.kalkis} allLabel={labels.cityAll}>
            {choices.cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </FilterSelect>
        )}
        {choices.budgets.length > 0 && (
          <FilterSelect name="butce" value={filters.butce} allLabel={labels.budgetAll}>
            {choices.budgets.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </FilterSelect>
        )}
        <label className="min-w-0 flex-[1_1_150px]">
          <span className="sr-only">{labels.sortRecommended}</span>
          <Select name="sirala" defaultValue={filters.sirala} className={control}>
            <option value="onerilen">{labels.sortRecommended}</option>
            <option value="tarih">{labels.sortDate}</option>
            <option value="fiyat-artan">{labels.sortPriceAsc}</option>
            <option value="fiyat-azalan">{labels.sortPriceDesc}</option>
          </Select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        <p aria-live="polite" className={cn("font-semibold text-brand-800 transition-opacity", pending && "opacity-50")}>
          {fill(labels.resultCount, { sayi: resultCount })}
        </p>
        {active && (
          <Link
            href={clearHref}
            scroll={false}
            className="inline-flex items-center gap-1 rounded-full bg-cream-100 px-2.5 py-1 font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            <X className="size-3.5" /> {labels.clearFilters}
          </Link>
        )}
      </div>
    </form>
  );
}

function FilterSelect({
  name,
  value,
  allLabel,
  children,
}: {
  name: string;
  value: string | number | undefined;
  allLabel: string;
  children: React.ReactNode;
}) {
  return (
    <label className="min-w-0 flex-[1_1_150px]">
      <span className="sr-only">{allLabel}</span>
      <Select
        name={name}
        defaultValue={value ?? ""}
        className={cn(control, value != null && value !== "" && "border-brand-400 bg-brand-50 text-brand-800")}
      >
        <option value="">{allLabel}</option>
        {children}
      </Select>
    </label>
  );
}
