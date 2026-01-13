import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select } from "@yt/ui";

const meta = {
  title: "Components/Select",
  component: Select,
  parameters: {
    layout: "centered"
  },
  tags: ["autodocs"]
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select label="任务类型">
      <option>全部类型</option>
      <option>DEFI</option>
      <option>DATA</option>
      <option>DEV</option>
    </Select>
  )
};

export const Disabled: Story = {
  render: () => (
    <Select label="状态" disabled>
      <option>已禁用</option>
    </Select>
  )
};
