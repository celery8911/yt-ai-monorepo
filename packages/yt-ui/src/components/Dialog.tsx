// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎭 Dialog 组件 - 基于 Radix UI + Tailwind CSS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 这个组件展示了如何使用 Radix UI 构建无障碍的对话框

// 📦 导入 Radix Dialog 的所有组件
// Radix 使用"命名空间导入"模式，所有相关组件都在 Dialog 命名空间下
import * as Dialog from '@radix-ui/react-dialog';
import { ReactNode } from 'react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 TypeScript 接口定义
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface DialogProps {
  /** 是否打开对话框（受控模式） */
  open?: boolean;

  /** 对话框打开/关闭状态变化的回调 */
  onOpenChange?: (open: boolean) => void;

  /** 触发按钮的内容 */
  trigger?: ReactNode;

  /** 对话框标题 */
  title: string;

  /** 对话框描述（可选） */
  description?: string;

  /** 对话框主体内容 */
  children: ReactNode;

  /** 是否显示关闭按钮（默认 true） */
  showCloseButton?: boolean;

  /** 是否显示页脚（默认 true） */
  showFooter?: boolean;

  /** 主要操作按钮文本 */
  primaryActionLabel?: string;

  /** 次要操作按钮文本 */
  secondaryActionLabel?: string;

  /** 主要操作点击事件 */
  onPrimaryAction?: () => void;

  /** 次要操作点击事件 */
  onSecondaryAction?: () => void;

  /** 对话框尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧩 Dialog 组件
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 对话框组件
 *
 * 基于 Radix UI 实现，提供完整的无障碍性支持：
 * - ⌨️ Escape 键关闭
 * - 🔒 焦点锁定在对话框内
 * - 📱 点击遮罩关闭
 * - ♿ 完整的 ARIA 属性
 * - 🎨 Tailwind CSS 样式
 */
export const DialogComponent = ({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  showCloseButton = true,
  showFooter = true,
  primaryActionLabel = '确认',
  secondaryActionLabel = '取消',
  onPrimaryAction,
  onSecondaryAction,
  size = 'md',
}: DialogProps) => {
  // 🎨 根据 size 决定对话框宽度
  const sizeStyles = {
    sm: 'max-w-sm',   // 24rem (384px)
    md: 'max-w-md',   // 28rem (448px)
    lg: 'max-w-lg',   // 32rem (512px)
    xl: 'max-w-xl',   // 36rem (576px)
  };

  return (
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎯 Dialog.Root - 对话框根组件
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 这是整个对话框的容器，管理打开/关闭状态
    <Dialog.Root open={open} onOpenChange={onOpenChange}>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          🔘 Dialog.Trigger - 触发按钮
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          点击这个按钮会打开对话框
          Radix 自动添加：
          - aria-haspopup="dialog"
          - aria-expanded="true/false"
          - aria-controls="对话框ID"
      */}
      {trigger && (
        <Dialog.Trigger asChild>
          {trigger}
        </Dialog.Trigger>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          🌐 Dialog.Portal - React Portal
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          将对话框渲染到 document.body 的末尾
          好处：
          1. 避免 z-index 冲突
          2. 避免 overflow: hidden 影响
          3. 更容易管理遮罩层
      */}
      <Dialog.Portal>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            🎭 Dialog.Overlay - 遮罩层
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            半透明背景，点击可关闭对话框
        */}
        <Dialog.Overlay
          className="
            fixed inset-0
            bg-black/50
            backdrop-blur-sm
            data-[state=open]:animate-in
            data-[state=closed]:animate-out
            data-[state=closed]:fade-out-0
            data-[state=open]:fade-in-0
            z-50
          "
        />

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            📦 Dialog.Content - 对话框主体
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            对话框的主要内容容器
            Radix 自动添加：
            - role="dialog"
            - aria-modal="true"
            - aria-labelledby="标题ID"
            - aria-describedby="描述ID"
            - 焦点锁定（Tab 键只在对话框内循环）
            - Escape 键关闭
        */}
        <Dialog.Content
          className={`
            fixed
            left-1/2
            top-1/2
            -translate-x-1/2
            -translate-y-1/2
            z-50
            w-full
            ${sizeStyles[size]}
            bg-white
            rounded-lg
            shadow-xl
            p-6
            data-[state=open]:animate-in
            data-[state=closed]:animate-out
            data-[state=closed]:fade-out-0
            data-[state=open]:fade-in-0
            data-[state=closed]:zoom-out-95
            data-[state=open]:zoom-in-95
            data-[state=closed]:slide-out-to-left-1/2
            data-[state=closed]:slide-out-to-top-[48%]
            data-[state=open]:slide-in-from-left-1/2
            data-[state=open]:slide-in-from-top-[48%]
            duration-200
          `}
        >
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              📌 对话框头部
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  📝 Dialog.Title - 标题
                  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  自动生成唯一 ID，并通过 aria-labelledby 关联到 Content
                  屏幕阅读器会读出："标题文字，对话框"
              */}
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                {title}
              </Dialog.Title>

              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  📄 Dialog.Description - 描述
                  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  自动生成唯一 ID，并通过 aria-describedby 关联到 Content
                  提供额外的上下文信息
              */}
              {description && (
                <Dialog.Description className="mt-2 text-sm text-gray-600">
                  {description}
                </Dialog.Description>
              )}
            </div>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                ❌ Dialog.Close - 关闭按钮
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                点击会关闭对话框（触发 onOpenChange(false)）
            */}
            {showCloseButton && (
              <Dialog.Close
                className="
                  rounded-sm
                  opacity-70
                  transition-opacity
                  hover:opacity-100
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                  focus:ring-offset-2
                "
                aria-label="关闭对话框"
              >
                {/* ✕ 关闭图标 */}
                <svg
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Dialog.Close>
            )}
          </div>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              📦 对话框主体内容
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          */}
          <div className="py-4">
            {children}
          </div>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              🔘 对话框页脚（操作按钮）
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          */}
          {showFooter && (
            <div className="flex justify-end gap-3 mt-6">
              {/* 次要操作按钮（取消） */}
              <Dialog.Close asChild>
                <button
                  onClick={onSecondaryAction}
                  className="
                    px-4
                    py-2
                    text-sm
                    font-medium
                    text-gray-700
                    bg-gray-100
                    rounded-md
                    hover:bg-gray-200
                    focus:outline-none
                    focus:ring-2
                    focus:ring-gray-400
                    focus:ring-offset-2
                    transition-colors
                  "
                >
                  {secondaryActionLabel}
                </button>
              </Dialog.Close>

              {/* 主要操作按钮（确认） */}
              <button
                onClick={onPrimaryAction}
                className="
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-white
                  bg-blue-600
                  rounded-md
                  hover:bg-blue-700
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                  focus:ring-offset-2
                  transition-colors
                "
              >
                {primaryActionLabel}
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

// 💡 为了方便使用，导出一个简化的名称
export { DialogComponent as Dialog };

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📚 Radix UI 核心概念总结
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/*
1. 复合组件模式（Compound Components）
   - Dialog.Root      → 容器，管理状态
   - Dialog.Trigger   → 触发器
   - Dialog.Portal    → React Portal
   - Dialog.Overlay   → 遮罩层
   - Dialog.Content   → 主体内容
   - Dialog.Title     → 标题
   - Dialog.Description → 描述
   - Dialog.Close     → 关闭按钮

2. 自动无障碍性
   - role="dialog"
   - aria-modal="true"
   - aria-labelledby 自动关联标题
   - aria-describedby 自动关联描述
   - 焦点锁定（Focus Trap）
   - Escape 键关闭

3. 状态管理
   - open：受控模式（由外部控制）
   - defaultOpen：非受控模式（内部管理状态）
   - onOpenChange：状态变化回调

4. asChild 模式
   - 将 Radix 组件的功能"注入"到子元素
   - 避免额外的 DOM 层级
   - 示例：<Dialog.Trigger asChild><button>...</button></Dialog.Trigger>

5. data-state 属性
   - Radix 自动添加 data-state="open/closed"
   - 可以用 CSS 选择器控制动画
   - Tailwind 支持：data-[state=open]:...
*/
