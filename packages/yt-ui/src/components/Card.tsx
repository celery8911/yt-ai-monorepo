import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
	glow?: boolean;
	children: ReactNode;
}

export interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
}

export const Card = ({
	glow = false,
	className,
	children,
	...props
}: CardProps) => (
	<div
		className={cn(
			"rounded-lg border border-border/60 bg-card text-card-foreground shadow-sm transition-all",
			glow && "hover:shadow-[0_0_30px_rgba(37,99,235,0.15)]",
			className,
		)}
		{...props}
	>
		{children}
	</div>
);

export const CardHeader = ({
	className,
	children,
	...props
}: CardSectionProps) => (
	<div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props}>
		{children}
	</div>
);

export const CardContent = ({
	className,
	children,
	...props
}: CardSectionProps) => (
	<div className={cn("p-6 pt-0", className)} {...props}>
		{children}
	</div>
);
