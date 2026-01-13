import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge, Table, TBody, TD, TH, THead, TR } from "@yt/ui";

const meta = {
  title: "Components/Table",
  component: Table,
  parameters: {
    layout: "centered"
  },
  tags: ["autodocs"]
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-[560px]">
      <Table>
        <THead>
          <TR>
            <TH>任务</TH>
            <TH>状态</TH>
            <TH className="text-right">金额</TH>
          </TR>
        </THead>
        <TBody>
          <TR>
            <TD>跨链流动性优化</TD>
            <TD>
              <Badge variant="green">SUCCESS</Badge>
            </TD>
            <TD className="text-right">1.2 ETH</TD>
          </TR>
          <TR>
            <TD>链上安全审计</TD>
            <TD>
              <Badge variant="yellow">PENDING</Badge>
            </TD>
            <TD className="text-right">0.6 ETH</TD>
          </TR>
          <TR>
            <TD>市场情绪分析</TD>
            <TD>
              <Badge variant="blue">RUNNING</Badge>
            </TD>
            <TD className="text-right">0.3 ETH</TD>
          </TR>
        </TBody>
      </Table>
    </div>
  )
};
