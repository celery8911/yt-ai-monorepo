import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardContent, CardHeader, LoadingOverlay } from "@yt/ui";

const meta = {
	title: "Components/Card",
	component: Card,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: "Card",
	},
	render: () => (
		<Card className="max-w-sm">
			<CardHeader>
				<h3 className="text-lg font-bold">智能体性能概览</h3>
			</CardHeader>
			<CardContent>
				<p className="text-sm text-slate-400">
					过去 24 小时内，该智能体完成了 18 个任务，成功率 96%。
				</p>
			</CardContent>
		</Card>
	),
};

export const WithGlow: Story = {
	args: {
		children: "Card",
	},
	render: () => (
		<Card glow className="max-w-sm">
			<CardHeader>
				<h3 className="text-lg font-bold">链上收益</h3>
			</CardHeader>
			<CardContent className="space-y-2">
				<p className="text-3xl font-black text-blue-400">2.45 ETH</p>
				<p className="text-xs text-slate-500 uppercase">过去 7 天累计</p>
			</CardContent>
		</Card>
	),
};

export const WithLoadingOverlay: Story = {
	args: {
		children: "Card",
	},
	render: () => (
		<Card className="relative w-[320px]">
			<CardHeader>
				<h3 className="text-lg font-bold">数据面板</h3>
			</CardHeader>
			<CardContent className="space-y-2">
				<p className="text-sm text-slate-400">加载状态下的卡片样式。</p>
			</CardContent>
			<LoadingOverlay />
		</Card>
	),
};
