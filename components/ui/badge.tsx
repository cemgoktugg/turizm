import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-semibold",
  {
    variants: {
      variant: {
        gold: "bg-gold-100 text-gold-800",
        brand: "bg-brand-100 text-brand-800",
        navy: "bg-navy-100 text-navy-800",
        cream: "bg-cream-200 text-brand-800",
        outline: "border border-brand-200 text-brand-700",
        green: "bg-green-100 text-green-800",
        red: "bg-red-100 text-red-700",
        amber: "bg-amber-100 text-amber-800",
        blue: "bg-blue-100 text-blue-800",
        slate: "bg-slate-100 text-slate-700",
      },
      size: {
        sm: "px-2.5 py-0.5 text-[11px]",
        md: "px-3 py-1 text-xs",
      },
    },
    defaultVariants: { variant: "brand", size: "md" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}
