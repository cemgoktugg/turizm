import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-700 text-white shadow-soft hover:bg-brand-800 hover:shadow-card",
        gold: "bg-gold-400 text-brand-950 shadow-gold hover:bg-gold-300",
        outline:
          "border border-brand-700 text-brand-800 hover:bg-brand-50",
        ghost: "text-brand-800 hover:bg-brand-50",
        white: "bg-white text-brand-800 shadow-soft hover:bg-cream-100",
        whatsapp: "bg-[#25D366] text-white shadow-soft hover:bg-[#1eb955]",
        danger: "bg-red-600 text-white hover:bg-red-700",
        subtle: "bg-cream-200 text-brand-800 hover:bg-cream-300",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-sm",
        lg: "h-13 px-8 text-base py-3.5",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
