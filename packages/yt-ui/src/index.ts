// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 @yt/ui - 组件库入口文件
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 这个文件导出所有公共组件和类型
// 其他项目通过这个文件导入组件

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧩 组件导出
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 🔘 Button 组件
export { Button } from "./components/Button";

// 🎴 Card 组件
export { Card } from "./components/Card";

// 💬 Dialog 组件
export { Dialog } from "./components/Dialog";

// 🎴 未来的组件可以在这里添加
// export { Button } from './components/Button';
// export { Input } from './components/Input';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 类型导出
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 导出组件的 Props 类型，供 TypeScript 用户使用
export type { ButtonProps } from "./components/Button";
export type { CardProps } from "./components/Card";
export type { DialogProps } from "./components/Dialog";

// 💡 使用示例：
//
// 在其他项目中导入：
// import { Card } from '@yt/ui';
// import type { CardProps } from '@yt/ui';
//
// 使用组件：
// <Card
//   title="Hello"
//   description="World"
//   variant="elevated"
// />
