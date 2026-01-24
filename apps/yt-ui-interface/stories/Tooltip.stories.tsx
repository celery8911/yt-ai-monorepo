// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📚 Tooltip Story 文件
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type { Meta, StoryObj } from "@storybook/react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@yt/ui";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📖 元数据配置
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const meta = {
	title: "Components/Tooltip",
	component: Tooltip,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📚 Story 定义
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const Default: Story = {
	render: () => (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button variant="outline">悬停查看提示</Button>
				</TooltipTrigger>
				<TooltipContent>这是一个提示说明</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	),
};

export const WithDescription: Story = {
	render: () => (
		<TooltipProvider>
			<div className="flex items-center gap-3">
				<Tooltip>
					<TooltipTrigger asChild>
						<span className="px-3 py-2 rounded-md border border-white/10 text-sm">
							信息点
						</span>
					</TooltipTrigger>
					<TooltipContent>这里可以展示更详细的描述或说明信息。</TooltipContent>
				</Tooltip>
				<span className="text-xs text-slate-400">把鼠标移到“信息点”</span>
			</div>
		</TooltipProvider>
	),
};
