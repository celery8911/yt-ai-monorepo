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

## 项目开发规范

### 分支与提交

- 分支命名：`feature/<scope>`、`fix/<scope>`、`chore/<scope>`
- 提交信息：`type(scope): message`，示例：`feat(api): add user profile endpoint`
- 保持提交粒度小且可回滚，提交前通过本地自检

### 代码风格

- 统一使用 TypeScript，避免 `any`（除非有明确注释说明）
- Nest 模块按领域拆分，控制器与服务分层清晰
- DTO 与验证规则必须显式定义，避免隐式类型推断

### 数据库与迁移

- Prisma schema 变更需同步更新迁移文件
- 迁移命名清晰，避免合并多个不相关变更
- 严禁在生产环境直接修改数据库结构

### 模块与目录映射

- `src/modules`：业务领域模块
- `src/controllers`：HTTP/GraphQL 控制器模块
- `src/services`：服务层模块
- `src/dto`：请求/响应 DTO 模块
- `src/entities`：领域实体模块
- `src/common`：通用能力模块（拦截器/过滤器/守卫等）
- `src/config`：配置模块

### 接口与协议

- API 路由统一管理，禁止在控制器内拼接魔法字符串
- GraphQL Schema 变更需同步更新文档与调用方
- 对外接口必须有鉴权与错误码定义

### 质量与测试

- 关键业务逻辑需提供单元测试或集成测试
- 异常路径必须覆盖日志与错误处理
- 重大改动需更新对应说明文档

### 环境与依赖

- 依赖安装与脚本统一使用 `pnpm`
- 环境变量写入 `.env`，不要提交敏感信息
