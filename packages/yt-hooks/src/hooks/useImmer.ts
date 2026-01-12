// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 useImmer Hook - 让状态更新像操作普通对象一样简单
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { type Draft, freeze, produce } from "immer";
import { useCallback, useState } from "react";

/**
 * 🎯 什么是 useImmer？
 *
 * useImmer 是 useState 的增强版本，它允许你：
 * ✅ 直接修改状态对象（看起来像可变操作）
 * ✅ Immer 在底层保证了不可变性
 * ✅ 避免手动创建副本（...spread、Object.assign 等）
 *
 * 📚 使用场景：
 * - 复杂嵌套对象的状态管理
 * - 数组操作（push、splice、sort 等）
 * - 需要频繁更新状态的场景
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 TypeScript 类型定义
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Updater 函数类型
 *
 * @param draft - Immer 的草稿对象，可以直接修改
 *
 * 📖 解释：
 * Draft<T> 是 Immer 提供的类型，表示一个可以直接修改的"草稿"版本
 * 你对 draft 的所有修改都会被 Immer 记录，最终生成新的不可变状态
 *
 * ⚠️ 重要：应该只修改 draft，不要返回值（即返回 void）
 * Immer 会自动根据你对 draft 的修改生成新状态
 */
type DraftFunction<T> = (draft: Draft<T>) => void;

/**
 * SetState 函数类型
 *
 * 支持两种调用方式：
 * 1. setState(newValue) - 直接传入新值
 * 2. setState(draft => { draft.name = 'new' }) - 传入更新函数
 */
type SetImmerState<T> = (updater: T | DraftFunction<T>) => void;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 useImmer Hook 实现
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * useImmer Hook
 *
 * @param initialValue - 初始状态值
 * @returns [state, setState] - 状态和更新函数的元组
 *
 * 💡 实现原理：
 * 1. 使用 React 的 useState 存储实际状态
 * 2. 包装 setState 函数，使其支持 Immer 的 produce 功能
 * 3. 使用 useCallback 优化性能，避免不必要的重新创建
 */
export function useImmer<T>(
	initialValue: T | (() => T),
): [T, SetImmerState<T>] {
	/**
	 * 1️⃣ 使用标准的 useState 存储状态，并冻结初始值
	 *
	 * 🔒 为什么要 freeze？
	 * - freeze 会深度冻结对象（Object.freeze），防止意外修改
	 * - 在开发环境下，如果你尝试修改冻结的对象，会抛出错误
	 * - 生产环境下，freeze 是 no-op（不执行），不影响性能
	 * - 第二个参数 true 表示深度冻结（递归冻结所有嵌套对象）
	 *
	 * 📖 示例：
	 * const [user, setUser] = useImmer({ name: 'Alice' });
	 * user.name = 'Bob';  // ❌ 开发环境抛错：Cannot assign to read only property
	 */
	const [state, setState] = useState(() =>
		freeze(
			typeof initialValue === "function"
				? (initialValue as () => T)()
				: initialValue,
			true,
		),
	);

	// 2️⃣ 创建增强版的 setState 函数
	const setImmerState = useCallback((updater: T | DraftFunction<T>) => {
		// 判断 updater 是函数还是直接的值
		if (typeof updater === "function") {
			// 如果是函数，使用 Immer 的 produce
			setState((prevState) => {
				/**
				 * 🔍 produce 工作原理：
				 *
				 * produce(baseState, recipe)
				 * - baseState: 当前状态（不可变）
				 * - recipe: 更新函数，接收 draft（可变草稿）
				 *
				 * 步骤：
				 * 1. Immer 创建 baseState 的代理对象（draft）
				 * 2. 你对 draft 的修改都被记录
				 * 3. Immer 根据修改生成新的不可变对象
				 * 4. 返回新状态
				 *
				 * 例子：
				 * const nextState = produce(currentState, draft => {
				 *   draft.user.name = 'Alice';  // 直接修改
				 * });
				 * // currentState 保持不变，nextState 是新对象
				 */
				return produce(prevState, updater as DraftFunction<T>);
			});
		} else {
			/**
			 * 如果是直接的值，冻结后设置
			 *
			 * 🔒 为什么这里也要 freeze？
			 * - 保持一致性：所有状态都应该是冻结的
			 * - 防止后续意外修改新设置的值
			 * - produce 返回的值已经被 Immer 自动冻结，这里手动设置的值也应该冻结
			 */
			setState(freeze(updater, true));
		}
	}, []);

	// 3️⃣ 返回状态和增强的 setState
	return [state, setImmerState];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📖 使用示例
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 示例 1: 更新嵌套对象
 *
 * 传统 useState 方式：
 * ```ts
 * const [user, setUser] = useState({ profile: { name: 'Alice' } });
 *
 * // ❌ 需要手动创建所有层级的副本
 * setUser(prev => ({
 *   ...prev,
 *   profile: {
 *     ...prev.profile,
 *     name: 'Bob'
 *   }
 * }));
 * ```
 *
 * useImmer 方式：
 * ```ts
 * const [user, setUser] = useImmer({ profile: { name: 'Alice' } });
 *
 * // ✅ 直接修改，简洁清晰
 * setUser(draft => {
 *   draft.profile.name = 'Bob';
 * });
 * ```
 */

/**
 * 示例 2: 数组操作
 *
 * 传统 useState 方式：
 * ```ts
 * const [todos, setTodos] = useState([]);
 *
 * // ❌ 添加项目需要创建新数组
 * setTodos(prev => [...prev, newTodo]);
 *
 * // ❌ 删除项目需要 filter
 * setTodos(prev => prev.filter(todo => todo.id !== id));
 * ```
 *
 * useImmer 方式：
 * ```ts
 * const [todos, setTodos] = useImmer([]);
 *
 * // ✅ 直接使用数组方法
 * setTodos(draft => {
 *   draft.push(newTodo);
 * });
 *
 * setTodos(draft => {
 *   const index = draft.findIndex(todo => todo.id === id);
 *   draft.splice(index, 1);
 * });
 * ```
 */

/**
 * 示例 3: 直接设置新值
 *
 * ```ts
 * const [count, setCount] = useImmer(0);
 *
 * // ✅ 也支持直接设置值
 * setCount(10);
 * ```
 */
