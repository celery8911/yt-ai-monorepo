// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📚 Card Story 文件
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 这个文件展示了 Card 组件的各种使用场景

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from '@storybook/test';

// 🧩 导入 Card 组件
// 从 @qincai/ui 包中导入组件
import { Card } from '@qincai/ui';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📖 元数据配置
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const meta = {
  // 📁 侧边栏位置：Components/Card
  title: 'Components/Card',

  // 🎯 展示的组件
  component: Card,

  // ⚙️ 参数配置
  parameters: {
    // 居中显示（方便查看）
    layout: 'centered',
  },

  // 🏷️ 自动生成文档
  tags: ['autodocs'],

  // 🎨 控件类型配置
  argTypes: {
    // variant 下拉选择器
    variant: {
      control: 'select',
      options: ['default', 'bordered', 'elevated'],
      description: '卡片样式变体',
    },

    // showActions 布尔开关
    showActions: {
      control: 'boolean',
      description: '是否显示操作按钮',
    },

    // title 文本输入
    title: {
      control: 'text',
      description: '卡片标题',
    },

    // description 多行文本
    description: {
      control: 'text',
      description: '卡片描述',
    },

    // imageUrl 文本输入
    imageUrl: {
      control: 'text',
      description: '图片 URL',
    },
  },

  // 📌 默认参数（所有 Story 共享）
  args: {
    // 监听按钮点击事件
    onPrimaryAction: fn(),
    onSecondaryAction: fn(),
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📚 Story 定义
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 🎨 默认卡片 - 展示基础样式
export const Default: Story = {
  args: {
    title: '产品标题',
    description: '这是一个使用 Tailwind CSS 构建的卡片组件。支持多种样式变体、悬停效果和响应式布局。',
    variant: 'default',
    showActions: true,
  },
};

// 🖼️ 带图片的卡片
export const WithImage: Story = {
  args: {
    title: '美丽的风景',
    description: '这张图片展示了令人惊叹的自然风光，配合卡片组件的圆角设计，营造出优雅的视觉效果。',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    variant: 'default',
    showActions: true,
  },
};

// 📦 边框样式卡片
export const Bordered: Story = {
  args: {
    title: '边框样式',
    description: '使用 border-2 和 border-gray-200 创建的边框效果，适合需要明确边界的设计场景。',
    variant: 'bordered',
    showActions: true,
  },
};

// 🌟 悬浮样式卡片
export const Elevated: Story = {
  args: {
    title: '悬浮效果',
    description: '通过 shadow-lg 实现的悬浮效果，让卡片看起来漂浮在页面之上，适合强调重要内容。',
    imageUrl: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=300&fit=crop',
    variant: 'elevated',
    showActions: true,
  },
};

// 📝 无操作按钮的卡片
export const WithoutActions: Story = {
  args: {
    title: '纯展示卡片',
    description: '有时候卡片只需要展示信息，不需要操作按钮。这个示例展示了如何隐藏操作区域。',
    imageUrl: 'https://images.unsplash.com/photo-1682687221038-404cb8830901?w=400&h=300&fit=crop',
    showActions: false,
  },
};

// 🎯 自定义按钮文本
export const CustomButtons: Story = {
  args: {
    title: '自定义按钮',
    description: '可以自定义主要和次要按钮的文本，适配不同的业务场景。',
    imageUrl: 'https://images.unsplash.com/photo-1682687220208-22d7a2543e88?w=400&h=300&fit=crop',
    variant: 'elevated',
    primaryActionLabel: '立即购买',
    secondaryActionLabel: '了解更多',
  },
};

// 📄 纯文本卡片（无图片）
export const TextOnly: Story = {
  args: {
    title: '产品特性介绍',
    description: '我们的产品提供了强大的功能集合，包括自动化工作流、智能分析、实时协作等特性。无论是小团队还是大企业，都能找到适合的解决方案。点击下方按钮了解更多详情。',
    variant: 'default',
  },
};

// 🎨 展示所有变体（用于对比）
export const AllVariants: Story = {
  // 使用 render 函数自定义渲染
  render: () => (
    <div className="flex gap-6 flex-wrap">
      <Card
        title="默认样式"
        description="shadow-md 阴影效果"
        variant="default"
        showActions={false}
      />
      <Card
        title="边框样式"
        description="border-2 边框效果"
        variant="bordered"
        showActions={false}
      />
      <Card
        title="悬浮样式"
        description="shadow-lg 大阴影效果"
        variant="elevated"
        showActions={false}
      />
    </div>
  ),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💡 Storybook 学习要点
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/*
1. 每个 Story 展示组件的一个使用场景
   - Default: 基础用法
   - WithImage: 带图片
   - Bordered: 不同样式
   - CustomButtons: 自定义配置

2. argTypes 定义控件类型
   - control: 'text'    - 文本输入框
   - control: 'boolean' - 开关
   - control: 'select'  - 下拉选择

3. render 函数用于自定义渲染
   - 当需要展示多个组件时
   - 需要特殊布局时

4. fn() 监听函数
   - 在 Actions 面板中显示事件
   - 帮助调试组件交互

5. 图片来源
   - 使用 Unsplash 提供的免费图片
   - 参数：w=宽度, h=高度, fit=裁剪方式
*/
