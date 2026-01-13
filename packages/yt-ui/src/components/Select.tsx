import type { SelectHTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export const Select = ({ label, className, children, ...props }: SelectProps) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        <select
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-9 text-sm text-foreground shadow-sm transition-colors appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-focus-within:text-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};
