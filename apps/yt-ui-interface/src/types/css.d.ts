// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 CSS 模块类型声明文件
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 告诉 TypeScript 如何处理 CSS 文件导入

declare module "*.css" {
	const content: { [className: string]: string };
	export default content;
}
