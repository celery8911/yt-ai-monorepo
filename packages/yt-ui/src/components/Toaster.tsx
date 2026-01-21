"use client";

import type { ReactNode } from "react";
import { useToast } from "../hooks/useToast";
import type { ToastVariant } from "./Toast";
import { Toast, ToastProvider, ToastTitle, ToastViewport } from "./Toast";

const variantIcon: Record<ToastVariant, ReactNode> = {
	success: (
		<svg
			className="h-4 w-4 text-emerald-400"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
		>
			<circle cx="12" cy="12" r="9" strokeWidth={2} />
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M8 12.5l2.5 2.5L16 9.5"
			/>
		</svg>
	),
	error: (
		<svg
			className="h-4 w-4 text-rose-400"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
		>
			<circle cx="12" cy="12" r="9" strokeWidth={2} />
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M9 9l6 6M15 9l-6 6"
			/>
		</svg>
	),
	info: (
		<svg
			className="h-4 w-4 text-blue-400"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
		>
			<circle cx="12" cy="12" r="9" strokeWidth={2} />
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2.2}
				d="M12 7.5v6.5"
			/>
			<circle cx="12" cy="16.8" r="1.2" fill="currentColor" stroke="none" />
		</svg>
	),
};

const Toaster = () => {
	const { toasts, remove } = useToast();

	return (
		<ToastProvider swipeDirection="up">
			{toasts.map((toast) => (
				<Toast
					key={toast.id}
					open={toast.open}
					duration={toast.duration}
					onOpenChange={(open: boolean) => {
						if (!open) remove(toast.id);
					}}
				>
					{variantIcon[toast.variant]}
					<ToastTitle>{toast.message}</ToastTitle>
				</Toast>
			))}
			<ToastViewport />
		</ToastProvider>
	);
};

export default Toaster;
