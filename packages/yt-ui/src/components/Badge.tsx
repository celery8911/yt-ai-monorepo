import type { HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest transition-colors",
  {
    variants: {
      variant: {
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        yellow: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        red: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        outline: "bg-transparent text-muted-foreground border-border/60"
      }
    },
    defaultVariants: {
      variant: "blue"
    }
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  children: ReactNode;
}

export const Badge = ({ children, variant, className, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ variant }), className)} {...props}>
    {children}
  </span>
);
