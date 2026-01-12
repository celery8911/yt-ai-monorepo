# yt-ai-monorepo 架构文档

> 本文档描述 yt-ai-monorepo 的整体架构设计、技术栈选择和包的职责划分

## 项目定位

AI-Native Monorepo 工程平台，基于 qc-monorepo 的成熟架构，为团队提供：

- 统一的包管理和构建流水线
- 可复用的组件和工具生态
- 内建的 AI 协作工作流
- 明确的工程角色边界

---

## 项目结构

```
yt-ai-monorepo/
├── packages/                       # 共享包目录
│   ├── yt-ui/                     # UI 组件库
│   │   ├── src/                   # 组件源码
│   │   ├── package.json           # @yt/ui
│   │   └── vite.config.ts         # Vite 构建配置
│   ├── yt-hooks/                  # React Hooks 库
│   │   ├── src/                   # Hooks 源码
│   │   ├── package.json           # @yt/hooks
│   │   └── rollup.config.js       # Rollup 构建配置
│   └── yt-libs/                   # 工具函数库
│       ├── src/                   # 工具源码
│       ├── package.json           # @yt/libs
│       └── (Microbundle 自动处理)
├── apps/                           # 应用目录
│   └── yt-ui-interface/           # Storybook 文档站
│       ├── stories/               # Story 文件
│       ├── .storybook/            # Storybook 配置
│       └── package.json           # @yt/ui-interface
├── .ai/                            # AI 相关文档
│   ├── docs/                      # 核心文档
│   ├── agents/                    # Agent 定义
│   ├── commands/                  # 命令说明
│   └── tasks/                     # 任务清单
├── .changeset/                     # 版本管理配置
├── .github/workflows/              # CI/CD 流程
├── package.json                    # 根 package.json
├── pnpm-workspace.yaml             # Workspace 配置
├── turbo.json                      # Turborepo 配置
├── tsconfig.base.json              # 基础 TypeScript 配置
├── biome.json                      # 代码格式化配置
└── README.md                       # 项目入口文档
```

---

## 技术栈

### 包管理与构建编排

- **pnpm 8.6.2+**: Workspace 包管理
  - 高效的磁盘空间利用
  - 严格的依赖隔离
  - Workspace 协议支持

- **Turborepo 2.7.2+**: 构建编排
  - 增量构建和智能缓存
  - 并行任务执行
  - 依赖图感知

### 包级构建工具

#### @yt/ui (UI 组件库)
- **Vite**: 快速的现代构建工具
- **Tailwind CSS 4**: 实用优先的 CSS 框架
- **Radix UI**: 无障碍的无样式组件基础
- **TypeScript**: 类型安全

#### @yt/hooks (Hooks 工具库)
- **Rollup**: 库打包工具
- **Immer**: 不可变状态管理
- **TypeScript**: 类型安全

#### @yt/libs (工具函数库)
- **Microbundle**: 零配置的库打包
- **Pure JavaScript/TypeScript**: 零运行时依赖
- **Tree-shaking 友好**: 按需引入

#### @yt/ui-interface (Storybook 文档)
- **Storybook 8.6+**: 组件文档和展示
- **Vite**: 构建工具
- **Tailwind CSS 4**: 样式系统

### 语言和工具

- **TypeScript 5.7+**: 全项目 strict mode
- **Biome**: 代码格式化和 Linting
- **Changesets**: 版本管理和发布

---

## Monorepo 架构理念

### 分层依赖

```
┌─────────────────────────────────┐
│   Apps Layer (yt-ui-interface)  │  ← 应用层
├─────────────────────────────────┤
│   UI Layer (@yt/ui)              │  ← UI 组件层
├─────────────────────────────────┤
│   Hooks Layer (@yt/hooks)        │  ← 逻辑复用层
├─────────────────────────────────┤
│   Utils Layer (@yt/libs)         │  ← 工具函数层
└─────────────────────────────────┘
```

**依赖规则**：
- 上层可以依赖下层
- 下层不能依赖上层
- 同层之间需明确声明依赖

### Workspace 协议

使用 `workspace:*` 协议引用内部包：

```json
{
  "dependencies": {
    "@yt/libs": "workspace:*",
    "@yt/hooks": "workspace:*"
  }
}
```

