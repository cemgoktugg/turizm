import Link from "next/link";
import { cn } from "@/lib/utils";
import { getContent } from "@/lib/content";

export type FilterOption = { label: string; slug: string; count?: number };

export async function TourFilter({
  options,
  active,
  basePath = "/turlar",
  query = {},
}: {
  options: FilterOption[];
  active?: string;
  basePath?: string;
  /** Kategori değişirken korunacak diğer arama/filtre değerleri */
  query?: Record<string, string>;
}) {
  const { list } = await getContent("ui.tours");
  const items: FilterOption[] = [{ label: list.filterAll, slug: "" }, ...options];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((opt) => {
        const isActive = (active ?? "") === opt.slug;
        const qs = new URLSearchParams({ ...(opt.slug ? { kategori: opt.slug } : {}), ...query }).toString();
        const href = qs ? `${basePath}?${qs}` : basePath;
        return (
          <Link
            key={opt.slug || "all"}
            href={href}
            scroll={false}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all",
              isActive
                ? "border-brand-700 bg-brand-700 text-white shadow-soft"
                : "border-border bg-white text-brand-800 hover:border-brand-300 hover:bg-brand-50",
            )}
          >
            {opt.label}
            {opt.count != null && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs",
                  isActive ? "bg-white/20" : "bg-cream-200 text-brand-700",
                )}
              >
                {opt.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
