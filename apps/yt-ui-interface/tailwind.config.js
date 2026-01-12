/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // 扫描 stories 目录下的所有文件（包括 MDX 文档）
    "./stories/**/*.{js,jsx,ts,tsx,mdx}",

    // 扫描 src 目录下的所有源文件
    "./src/**/*.{js,jsx,ts,tsx}",

    // 扫描 @qincai/ui 组件库的源文件
    // 因为组件使用 workspace 依赖（workspace:*），Storybook 直接引用源码
    // Tailwind 需要扫描组件库中的 className 来生成对应的样式
    "../../packages/qc-ui/src/**/*.{js,jsx,ts,tsx}",
  ],
};
