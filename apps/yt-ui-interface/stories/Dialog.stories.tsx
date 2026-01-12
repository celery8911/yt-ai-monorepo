// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📚 Dialog Story 文件
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 展示 Radix Dialog 组件的各种使用场景

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from '@storybook/test';
import { useState } from 'react';

// 🧩 导入 Dialog 组件
// 从 @qincai/ui 包中导入组件
import { Dialog } from '@qincai/ui';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📖 元数据配置
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],

  // 🎨 控件配置
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: '对话框尺寸',
    },
    showCloseButton: {
      control: 'boolean',
      description: '是否显示关闭按钮',
    },
    showFooter: {
      control: 'boolean',
      description: '是否显示页脚',
    },
  },

  // 📌 默认参数
  args: {
    onPrimaryAction: fn(),
    onSecondaryAction: fn(),
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📚 Story 定义
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 🎯 基础用法 - 最简单的对话框
export const Default: Story = {
  args: {
    trigger: (
      <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
        打开对话框
      </button>
    ),
    title: '对话框标题',
    description: '这是一个基于 Radix UI 构建的对话框组件，支持完整的无障碍性。',
    children: (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          这是对话框的主体内容。你可以在这里放置任何内容，比如表单、图片、文本等。
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>提示：</strong>尝试按 <kbd className="px-2 py-1 bg-white border rounded">Esc</kbd> 键关闭对话框
          </p>
        </div>
      </div>
    ),
  },
};

// 📝 表单对话框 - 展示如何在对话框中使用表单
export const WithForm: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <Dialog
        open={open}
        onOpenChange={setOpen}
        trigger={
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            创建新用户
          </button>
        }
        title="创建新用户"
        description="请填写用户信息"
        onPrimaryAction={() => {
          alert('用户创建成功！');
          setOpen(false);
        }}
        primaryActionLabel="创建"
        secondaryActionLabel="取消"
      >
        <form className="space-y-4">
          {/* 用户名输入 */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              用户名
            </label>
            <input
              id="username"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入用户名"
            />
          </div>

          {/* 邮箱输入 */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="user@example.com"
            />
          </div>

          {/* 角色选择 */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              角色
            </label>
            <select
              id="role"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>管理员</option>
              <option>编辑者</option>
              <option>查看者</option>
            </select>
          </div>
        </form>
      </Dialog>
    );
  },
};

// ⚠️ 确认对话框 - 用于危险操作的确认
export const Confirmation: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <Dialog
        open={open}
        onOpenChange={setOpen}
        trigger={
          <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
            删除账户
          </button>
        }
        title="确认删除"
        description="此操作无法撤销"
        onPrimaryAction={() => {
          alert('账户已删除');
          setOpen(false);
        }}
        onSecondaryAction={() => {
          setOpen(false);
        }}
        primaryActionLabel="确认删除"
        secondaryActionLabel="取消"
        size="sm"
      >
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-start gap-3">
            <svg
              className="h-6 w-6 text-red-600 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-red-900 mb-1">
                警告
              </h4>
              <p className="text-sm text-red-800">
                删除账户后，所有数据将被永久清除，包括：
              </p>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                <li>个人资料</li>
                <li>上传的文件</li>
                <li>历史记录</li>
              </ul>
            </div>
          </div>
        </div>
      </Dialog>
    );
  },
};

// 📏 不同尺寸 - 展示所有尺寸选项
export const Sizes: Story = {
  render: () => (
    <div className="flex gap-4">
      <Dialog
        trigger={
          <button className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm">
            Small
          </button>
        }
        title="小尺寸对话框"
        size="sm"
      >
        <p className="text-sm text-gray-600">这是一个小尺寸的对话框</p>
      </Dialog>

      <Dialog
        trigger={
          <button className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm">
            Medium
          </button>
        }
        title="中等尺寸对话框"
        size="md"
      >
        <p className="text-sm text-gray-600">这是一个中等尺寸的对话框（默认）</p>
      </Dialog>

      <Dialog
        trigger={
          <button className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm">
            Large
          </button>
        }
        title="大尺寸对话框"
        size="lg"
      >
        <p className="text-sm text-gray-600">这是一个大尺寸的对话框</p>
      </Dialog>

      <Dialog
        trigger={
          <button className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm">
            Extra Large
          </button>
        }
        title="特大尺寸对话框"
        size="xl"
      >
        <p className="text-sm text-gray-600">这是一个特大尺寸的对话框</p>
      </Dialog>
    </div>
  ),
};

