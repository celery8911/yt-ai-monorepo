import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  label?: string;
}

export const Input = ({ className, icon, label, type, ...props }: InputProps) => {
  return (
    <div className="w-full space-y-1.5 group">
      {label && (
        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 transition-colors group-focus-within:text-primary">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            icon && "pl-10",
            className
          )}
          {...props}
        />
      </div>
    </div>
  );
};
