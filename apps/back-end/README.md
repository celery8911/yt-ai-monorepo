# Back-End Applications

> Backend Agent 的工作目录

## 目录用途

这个目录用于存放所有后端应用和服务。

## 工作范围

- API 服务开发（GraphQL）
- 微服务架构
- 数据库设计和操作
- 后端业务逻辑
- 中间件和工具服务

## 技术栈

- NestJS
- TypeScript
- Prisma
- PostgreSQL
- Supabase
- GraphQL

## 依赖包

后端应用可以使用以下内部包：
- `@yt/libs` - 通用工具函数库（后端相关）

## 与其他应用的关系

- 为 `apps/front-end/` 提供 API 接口
- 可以监听 `apps/contract/` 中的智能合约事件
- 可以查询 Subgraph 数据

## 负责人

Backend Agent - 详见 [`.ai/agents/backend-agent.md`](../../.ai/agents/backend-agent.md)

## 任务清单

后端应用相关任务请查看：[`.ai/tasks/task-be.md`](../../.ai/tasks/task-be.md)
