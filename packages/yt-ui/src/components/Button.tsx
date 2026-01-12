// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔘 Button 组件 - 基于 Tailwind CSS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type { ButtonHTMLAttributes } from "react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 TypeScript 接口定义
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ButtonProps
	extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
	/** 按钮变体：primary（主要）、secondary（次要）、outline（轮廓）、ghost（幽灵） */
	variant?: "primary" | "secondary" | "outline" | "ghost";

	/** 按钮尺寸：sm（小）、md（中）、lg（大） */
	size?: "sm" | "md" | "lg";

	/** 按钮类型 */
	type?: "button" | "submit" | "reset";

	/** 是否禁用 */
	disabled?: boolean;

	/** 是否全宽显示 */
	fullWidth?: boolean;

	/** 按钮文本或内容 */
	children: React.ReactNode;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧩 Button 组件
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 按钮组件
 *
 * 支持多种样式变体和尺寸，基于 Tailwind CSS 构建
 */
export const Button = ({
	variant = "primary",
	size = "md",
	type = "button",
	disabled = false,
	fullWidth = false,
	children,
	className = "",
	...props
}: ButtonProps) => {
	// 🎨 基础样式
	const baseStyles = `
    inline-flex
    items-center
    justify-center
    font-bold
    rounded-full
    transition-all
    duration-200
    focus:outline-none
    focus:ring-2
    focus:ring-offset-2
    disabled:opacity-50
    disabled:cursor-not-allowed
  `;

	// 🎨 变体样式
	const variantStyles = {
		primary: `
      bg-blue-600
      text-white
      hover:bg-blue-700
      focus:ring-blue-500
      disabled:hover:bg-blue-600
    `,
		secondary: `
      bg-gray-600
      text-white
      hover:bg-gray-700
      focus:ring-gray-500
      disabled:hover:bg-gray-600
    `,
		outline: `
      bg-transparent
      border-2
      border-gray-300
      text-gray-700
      hover:bg-gray-50
      focus:ring-gray-400
      disabled:hover:bg-transparent
    `,
		ghost: `
      bg-transparent
      text-gray-700
      hover:bg-gray-100
      focus:ring-gray-400
      disabled:hover:bg-transparent
    `,
	};

	// 📏 尺寸样式
	const sizeStyles = {
		sm: "px-4 py-2 text-sm",
		md: "px-5 py-2.5 text-base",
		lg: "px-6 py-3 text-lg",
	};

	// 📐 宽度样式
	const widthStyles = fullWidth ? "w-full" : "";

	return (
		<button
			type={type}
			disabled={disabled}
			className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${widthStyles}
        ${className}
      `
				.trim()
				.replace(/\s+/g, " ")}
			{...props}
		>
			{children}
		</button>
	);
};
