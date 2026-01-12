// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 Storybook 预览配置文件
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 这个文件控制 Storybook 的预览界面行为：
// - 全局参数（所有 Story 共享）
// - 装饰器（Decorators）
// - 全局样式等

import type { Preview } from '@storybook/react-vite'

// 🎨 导入 Tailwind CSS
// 导入本地 Tailwind 样式文件
// Tailwind 会扫描组件库和 stories 中的类名，生成需要的样式
import '../src/index.css'

const preview: Preview = {
  // ⚙️ parameters：全局参数配置
  // 这些参数会应用到所有的 Story
  parameters: {
    // 🎛️ controls：控制面板配置
    controls: {
      // 🔍 matchers：自动匹配参数类型
      // 根据参数名称自动选择合适的控件类型
      matchers: {
        // 名称包含 'background' 或 'color' 的参数 → 颜色选择器
        color: /(background|color)$/i,

        // 名称包含 'Date' 的参数 → 日期选择器
        date: /Date$/i,
      },
    },

    // ♿ a11y：无障碍性检查配置
    a11y: {
      // 测试模式：
      // - 'todo'：在测试 UI 中显示无障碍问题（不会失败）
      // - 'error'：在 CI 中遇到无障碍问题时失败
      // - 'off'：完全跳过无障碍检查
      test: 'todo'
    }
  },

  // 💡 可选配置（未使用）：
  // decorators: [...]     // 全局装饰器，用于包装所有 Story
  // globalTypes: {...}    // 全局工具栏选项（如主题切换器）
  // loaders: [...]        // 数据加载器
};

export default preview;