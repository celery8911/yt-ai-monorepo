import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "@yt/ui";

const meta = {
  title: "Components/Badge",
  component: Badge,
  parameters: {
    layout: "centered"
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["blue", "purple", "green", "yellow", "red", "outline"],
      description: "标签风格"
    }
  }
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "NEW",
    variant: "blue"
  }
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="blue">BLUE</Badge>
      <Badge variant="purple">PURPLE</Badge>
      <Badge variant="green">GREEN</Badge>
      <Badge variant="yellow">YELLOW</Badge>
      <Badge variant="red">RED</Badge>
      <Badge variant="outline">OUTLINE</Badge>
    </div>
  )
};
