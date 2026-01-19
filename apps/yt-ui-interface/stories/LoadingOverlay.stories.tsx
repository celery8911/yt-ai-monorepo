import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card, CardContent, LoadingOverlay } from "@yt/ui";

const meta = {
  title: "Components/LoadingOverlay",
  component: LoadingOverlay,
  parameters: {
    layout: "centered"
  },
  tags: ["autodocs"]
} satisfies Meta<typeof LoadingOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="relative w-[360px]">
      <CardContent className="p-6 space-y-2">
        <p className="text-sm text-slate-400">内容加载中...</p>
        <div className="h-16 rounded-md bg-slate-900/60 border border-white/5" />
      </CardContent>
      <LoadingOverlay />
    </Card>
  )
};

export const Large: Story = {
  render: () => (
    <Card className="relative w-[360px]">
      <CardContent className="p-6 space-y-2">
        <p className="text-sm text-slate-400">大尺寸 LoadingOverlay</p>
        <div className="h-16 rounded-md bg-slate-900/60 border border-white/5" />
      </CardContent>
      <LoadingOverlay size={48} />
    </Card>
  )
};