**优势**：
- 始终使用最新的本地版本
- 避免版本号不一致
- 便于 Turborepo 依赖图分析

---

## 包的职责划分

### @yt/libs - 工具函数库

**定位**: 纯函数工具，零依赖，高度可复用

**职责**:
- 数据格式化和验证
- 字符串、数组、对象操作
- 日期时间处理
- 区块链地址验证（如需要）

**约束**:
- 无外部依赖（除 TypeScript 类型）
- 纯函数，无副作用
- 完整的单元测试覆盖

**构建输出**: CJS + ESM + UMD（Microbundle）

---

### @yt/hooks - React Hooks 库

**定位**: React 逻辑复用层，基于 Immer 的状态管理

**职责**:
- 可复用的 React Hooks
- 状态管理逻辑（useImmer）
- 副作用封装（useEffect 相关）
- 数据获取和缓存

**依赖**:
- React, React-DOM
- Immer
- @yt/libs (可选)

**约束**:
- 不包含 UI 组件
- 遵循 React Hooks 规范
- 完整的类型定义

**构建输出**: CJS + ESM（Rollup）

---

### @yt/ui - UI 组件库

**定位**: React 组件库，基于 Tailwind CSS 和 Radix UI

**职责**:
- 可复用的 UI 组件
- 无障碍（a11y）支持
- 响应式设计
- Dark Mode 支持

**依赖**:
- React, React-DOM
- Tailwind CSS 4
- Radix UI
- @yt/hooks (可选)
- @yt/libs (可选)

**约束**:
- 组件必须有 TypeScript 类型
- 使用 Tailwind CSS，避免 CSS-in-JS
- 每个组件有对应的 Storybook Story
- 遵循 Radix UI 的组合模式

**构建输出**: ESM（Vite）

---

### @yt/ui-interface - Storybook 文档站

**定位**: 展示 @yt/ui 组件库的文档和示例

**职责**:
- 组件展示和交互测试
- 使用文档和示例代码
- 组件状态测试（@storybook/addon-interactions）

**依赖**:
- Storybook 8.6+
- @yt/ui
- Vite

**约束**:
- 仅用于开发和文档
- 不作为 npm 包发布

---

## 构建流程

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发模式（所有包）
pnpm dev

# 启动 Storybook
pnpm --filter @yt/ui-interface dev
```

### 构建所有包

```bash
pnpm build
```

Turborepo 会根据依赖图自动确定构建顺序：
1. @yt/libs （无依赖）
2. @yt/hooks （可能依赖 @yt/libs）
3. @yt/ui （依赖 @yt/hooks）
4. @yt/ui-interface （依赖 @yt/ui）

### CI/CD

GitHub Actions 工作流：
- **PR 检查**: Lint, Type-check, Build, Test
- **版本发布**: Changesets + npm publish（未来）

---

## 版本管理

使用 Changesets 进行版本管理：

```bash
# 添加变更记录
pnpm changeset

# 更新版本号
pnpm version-packages

# 发布到 npm（未来）
pnpm release
```

---

## 扩展性设计

### 添加新包

1. 在 `packages/` 下创建新目录
2. 初始化 `package.json`（name 必须是 `@yt/*`）
3. 更新 `pnpm-workspace.yaml`（如果需要）
4. 运行 `pnpm install`

示例：添加 `@yt/api` 包

```bash
mkdir packages/yt-api
cd packages/yt-api
pnpm init
# 修改 package.json 中的 name 为 "@yt/api"
cd ../..
pnpm install
```

### 添加新应用

同样在 `apps/` 下创建新目录，流程类似。

---

## 性能优化

### Turborepo 缓存

- 本地缓存：`.turbo/cache/`
- 远程缓存：可配置（Vercel Turbo 或 S3）

### pnpm 特性

- 内容寻址存储：节省磁盘空间
- 严格依赖：避免幽灵依赖
- 快速安装：并行化和缓存

---

## 参考资料

- [pnpm Workspace](https://pnpm.io/workspaces)
- [Turborepo Handbook](https://turbo.build/repo/docs/handbook)
- [Changesets](https://github.com/changesets/changesets)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
