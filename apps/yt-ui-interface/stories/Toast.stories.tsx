// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📚 Toast Story 文件
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type { Meta, StoryObj } from "@storybook/react";
import {
	Button,
	Toast,
	ToastProvider,
	ToastTitle,
	ToastViewport,
} from "@yt/ui";
import { useState } from "react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📖 元数据配置
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const meta = {
	title: "Components/Toast",
	component: Toast,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📚 Story 定义
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const Basic: Story = {
	render: () => {
		const [open, setOpen] = useState(false);

		return (
			<ToastProvider swipeDirection="up">
				<div className="flex flex-col items-center gap-4">
					<Button variant="outline" onClick={() => setOpen(true)}>
						触发 Toast
					</Button>
					<Toast open={open} duration={3000} onOpenChange={setOpen}>
						<ToastTitle>操作已完成</ToastTitle>
					</Toast>
				</div>
				<ToastViewport />
			</ToastProvider>
		);
	},
};
