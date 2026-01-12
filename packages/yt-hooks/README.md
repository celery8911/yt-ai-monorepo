# @yt/hooks

React Hooks 工具库，提供常用的自定义 Hooks。

## 📦 安装

```bash
pnpm add @yt/hooks
```

## 🎣 Hooks 列表

### useImmer

让状态更新像操作普通对象一样简单的 Hook。

#### 💡 为什么需要 useImmer？

在 React 中，状态是不可变的。当你更新复杂的嵌套对象或数组时，需要手动创建副本：

```tsx
// ❌ 传统方式：复杂且容易出错
const [user, setUser] = useState({
  profile: {
    name: 'Alice',
    settings: {
      theme: 'dark'
    }
  }
});

// 更新深层属性需要多层 spread
setUser(prev => ({
  ...prev,
  profile: {
    ...prev.profile,
    settings: {
      ...prev.profile.settings,
      theme: 'light'
    }
  }
}));
```

使用 `useImmer` 后：

```tsx
// ✅ useImmer 方式：直观且简洁
const [user, setUser] = useImmer({
  profile: {
    name: 'Alice',
    settings: {
      theme: 'dark'
    }
  }
});

// 直接修改，Immer 会处理不可变性
setUser(draft => {
  draft.profile.settings.theme = 'light';
});
```

#### 📖 基础用法

```tsx
import { useImmer } from '@yt/hooks';

function App() {
  const [state, setState] = useImmer(initialValue);

  // 方式 1: 传入新值
  setState(newValue);

  // 方式 2: 传入更新函数（推荐）
  setState(draft => {
    // 直接修改 draft
    draft.property = newValue;
  });
}
```

#### 🎯 实际场景示例

##### 1. 待办事项列表

```tsx
import { useImmer } from '@yt/hooks';

function TodoList() {
  const [todos, setTodos] = useImmer([
    { id: 1, text: '学习 React', done: false }
  ]);

  // 添加项目
  const addTodo = (text) => {
    setTodos(draft => {
      draft.push({ id: Date.now(), text, done: false });
    });
  };

  // 切换完成状态
  const toggleTodo = (id) => {
    setTodos(draft => {
      const todo = draft.find(t => t.id === id);
      if (todo) todo.done = !todo.done;
    });
  };

  // 删除项目
  const deleteTodo = (id) => {
    setTodos(draft => {
      const index = draft.findIndex(t => t.id === id);
      draft.splice(index, 1);
    });
  };
}
```

##### 2. 表单状态管理

```tsx
function UserForm() {
  const [form, setForm] = useImmer({
    personal: {
      name: '',
      age: 0
    },
    address: {
      city: '',
      street: ''
    }
  });

  // 更新嵌套字段
  const updateName = (name) => {
    setForm(draft => {
      draft.personal.name = name;
    });
  };

  const updateCity = (city) => {
    setForm(draft => {
      draft.address.city = city;
    });
  };
}
```

##### 3. 数组操作

```tsx
function List() {
  const [items, setItems] = useImmer([1, 2, 3]);

  // 直接使用数组方法
  const addItem = () => {
    setItems(draft => {
      draft.push(draft.length + 1);
    });
  };

  const removeItem = (index) => {
    setItems(draft => {
      draft.splice(index, 1);
    });
  };

  const sortItems = () => {
    setItems(draft => {
      draft.sort((a, b) => b - a);
    });
  };
}
```

#### 🔍 工作原理

`useImmer` 基于以下技术栈实现：

1. **React.useState** - 底层状态存储
2. **Immer.produce** - 不可变性处理
3. **React.useCallback** - 性能优化

```tsx
export function useImmer<T>(initialValue: T) {
  const [state, setState] = useState(initialValue);

  const setImmerState = useCallback((updater) => {
    if (typeof updater === 'function') {
      // 使用 Immer 的 produce 处理更新
      setState(prev => produce(prev, updater));
    } else {
      setState(updater);
    }
  }, []);

  return [state, setImmerState];
}
```

#### 💎 核心概念

##### 1. 草稿对象（Draft）

- `draft` 是原状态的"可写"代理
- 对 `draft` 的修改会被 Immer 跟踪
- Immer 根据修改生成新的不可变对象

##### 2. 结构共享（Structural Sharing）

```tsx
const state = {
  users: [...1000个用户],
  settings: { theme: 'dark' },
  data: { ... }
};

// 只修改一个用户
setImmer(draft => {
  draft.users[0].name = 'Bob';
});

// Immer 只会复制被修改的部分：
// ✅ 复制：users 数组、users[0] 对象
// ♻️  重用：其余 999 个用户、settings、data
```

这意味着：
- 内存效率更高
- 组件渲染更精准（未改变的引用相同）

##### 3. 返回值处理

更新函数可以选择性地返回新值：

```tsx
// 方式 1: 修改 draft（推荐）
setImmer(draft => {
  draft.count += 1;
});

// 方式 2: 返回新值
setImmer(draft => {
  return { count: draft.count + 1 };
});

// ⚠️ 不能混用：要么修改 draft，要么返回新值
```

#### ⚡ 性能优势

| 场景 | useState | useImmer |
|------|----------|----------|
| 简单值 | ✅ 更快 | ⚠️ 略慢（有代理开销） |
| 浅层对象 | ✅ 相近 | ✅ 相近 |
| 深层嵌套 | ❌ 代码复杂 | ✅ 代码简洁 |
| 大型数组 | ❌ 完全复制 | ✅ 结构共享 |

**推荐场景**：
- ✅ 嵌套对象/数组（3层以上）
- ✅ 需要频繁修改的复杂状态
- ✅ 数组操作（push、splice、sort）
- ❌ 简单的计数器、布尔值（用 useState 即可）

#### 🎓 学习要点

1. **什么时候用 useImmer**
   - 状态结构复杂（嵌套 > 2 层）
   - 数组操作频繁
   - 需要提高代码可读性

2. **Immer 核心原理**
   - 使用 Proxy 创建草稿对象
   - 跟踪所有修改
   - 生成结构共享的新对象

3. **类型安全**
   - 完整的 TypeScript 支持
   - Draft<T> 类型保证安全性

4. **性能考虑**
   - 简单状态用 useState
   - 复杂状态用 useImmer
   - 利用结构共享优化渲染

#### 📚 更多资源

- [Immer 官方文档](https://immerjs.github.io/immer/)
- [use-immer 源码](https://github.com/immerjs/use-immer)

## 🔧 开发

```bash
# 安装依赖
pnpm install

# 构建
pnpm run build
```

## 📄 License

ISC
