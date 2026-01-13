import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "@yt/ui";

const meta = {
  title: "Components/Input",
  component: Input,
  parameters: {
    layout: "centered"
  },
  tags: ["autodocs"]
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Input placeholder="请输入名称" label="名称" />
};

export const WithIcon: Story = {
  render: () => (
    <Input
      placeholder="搜索智能体..."
      label="搜索"
      icon={
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
    />
  )
};

export const Disabled: Story = {
  render: () => <Input placeholder="不可编辑" label="状态" disabled />
};
