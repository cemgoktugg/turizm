import * as React from "react";
import { cn } from "@/lib/utils";

export function FormSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-soft sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-bold text-brand-900">{title}</h3>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Kayıt (register) ile uyumlu, stillendirilmiş onay kutusu satırı */
export const CheckboxRow = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string }
>(({ label, className, ...props }, ref) => (
  <label className="flex cursor-pointer items-center gap-3">
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "size-5 rounded-md border-border text-brand-700 accent-brand-700 focus:ring-brand-300",
        className,
      )}
      {...props}
    />
    <span className="text-sm font-semibold text-brand-900">{label}</span>
  </label>
));
CheckboxRow.displayName = "CheckboxRow";
