import type { HTMLAttributes } from "react";
import { cn } from "../utils/cn";

export interface LoadingOverlayProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

export const LoadingOverlay = ({ size = 32, className, ...props }: LoadingOverlayProps) => (
  <div
    className={cn(
      "absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm",
      className
    )}
    {...props}
  >
    <div
      className="animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-400"
      style={{ width: size, height: size }}
    />
  </div>
);
