// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 Card 组件 - 使用 Tailwind CSS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 这个组件展示了如何使用 Tailwind CSS 创建现代化的 UI 组件
// 不需要额外的 CSS 文件，所有样式都通过 Tailwind 类名实现

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 TypeScript 接口定义
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface CardProps {
  /** 卡片标题 */
  title: string;

  /** 卡片描述内容 */
  description: string;

  /** 卡片图片 URL（可选） */
  imageUrl?: string;

  /** 卡片变体样式 */
  variant?: 'default' | 'bordered' | 'elevated';

  /** 是否显示操作按钮 */
  showActions?: boolean;

  /** 主要操作按钮文本 */
  primaryActionLabel?: string;

  /** 次要操作按钮文本 */
  secondaryActionLabel?: string;

  /** 主要操作点击事件 */
  onPrimaryAction?: () => void;

  /** 次要操作点击事件 */
  onSecondaryAction?: () => void;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧩 Card 组件
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 卡片组件 - 展示内容的容器
 *
 * 使用 Tailwind CSS 实现，展示了：
 * - 响应式布局
 * - 条件样式（variant）
 * - 悬停效果
 * - 阴影和边框
 */
export const Card = ({
  title,
  description,
  imageUrl,
  variant = 'default',
  showActions = true,
  primaryActionLabel = '确认',
  secondaryActionLabel = '取消',
  onPrimaryAction,
  onSecondaryAction,
}: CardProps) => {
  // 🎨 根据 variant 决定卡片的基础样式
  const variantStyles = {
    // 默认样式：白色背景 + 轻微阴影
    default: 'bg-white shadow-md',

    // 边框样式：白色背景 + 边框
    bordered: 'bg-white border-2 border-gray-200',

    // 悬浮样式：白色背景 + 较大阴影
    elevated: 'bg-white shadow-lg shadow-gray-300',
  };

  return (
    <div
      // 📦 Tailwind 类名详解：
      // - max-w-sm: 最大宽度为 small（24rem / 384px）
      // - rounded-lg: 大圆角边框
      // - overflow-hidden: 隐藏超出部分（让图片圆角生效）
      // - transition-all: 所有属性都有过渡动画
      // - duration-300: 动画持续 300ms
      // - hover:shadow-xl: 悬停时阴影加大
      // - hover:scale-105: 悬停时放大到 105%
      className={`
        max-w-sm
        rounded-lg
        overflow-hidden
        transition-all
        duration-300
        hover:shadow-xl
        hover:scale-105
        ${variantStyles[variant]}
      `}
    >
      {/* 🖼️ 图片区域（如果提供了图片 URL） */}
      {imageUrl && (
        <img
          // 📦 Tailwind 类名：
          // - w-full: 宽度 100%
          // - h-48: 高度 12rem (192px)
          // - object-cover: 保持纵横比裁剪图片
          className="w-full h-48 object-cover"
          src={imageUrl}
          alt={title}
        />
      )}

      {/* 📝 内容区域 */}
      <div
        // 📦 Tailwind 类名：
        // - p-6: 所有方向 padding 为 1.5rem (24px)
        className="p-6"
      >
        {/* 📌 标题 */}
        <h2
          // 📦 Tailwind 类名：
          // - text-2xl: 字体大小 1.5rem (24px)
          // - font-bold: 字体加粗
          // - text-gray-800: 深灰色文字
          // - mb-2: 下方 margin 为 0.5rem (8px)
          className="text-2xl font-bold text-gray-800 mb-2"
        >
          {title}
        </h2>

        {/* 📄 描述 */}
        <p
          // 📦 Tailwind 类名：
          // - text-gray-600: 灰色文字
          // - text-base: 基础字体大小 1rem (16px)
          // - leading-relaxed: 行高较松散（1.625）
          className="text-gray-600 text-base leading-relaxed"
        >
          {description}
        </p>
      </div>

      {/* 🔘 操作按钮区域 */}
      {showActions && (
        <div
          // 📦 Tailwind 类名：
          // - px-6: 左右 padding 为 1.5rem
          // - pb-6: 下方 padding 为 1.5rem
          // - flex: 使用 flexbox 布局
          // - gap-4: 子元素间距为 1rem (16px)
          className="px-6 pb-6 flex gap-4"
        >
          {/* 主要操作按钮 */}
          <button
            // 📦 Tailwind 类名：
            // - flex-1: flex-grow 为 1（占据剩余空间）
            // - bg-blue-500: 蓝色背景
            // - hover:bg-blue-600: 悬停时背景变深蓝
            // - text-white: 白色文字
            // - font-semibold: 半粗体
            // - py-2: 上下 padding 为 0.5rem
            // - px-4: 左右 padding 为 1rem
            // - rounded-md: 中等圆角
            // - transition-colors: 颜色过渡动画
            // - duration-200: 动画持续 200ms
            // - active:scale-95: 点击时缩小到 95%
            className="
              flex-1
              bg-blue-500
              hover:bg-blue-600
              text-white
              font-semibold
              py-2
              px-4
              rounded-md
              transition-colors
              duration-200
              active:scale-95
            "
            onClick={onPrimaryAction}
          >
            {primaryActionLabel}
          </button>

          {/* 次要操作按钮 */}
          <button
            // 📦 Tailwind 类名：
            // - flex-1: flex-grow 为 1
            // - bg-gray-200: 浅灰色背景
            // - hover:bg-gray-300: 悬停时背景变深
            // - text-gray-700: 深灰色文字
            // - font-semibold: 半粗体
            // - py-2: 上下 padding 为 0.5rem
            // - px-4: 左右 padding 为 1rem
            // - rounded-md: 中等圆角
            // - transition-colors: 颜色过渡动画
            // - duration-200: 动画持续 200ms
            // - active:scale-95: 点击时缩小到 95%
            className="
              flex-1
              bg-gray-200
              hover:bg-gray-300
              text-gray-700
              font-semibold
              py-2
              px-4
              rounded-md
              transition-colors
              duration-200
              active:scale-95
            "
            onClick={onSecondaryAction}
          >
            {secondaryActionLabel}
          </button>
        </div>
      )}
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💡 Tailwind CSS 学习要点
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/*
1. 工具类命名规则：
   - p-6: padding: 1.5rem (6 * 0.25rem)
   - mt-4: margin-top: 1rem (4 * 0.25rem)
   - text-xl: font-size: 1.25rem

2. 响应式前缀：
   - sm:text-lg  - 小屏幕及以上应用
   - md:p-8      - 中等屏幕及以上应用
   - lg:flex     - 大屏幕及以上应用

3. 状态前缀：
   - hover:bg-blue-600  - 悬停状态
   - focus:ring-2       - 焦点状态
   - active:scale-95    - 激活状态

4. 颜色系统：
   - gray-50  到 gray-900  (浅到深)
   - blue-500 是标准蓝色
   - 数字越大，颜色越深

5. 间距系统（基于 0.25rem = 4px）：
   - 1 = 0.25rem = 4px
   - 2 = 0.5rem  = 8px
   - 4 = 1rem    = 16px
   - 6 = 1.5rem  = 24px
*/
