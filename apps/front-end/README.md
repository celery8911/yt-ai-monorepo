# Front-End Applications

> Frontend Agent 的工作目录

## 目录用途

这个目录用于存放所有前端应用项目。

## 工作范围

- Web 应用开发
- 其他前端项目

## 技术栈

- 框架: Next.js 16 + TypeScript
- Web3: Wagmi + Viem + RainbowKit
- UI: Tailwind CSS + shadcn/ui
- 图表: Recharts
- 状态: Zustand

## 依赖包

前端应用可以使用以下内部包：
- `@yt/ui` - UI 组件库
- `@yt/hooks` - React Hooks 工具库
- `@yt/libs` - 通用工具函数库

## 与其他应用的关系

- 可以调用 `apps/back-end/` 中的 API 接口
- 可以集成 `apps/contract/` 中的智能合约（通过 ABI）

## 负责人

Frontend Agent - 详见 [`.ai/agents/frontend-agent.md`](../../.ai/agents/frontend-agent.md)

## 任务清单

前端应用相关任务请查看：[`.ai/tasks/task-fe.md`](../../.ai/tasks/task-fe.md)
