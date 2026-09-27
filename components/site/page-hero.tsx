import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { cn } from "@/lib/utils";
import { getContent } from "@/lib/content";

export type Crumb = { label: string; href?: string };

export async function PageHero({
  title,
  description,
  image = "/images/cta-bg.svg",
  crumbs = [],
  align = "center",
  size = "md",
}: {
  title: string;
  description?: string;
  image?: string;
  crumbs?: Crumb[];
  align?: "center" | "left";
  size?: "sm" | "md";
}) {
  const ui = await getContent("ui.general");
  return (
    <section
      className={cn(
        "relative flex items-center overflow-hidden bg-brand-950",
        size === "md" ? "min-h-[320px] py-16 lg:min-h-[380px]" : "min-h-[240px] py-12",
      )}
    >
      <SmartImage src={image} alt="" className="absolute inset-0 size-full opacity-45" />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/70 to-brand-950/40" />

      <div
        className={cn(
          "container-tr relative",
          align === "center" ? "text-center" : "text-left",
        )}
      >
        {/* Breadcrumb */}
        <nav
          className={cn(
            "flex flex-wrap items-center gap-1.5 text-xs text-cream-200/70",
            align === "center" ? "justify-center" : "justify-start",
          )}
        >
          <Link href="/" className="inline-flex items-center gap-1 hover:text-gold-300">
            <Home className="size-3.5" /> {ui.breadcrumbHome}
          </Link>
          {crumbs.map((c, i) => (
            <span key={i} className="inline-flex items-center gap-1.5">
              <ChevronRight className="size-3.5 opacity-50" />
              {c.href ? (
                <Link href={c.href} className="hover:text-gold-300">
                  {c.label}
                </Link>
              ) : (
                <span className="text-gold-300">{c.label}</span>
              )}
            </span>
          ))}
        </nav>

        <h1 className="mt-4 font-serif text-3xl font-bold text-white text-balance sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description && (
          <p
            className={cn(
              "mt-4 text-base leading-relaxed text-cream-100/80",
              align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl",
            )}
          >
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
