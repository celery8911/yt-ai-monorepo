// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📚 Toaster Story 文件
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type { Meta, StoryObj } from "@storybook/react";
import { Button, Toaster, useToast } from "@yt/ui";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📖 元数据配置
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const meta = {
	title: "Components/Toaster",
	component: Toaster,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📚 Story 定义
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ToastDemo = () => {
	const { toast } = useToast();

	return (
		<div className="flex flex-col items-center gap-4">
			<div className="flex flex-wrap justify-center gap-3">
				<Button
					variant="primary"
					onClick={() => toast({ message: "保存成功", variant: "success" })}
				>
					成功提示
				</Button>
				<Button
					variant="secondary"
					onClick={() => toast({ message: "出现错误", variant: "error" })}
				>
					错误提示
				</Button>
				<Button
					variant="outline"
					onClick={() =>
						toast({ message: "提醒：请检查配置", variant: "info" })
					}
				>
					信息提示
				</Button>
			</div>
			<Toaster />
		</div>
	);
};

export const Default: Story = {
	render: () => <ToastDemo />,
};
