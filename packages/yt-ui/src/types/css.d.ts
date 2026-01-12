// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 CSS 模块类型声明文件
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 作用：告诉 TypeScript 如何处理 CSS 文件导入
// 这样在 .tsx/.ts 文件中导入 CSS 时不会报类型错误

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 .css 文件类型声明
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 当你写：import './button.css'
// TypeScript 会在这里找到类型定义，不再报错
declare module "*.css" {
	// CSS 文件导出一个对象，key 是类名，value 是实际的类名字符串
	// 例如：{ 'button': 'button_abc123' }（CSS Modules 模式）
	const content: { [className: string]: string };
	export default content;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 其他 CSS 预处理器的类型声明
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 🎨 SCSS 文件
declare module "*.scss" {
	const content: { [className: string]: string };
	export default content;
}

// 🎨 SASS 文件
declare module "*.sass" {
	const content: { [className: string]: string };
	export default content;
}

// 🎨 LESS 文件
declare module "*.less" {
	const content: { [className: string]: string };
	export default content;
}

// 💡 为什么需要这个文件？
//
// 问题：TypeScript 不认识 .css 文件
// import './button.css';  // ❌ 报错：找不到模块
//
// 解决：通过 .d.ts 告诉 TypeScript 这是合法的
// import './button.css';  // ✅ 正常
//
// TypeScript 会自动扫描项目中的所有 .d.ts 文件
// 并根据这些声明进行类型检查
