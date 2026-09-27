import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AdminPageHeader({
  title,
  description,
  actionLabel,
  actionHref,
  children,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-serif text-2xl font-bold text-brand-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {children}
      {actionLabel && actionHref && (
        <Link href={actionHref} className={buttonVariants({ variant: "primary" })}>
          <Plus className="size-4" /> {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function AdminCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-white shadow-soft", className)}>
      {children}
    </div>
  );
}

export function EmptyState({
  title = "Kayıt bulunamadı",
  description,
  actionLabel,
  actionHref,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
      <p className="font-serif text-lg font-bold text-brand-900">{title}</p>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className={cn(buttonVariants({ variant: "primary", size: "sm" }), "mt-4")}>
          <Plus className="size-4" /> {actionLabel}
        </Link>
      )}
    </div>
  );
}
