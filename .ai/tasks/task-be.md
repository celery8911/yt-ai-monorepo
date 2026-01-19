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

### Phase 1: 账单号账簿功能实现

#### [DONE] BE-001: 创建账单种子数据脚本 (2026-01-19)

**任务描述**: 创建数据库种子脚本，生成账单测试数据以支持前端账单页面展示

- **验收标准**:
  - 创建 `apps/back-end/src/seed/bills.seed.ts` 文件
  - 生成至少 10 条账单记录，覆盖 2024年1-3月
  - 账单总金额符合 UI 设计（累计 ~14.82 ETH，支出 ~5.21 ETH）
  - 包含不同的付款方和收款方地址
  - 所有账单状态为 PAID，包含合理的 createdAt 和 paidAt 时间
  - 创建 `apps/back-end/src/seed/index.ts` 入口文件
  - 在 `package.json` 中添加 `seed` 脚本命令
  - 成功运行 `pnpm seed` 命令生成数据到数据库

- **影响文件**:
  - `apps/back-end/src/seed/bills.seed.ts` (新建)
  - `apps/back-end/src/seed/index.ts` (新建)
  - `apps/back-end/package.json` (修改 scripts)

- **依赖**: 无

- **完成日期**: 2026-01-19

- **执行结果**:
  - ✅ 成功创建 14 条账单记录
  - ✅ 总收入: 12.90 ETH (11条账单)
  - ✅ 总支出: 5.21 ETH (3条账单)
  - ✅ 覆盖 2024年1-3月
  - ✅ 所有账单状态为 PAID

- **Notes**: 数据已成功写入 Supabase PostgreSQL 数据库，可供前端调用

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