// 🎨 自定义内容 - 丰富的内容示例
export const RichContent: Story = {
  args: {
    trigger: (
      <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
        查看产品详情
      </button>
    ),
    title: 'iPhone 15 Pro',
    description: '钛金属设计，A17 Pro 芯片，专业级相机系统',
    size: 'lg',
    showFooter: false,
    children: (
      <div className="space-y-4">
        {/* 图片 */}
        <img
          src="https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=600&h=400&fit=crop"
          alt="iPhone 15 Pro"
          className="w-full h-48 object-cover rounded-lg"
        />

        {/* 特性列表 */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 7H7v6h6V7z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">A17 Pro 芯片</h4>
              <p className="text-sm text-gray-600">行业领先的性能和能效</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">专业相机系统</h4>
              <p className="text-sm text-gray-600">4800 万像素主摄，5 倍光学变焦</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">钛金属设计</h4>
              <p className="text-sm text-gray-600">航空级钛金属，轻盈坚固</p>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-4">
          <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            立即购买
          </button>
          <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
            了解更多
          </button>
        </div>
      </div>
    ),
  },
};

// 🎹 键盘交互演示
export const KeyboardInteraction: Story = {
  args: {
    trigger: (
      <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
        测试键盘交互
      </button>
    ),
    title: '键盘交互指南',
    description: 'Radix 自动处理所有键盘交互',
    children: (
      <div className="space-y-4">
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h4 className="font-medium text-indigo-900 mb-3">⌨️ 支持的键盘操作：</h4>
          <ul className="space-y-2 text-sm text-indigo-800">
            <li className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-white border border-indigo-300 rounded font-mono text-xs">
                Esc
              </kbd>
              <span>关闭对话框</span>
            </li>
            <li className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-white border border-indigo-300 rounded font-mono text-xs">
                Tab
              </kbd>
              <span>在对话框内的元素间切换（焦点锁定）</span>
            </li>
            <li className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-white border border-indigo-300 rounded font-mono text-xs">
                Shift+Tab
              </kbd>
              <span>反向切换焦点</span>
            </li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-3">♿ 无障碍特性：</h4>
          <ul className="space-y-1 text-sm text-green-800 list-disc list-inside">
            <li>自动添加 <code className="bg-white px-1 rounded">role="dialog"</code></li>
            <li>自动添加 <code className="bg-white px-1 rounded">aria-modal="true"</code></li>
            <li>焦点自动聚焦到对话框</li>
            <li>焦点锁定在对话框内</li>
            <li>关闭后焦点返回触发按钮</li>
          </ul>
        </div>
      </div>
    ),
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💡 使用提示
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/*
1. 受控模式 vs 非受控模式
   - 受控：传入 open 和 onOpenChange（适合复杂逻辑）
   - 非受控：不传 open（Radix 内部管理状态）

2. asChild 模式
   - trigger 使用自定义按钮时，Radix 会将功能注入到按钮
   - 避免额外的 DOM 包装

3. 焦点管理
   - 打开时：焦点自动移到对话框
   - 关闭时：焦点返回触发按钮
   - Tab 键：只在对话框内循环

4. 动画
   - 使用 Tailwind 的 data-[state] 选择器
   - data-[state=open]: 打开动画
   - data-[state=closed]: 关闭动画

5. 最佳实践
   - 总是提供 title（无障碍性要求）
   - description 用于额外说明
   - 危险操作使用确认对话框
   - 表单放在对话框中要确保焦点管理正确
*/
