// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📚 Storybook 主配置文件
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 这个文件定义了 Storybook 的核心配置：
// - 从哪里加载 stories
// - 使用哪些插件（addons）
// - 使用什么构建工具（framework）

import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ Storybook 配置对象
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const config: StorybookConfig = {
  // 📂 stories：定义从哪里加载 Story 文件
  // 支持两种格式：
  // 1. .mdx 文件：用于编写文档页面
  // 2. .stories.{ts,tsx,js,jsx} 文件：组件的展示案例
  stories: [
    "../stories/**/*.mdx",                           // MDX 文档
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"  // Story 文件
  ],

  // 🧩 addons：Storybook 插件列表
  // 每个插件提供不同的功能扩展
  addons: [
    // 🎨 Chromatic：视觉回归测试工具
    '@chromatic-com/storybook',

    // 🎁 Essentials：必备插件包（包含 controls, actions, viewport, backgrounds, toolbars, docs）
    '@storybook/addon-essentials',

    // 🔗 Links：支持在 Story 之间导航
    '@storybook/addon-links',

    // 🎯 Interactions：交互测试
    '@storybook/addon-interactions',

    // 🎓 Onboarding：新手引导
    '@storybook/addon-onboarding'
  ],

  // ⚡ framework：指定使用的框架和构建工具
  // 这里使用 React + Vite 组合（快速、现代）
  framework: '@storybook/react-vite',

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔧 viteFinal：自定义 Vite 配置
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 这个函数允许我们修改 Storybook 使用的 Vite 配置
  async viteFinal(config) {
    // 添加 Tailwind CSS 插件到 Vite
    config.plugins = config.plugins || [];
    config.plugins.push(tailwindcss());

    return config;
  }
};

export default config;