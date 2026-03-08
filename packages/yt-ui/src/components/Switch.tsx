import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../utils/cn";

export interface SwitchProps
	extends Omit<
		ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
		"onChange"
	> {
	checked: boolean;
	onChange: (checked: boolean) => void;
	label?: string;
}

export const Switch = ({
	checked,
	onChange,
	label,
	className,
	...props
}: SwitchProps) => {
	return (
		<label className="inline-flex items-center cursor-pointer gap-3">
			<SwitchPrimitive.Root
				checked={checked}
				onCheckedChange={onChange}
				className={cn(
					"peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
					className,
				)}
				{...props}
			>
				<SwitchPrimitive.Thumb
					className={cn(
						"pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
					)}
				/>
			</SwitchPrimitive.Root>
			{label && (
				<span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
					{label}
				</span>
			)}
		</label>
	);
};
