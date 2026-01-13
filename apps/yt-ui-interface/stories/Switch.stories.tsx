import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Switch } from "@yt/ui";

const meta = {
  title: "Components/Switch",
  component: Switch,
  parameters: {
    layout: "centered"
  },
  tags: ["autodocs"]
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [checked, setChecked] = useState(true);
    return <Switch checked={checked} onChange={setChecked} label="通知" />;
  }
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Switch checked onChange={() => {}} disabled label="已启用" />
      <Switch checked={false} onChange={() => {}} disabled label="已关闭" />
    </div>
  )
};
