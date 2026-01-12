// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📚 useImmer 实战示例
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React from 'react';
import { useImmer } from '../hooks/useImmer';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 示例 1: 待办事项列表
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export function TodoListExample() {
  const [todos, setTodos] = useImmer<Todo[]>([
    { id: 1, text: '学习 React', completed: true },
    { id: 2, text: '学习 Immer', completed: false },
    { id: 3, text: '封装 useImmer', completed: false },
  ]);

  // ✅ 添加待办事项 - 直接使用 push
  const addTodo = (text: string) => {
    setTodos((draft) => {
      draft.push({
        id: Date.now(),
        text,
        completed: false,
      });
    });
  };

  // ✅ 切换完成状态 - 直接修改属性
  const toggleTodo = (id: number) => {
    setTodos((draft) => {
      const todo = draft.find((t) => t.id === id);
      if (todo) {
        todo.completed = !todo.completed;
      }
    });
  };

  // ✅ 删除待办事项 - 使用 splice
  const deleteTodo = (id: number) => {
    setTodos((draft) => {
      const index = draft.findIndex((t) => t.id === id);
      if (index !== -1) {
        draft.splice(index, 1);
      }
    });
  };

  return (
    <div>
      <h2>待办事项列表</h2>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)}>删除</button>
          </li>
        ))}
      </ul>
      <button onClick={() => addTodo('新任务')}>添加任务</button>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👤 示例 2: 用户资料表单（深层嵌套）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface UserProfile {
  personal: {
    name: string;
    age: number;
  };
  address: {
    city: string;
    street: string;
    zipCode: string;
  };
  preferences: {
    theme: 'light' | 'dark';
    language: string;
    notifications: {
      email: boolean;
      sms: boolean;
    };
  };
}

export function UserProfileExample() {
  const [profile, setProfile] = useImmer<UserProfile>({
    personal: {
      name: 'Alice',
      age: 25,
    },
    address: {
      city: '北京',
      street: '长安街',
      zipCode: '100000',
    },
    preferences: {
      theme: 'light',
      language: 'zh-CN',
      notifications: {
        email: true,
        sms: false,
      },
    },
  });

  // ✅ 更新深层嵌套 - 传统方式需要多层 spread
  // ❌ setProfile(prev => ({
  //   ...prev,
  //   preferences: {
  //     ...prev.preferences,
  //     notifications: {
  //       ...prev.preferences.notifications,
  //       email: !prev.preferences.notifications.email
  //     }
  //   }
  // }))

  // ✅ useImmer 方式 - 直接修改
  const toggleEmailNotifications = () => {
    setProfile((draft) => {
      draft.preferences.notifications.email = !draft.preferences.notifications.email;
    });
  };

  const updateCity = (city: string) => {
    setProfile((draft) => {
      draft.address.city = city;
    });
  };

  const incrementAge = () => {
    setProfile((draft) => {
      draft.personal.age += 1;
    });
  };

  return (
    <div>
      <h2>用户资料</h2>
      <div>
        <h3>个人信息</h3>
        <p>姓名: {profile.personal.name}</p>
        <p>年龄: {profile.personal.age}</p>
        <button onClick={incrementAge}>增加年龄</button>
      </div>

      <div>
        <h3>地址</h3>
        <p>城市: {profile.address.city}</p>
        <input
          type="text"
          value={profile.address.city}
          onChange={(e) => updateCity(e.target.value)}
        />
      </div>

      <div>
        <h3>偏好设置</h3>
        <label>
          <input
            type="checkbox"
            checked={profile.preferences.notifications.email}
            onChange={toggleEmailNotifications}
          />
          邮件通知
        </label>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎮 示例 3: 游戏状态管理
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface Player {
  id: number;
  name: string;
  score: number;
  inventory: string[];
}

interface GameState {
  players: Player[];
  currentRound: number;
  isPlaying: boolean;
}

export function GameStateExample() {
  const [game, setGame] = useImmer<GameState>({
    players: [
      { id: 1, name: '玩家1', score: 0, inventory: [] },
      { id: 2, name: '玩家2', score: 0, inventory: [] },
    ],
    currentRound: 1,
    isPlaying: false,
  });

  // ✅ 复杂的状态更新 - 同时修改多个部分
  const addScoreAndItem = (playerId: number, points: number, item: string) => {
    setGame((draft) => {
      // 找到玩家
      const player = draft.players.find((p) => p.id === playerId);
      if (player) {
        // 增加分数
        player.score += points;
        // 添加物品
        player.inventory.push(item);
      }
      // 进入下一轮
      draft.currentRound += 1;
    });
  };

  // ✅ 数组排序 - 直接使用 sort
  const sortPlayersByScore = () => {
    setGame((draft) => {
      // 传统方式需要: setPlayers([...players].sort(...))
      // useImmer 可以直接 sort
      draft.players.sort((a, b) => b.score - a.score);
    });
  };

  return (
    <div>
      <h2>游戏状态</h2>
      <p>当前回合: {game.currentRound}</p>
      <button onClick={sortPlayersByScore}>按分数排序</button>
      <ul>
        {game.players.map((player) => (
          <li key={player.id}>
            {player.name} - 分数: {player.score}
            <button onClick={() => addScoreAndItem(player.id, 10, '宝箱')}>
              获得奖励
            </button>
            <div>背包: {player.inventory.join(', ')}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💡 性能对比示例
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 🔍 为什么 useImmer 在复杂场景下更好？
 *
 * 1. **代码可读性** ✅
 *    - 直观的修改语法
 *    - 不需要记住复杂的 spread 嵌套
 *
 * 2. **减少错误** ✅
 *    - 避免忘记复制某一层
 *    - 避免意外修改原对象
 *
 * 3. **开发效率** ✅
 *    - 写得更快
 *    - 调试更容易
 *
 * 4. **结构共享** ✅
 *    - Immer 只会复制修改的部分
 *    - 未修改的部分会重用原对象
 *    - 在大型状态树中性能更好
 */

/**
 * 📊 性能示例：结构共享
 *
 * ```ts
 * const state = {
 *   users: [...1000个用户],
 *   settings: { ... },
 *   data: { ... }
 * };
 *
 * // 只修改一个用户
 * setImmer(draft => {
 *   draft.users[0].name = 'Bob';
 * });
 *
 * // Immer 只会复制：
 * // 1. users 数组
 * // 2. users[0] 对象
 * // 其余 999 个用户对象、settings、data 都被重用！
 * ```
 */
