import Link from "next/link";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/** Liste sayfaları için filtre sekmeleri + arama (GET formu, JS gerektirmez) */
export function ListToolbar({
  basePath,
  tabs,
  activeTab,
  tabParam = "filtre",
  query,
  searchPlaceholder = "Ara...",
  children,
}: {
  basePath: string;
  tabs: { value: string; label: string; count?: number }[];
  activeTab: string;
  tabParam?: string;
  query?: string;
  searchPlaceholder?: string;
  children?: React.ReactNode;
}) {
  const href = (tab: string) => {
    const p = new URLSearchParams();
    if (tab) p.set(tabParam, tab);
    if (query) p.set("q", query);
    const s = p.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.value || "all"}
            href={href(t.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition",
              activeTab === t.value
                ? "border-brand-700 bg-brand-700 text-white"
                : "border-border bg-white text-brand-800 hover:border-brand-300",
            )}
          >
            {t.label}
            {t.count != null && (
              <span className={cn("rounded-full px-1.5 text-xs", activeTab === t.value ? "bg-white/20" : "bg-cream-200")}>{t.count}</span>
            )}
          </Link>
        ))}
      </div>
      <div className="flex gap-2">
        <form action={basePath} className="relative flex-1 lg:w-72">
          {activeTab && <input type="hidden" name={tabParam} value={activeTab} />}
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            name="q"
            defaultValue={query}
            placeholder={searchPlaceholder}
            className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </form>
        {children}
      </div>
    </div>
  );
}
