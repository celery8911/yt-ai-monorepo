# 前端工程任务清单

> 本文件仅由 Frontend Agent 读取和更新
> 负责 @yt/ui、@yt/hooks、Storybook 相关任务

**任务 ID 前缀**: FE-XXX

---

## 当前状态

当前项目处于架构搭建阶段（已完成），尚无具体的前端开发任务。

所有架构搭建任务（LC-001 到 LC-018）已于 2026-01-12 完成。

---

## 待办任务

目前无待办任务。

当有新的前端需求时，将在此添加 [TODO] 任务。

---

## 任务格式示例

```markdown
## Phase 1: [Phase 描述]

### [TODO] [FE-001] 任务标题

- **验收标准**：
  - 标准 1
  - 标准 2
  - 标准 3
- **依赖**：[可选] BE-001, SC-005
- **执行步骤**：[可选]
  1. 步骤 1
  2. 步骤 2
- **影响文件**：
  - packages/yt-ui/src/components/Button.tsx
  - packages/yt-ui/src/components/Button.stories.tsx
- **Notes**：[可选] 备注信息

### [DONE] [FE-002] 完成的任务示例 (2026-01-12)

- **验收标准**：
  - 标准 1 ✓
  - 标准 2 ✓
- **Notes**：完成说明
```

---

## 工作范围

Frontend Agent 负责的代码范围：

### ✅ 可以修改的目录

- `apps/front-end/` - 前端应用项目（主要工作目录）
  - Web 应用开发
  - React / Next.js 应用

- `packages/yt-ui/` - UI 组件库
  - 开发 React 组件
  - 使用 Tailwind CSS 4 编写样式
  - 基于 Radix UI 构建无障碍组件

- `packages/yt-hooks/` - React Hooks 库
  - 开发可复用的 React Hooks
  - 状态管理逻辑（使用 Immer）

- `apps/yt-ui-interface/` - Storybook 文档站
  - 更新组件 Stories
  - 维护组件文档

- `packages/yt-libs/` - 工具函数库
  - 添加纯函数工具

### ❌ 禁止修改的目录

- `apps/back-end/` - 后端应用（Backend Agent 负责）
- `apps/contract/` - 智能合约和 Subgraph（Contract Agent 负责）
- 不修改根目录构建配置（除非明确授权）
- 不修改 Turborepo/pnpm workspace 配置

---

## 详细职责说明

请参考：[`.ai/agents/frontend-agent.md`](../agents/frontend-agent.md)

---

## 依赖管理

如果前端任务依赖后端或合约任务，请在任务的"依赖"字段中明确标注：

```markdown
- **依赖**：BE-003（用户 API 接口）, SC-001（合约 ABI）
```

---

## 版本历史

- **2026-01-12**: 初始版本，文档重组创建
