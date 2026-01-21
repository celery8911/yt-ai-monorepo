import type { ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "../utils/cn";

export interface TextareaProps
	extends TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: ReactNode;
}

export const Textarea = ({ label, className, ...props }: TextareaProps) => {
	return (
		<div className="w-full space-y-1.5">
			{label && (
				<label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
					{label}
				</label>
			)}
			<textarea
				className={cn(
					"flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
					className,
				)}
				{...props}
			/>
		</div>
	);
};
