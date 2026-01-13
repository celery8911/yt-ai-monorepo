import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "@yt/ui";

const meta = {
  title: "Components/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered"
  },
  tags: ["autodocs"]
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Textarea label="详细说明" placeholder="请输入任务描述..." />
};

export const Disabled: Story = {
  render: () => <Textarea label="只读" disabled defaultValue="当前不可编辑" />
};
