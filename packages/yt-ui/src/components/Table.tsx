import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

export interface TableSectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export const Table = ({ children, className, ...props }: TableProps) => (
  <div className="relative w-full overflow-auto">
    <table className={cn("w-full caption-bottom text-sm", className)} {...props}>
      {children}
    </table>
  </div>
);

export const THead = ({ children, className, ...props }: TableSectionProps) => (
  <thead className={cn("border-b border-border text-muted-foreground", className)} {...props}>
    {children}
  </thead>
);

export const TBody = ({ children, className, ...props }: TableSectionProps) => (
  <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props}>
    {children}
  </tbody>
);

export const TH = ({ children, className, ...props }: TableSectionProps) => (
  <th
    className={cn(
      "h-12 px-4 text-left align-middle text-sm font-semibold uppercase tracking-wider text-muted-foreground",
      className
    )}
    {...props}
  >
    {children}
  </th>
);

export const TD = ({ children, className, ...props }: TableSectionProps) => (
  <td className={cn("p-4 align-middle", className)} {...props}>
    {children}
  </td>
);

export const TR = ({ children, className, ...props }: TableSectionProps) => (
  <tr className={cn("border-b border-border transition-colors hover:bg-muted/50", className)} {...props}>
    {children}
  </tr>
);
