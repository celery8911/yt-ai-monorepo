"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import type { ComponentPropsWithoutRef, ComponentRef } from "react";
import { forwardRef } from "react";
import { cn } from "../utils/cn";

export type ToastVariant = "success" | "error" | "info";

export const ToastProvider = ToastPrimitive.Provider;

export const ToastViewport = forwardRef<
	ComponentRef<typeof ToastPrimitive.Viewport>,
	ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
	<ToastPrimitive.Viewport
		ref={ref}
		className={cn(
			"fixed top-6 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4",
			className,
		)}
		{...props}
	/>
));
ToastViewport.displayName = "ToastViewport";

export const Toast = forwardRef<
	ComponentRef<typeof ToastPrimitive.Root>,
	ComponentPropsWithoutRef<typeof ToastPrimitive.Root>
>(({ className, ...props }, ref) => (
	<ToastPrimitive.Root
		ref={ref}
		className={cn(
			"group pointer-events-auto relative flex w-full items-center gap-3 rounded-xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-slate-100 shadow-lg shadow-blue-500/10 backdrop-blur",
			className,
		)}
		{...props}
	/>
));
Toast.displayName = "Toast";

export const ToastTitle = forwardRef<
	ComponentRef<typeof ToastPrimitive.Title>,
	ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
	<ToastPrimitive.Title
		ref={ref}
		className={cn("text-sm font-semibold", className)}
		{...props}
	/>
));
ToastTitle.displayName = "ToastTitle";
