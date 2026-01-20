# yt-ai-monorepo

AI-Native Monorepo 工程平台，基于 qc-monorepo 的架构搭建，提供统一的包管理、构建流水线与 AI 工作流基础设施。

## ✨ 特性

- **统一的 Monorepo 架构**：pnpm workspace + Turborepo
- **可复用的包体系**：UI 组件库、Hooks 工具库、通用工具库
- **AI 工作流内建**：提供分析命令与多角色 Subagents 规范
- **一致的构建体验**：各包保留原有构建工具（Vite、Rollup、Microbundle）

## 🧱 项目结构

```
.
├── apps/
│   ├── front-end/           # 前端应用（Frontend Agent）
│   ├── back-end/            # 后端服务（Backend Agent）
│   ├── contract/            # 智能合约和 Subgraph（Contract Agent）
│   └── yt-ui-interface/     # Storybook 展示应用
├── packages/
│   ├── yt-ui/               # UI 组件库
│   ├── yt-hooks/            # Hooks 工具库
│   └── yt-libs/             # 通用工具库
├── .ai/                     # AI 相关文档
│   ├── docs/                # 核心文档
│   ├── agents/              # Agent 定义
│   ├── commands/            # 命令说明
│   └── tasks/               # 任务清单
├── task.md                  # 任务总览
└── README.md
```

## 🧰 技术栈

- **包管理**：pnpm workspace
- **构建编排**：Turborepo
- **UI**：Vite + Tailwind CSS
- **Hooks 构建**：Rollup
- **工具库构建**：Microbundle
- **语言**：TypeScript

## 🚀 快速开始

```bash
pnpm install
pnpm dev
```

## 🤖 AI 工作流

- **需求分析命令**：[`commands/analyze.md`](./commands/analyze.md)
- **任务状态机**：[`task.md`](./task.md)
- **角色定义**：[`subagents/`](./subagents/)

## 📦 包说明

- **@yt/ui**：React UI 组件库（packages/yt-ui）
- **@yt/hooks**：React Hooks 工具库（packages/yt-hooks）
- **@yt/libs**：通用工具函数库（packages/yt-libs）
- **@yt/ui-interface**：Storybook 展示应用（apps/yt-ui-interface）

## 🧑‍💻 开发指南

1. 安装依赖：`pnpm install`
2. 添加依赖（必须在仓库根目录执行）：
   - 给某个包添加依赖：`pnpm add <dep> -F <workspace-package>`  
     示例：`pnpm add react -F @yt/ui`
   - 给某个包添加开发依赖：`pnpm add <dep> -D -F <workspace-package>`  
     示例：`pnpm add @types/react -D -F @yt/ui`
   - 给根目录添加依赖：`pnpm add <dep> -w`  
     示例：`pnpm add dotenv -w`
3. 启动 Storybook：`pnpm --filter @yt/ui-interface dev`
4. 构建所有包：`pnpm build`
5. 查看任务清单：打开 `task.md`

如需需求分析与任务拆解，请参考 `/analyze` 命令说明。
