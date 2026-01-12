# 后端工程任务清单

> 本文件仅由 Backend Agent 读取和更新
> 负责 API、数据库、服务端逻辑相关任务

**任务 ID 前缀**: BE-XXX

---

## 当前状态

当前项目处于架构搭建阶段（已完成），尚无具体的后端开发任务。

所有架构搭建任务（LC-001 到 LC-018）已于 2026-01-12 完成。

---

## 待办任务

目前无待办任务。

当有新的后端需求时，将在此添加 [TODO] 任务。

---

## 任务格式示例

```markdown
## Phase 1: [Phase 描述]

### [TODO] [BE-001] 任务标题

- **验收标准**：
  - 标准 1
  - 标准 2
  - 标准 3
- **依赖**：[可选] FE-003, SC-002
- **执行步骤**：[可选]
  1. 步骤 1
  2. 步骤 2
- **影响文件**：
  - packages/yt-api/src/routes/users.ts
  - packages/yt-api/src/models/User.ts
- **Notes**：[可选] 备注信息

### [DONE] [BE-002] 完成的任务示例 (2026-01-12)

- **验收标准**：
  - 标准 1 ✓
  - 标准 2 ✓
- **Notes**：完成说明
```

---

## 工作范围

Backend Agent 负责的代码范围：

### ✅ 可以修改的目录

- `apps/back-end/` - 后端应用和服务（主要工作目录）
  - NestJS 应用开发
  - GraphQL API 实现
  - Prisma 数据库操作
  - PostgreSQL / Supabase 集成

### ❌ 禁止修改的目录

- `apps/front-end/` - 前端应用（Frontend Agent 负责）
- `apps/contract/` - 智能合约和 Subgraph（Contract Agent 负责）
- `packages/yt-ui/` - UI 组件库（Frontend Agent 负责）
- `packages/yt-hooks/` - React Hooks（Frontend Agent 负责）
- 不修改根目录构建配置（除非明确授权）

---

## 详细职责说明

请参考：[`.ai/agents/backend-agent.md`](../agents/backend-agent.md)

---

## 依赖管理

如果后端任务依赖前端或合约任务，请在任务的"依赖"字段中明确标注：

```markdown
- **依赖**：FE-005（前端表单组件）, SC-002（合约事件监听）
```

---

## 技术栈建议

### API 框架
- Express.js / Fastify / NestJS（根据项目需要选择）

### 数据库
- PostgreSQL / MongoDB / MySQL（根据项目需要选择）
- ORM: Prisma / TypeORM / Sequelize

### 认证
- JWT / OAuth 2.0

### 文档
- OpenAPI (Swagger) / GraphQL Schema

---

## 版本历史

- **2026-01-12**: 初始版本，文档重组创建
