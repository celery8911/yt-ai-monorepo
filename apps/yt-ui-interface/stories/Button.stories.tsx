// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📚 Button Story 文件
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from '@storybook/test';
import { Button } from '@qincai/ui';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📖 元数据配置
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost'],
      description: '按钮变体样式',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: '按钮尺寸',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用',
    },
    fullWidth: {
      control: 'boolean',
      description: '是否全宽显示',
    },
  },
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📚 Story 定义
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 🔵 Primary - 主要按钮
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: '主要按钮',
  },
};

// ⚪ Secondary - 次要按钮
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: '次要按钮',
  },
};

// 🔘 Outline - 轮廓按钮
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: '轮廓按钮',
  },
};

// 👻 Ghost - 幽灵按钮
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: '幽灵按钮',
  },
};

// 📏 尺寸变体
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">小按钮</Button>
      <Button size="md">中按钮</Button>
      <Button size="lg">大按钮</Button>
    </div>
  ),
};

// 🎨 所有变体
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
    </div>
  ),
};

// 🚫 禁用状态
export const Disabled: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button variant="primary" disabled>
        禁用主按钮
      </Button>
      <Button variant="outline" disabled>
        禁用轮廓按钮
      </Button>
    </div>
  ),
};

// 📐 全宽按钮
export const FullWidth: Story = {
  render: () => (
    <div className="w-80">
      <Button fullWidth variant="primary">
        全宽按钮
      </Button>
    </div>
  ),
};

// 🎯 使用示例
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button variant="primary">
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        添加
      </Button>
      <Button variant="outline">
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        删除
      </Button>
    </div>
  ),
};
