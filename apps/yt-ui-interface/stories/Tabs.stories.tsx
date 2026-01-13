import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Tabs } from "@yt/ui";

const meta = {
  title: "Components/Tabs",
  component: Tabs,
  parameters: {
    layout: "centered"
  },
  tags: ["autodocs"]
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [active, setActive] = useState("overview");
    return (
      <div className="w-[420px] space-y-4">
        <Tabs
          tabs={[
            { id: "overview", label: "概览" },
            { id: "metrics", label: "指标" },
            { id: "logs", label: "日志" }
          ]}
          activeTab={active}
          onChange={setActive}
        />
        <p className="text-sm text-muted-foreground">当前选中：{active}</p>
      </div>
    );
  }
};
