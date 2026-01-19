# Dashboard 模块 - 后端任务清单

> 任务清单位置：`.ai/tasks/dashboard/task-be.md`
> 工作分支：`feat/celery`
> 关联 PRD：`.ai/docs/prd.md` 3.7 章节

---

## Phase 1: 基础设施

### [TODO] DASH-BE-001 创建 Dashboard DTO 定义

- **验收标准**：
  - 创建 `apps/back-end/src/dashboard/dashboard.dto.ts`
  - 包含 `PaginationQueryDto` (page, limit 参数)
  - 包含 `DashboardQueryDto` (address + 分页参数)
  - 使用 class-validator 装饰器进行参数校验
- **依赖**：无
- **Notes**：分页默认值 page=1, limit=10

### [TODO] DASH-BE-002 实现 getStats() 统计概览接口

- **验收标准**：
  - 在 `dashboard.service.ts` 添加 `getStats(address: string)` 方法
  - 返回字段：walletBalance, lockedAmount, totalEarnings, totalSpent
  - 返回字段：publishedJobsCount, activeJobsCount, completedJobsCount
  - 返回字段：publishedAgentsCount, signedAgentsCount, openDisputesCount
  - 使用 Prisma $transaction 保证数据一致性
  - 在 `dashboard.controller.ts` 添加 `GET /dashboard/stats` 路由
- **依赖**：DASH-BE-001
- **Notes**：activeJobs 定义为 status IN (OPEN, MATCHING, IN_PROGRESS)

---

## Phase 2: 核心 API 实现

### [TODO] DASH-BE-003 实现 getPublishedJobs() 我发布的任务接口

- **验收标准**：
  - 添加 `getPublishedJobs(address, page, limit)` 方法
  - 过滤条件：`Job.createdBy == address`
  - 返回字段：id, title, status, category, budgetMin, budgetMax, currency, priority
  - 返回字段：bidsCount (关联 Bid 表统计), selectedAgentId, selectedAgentName
  - 返回字段：createdAt, deadlineAt
  - 支持分页，返回 PaginatedResponse 格式
  - 添加 `GET /dashboard/published-jobs` 路由
- **依赖**：DASH-BE-001
- **Notes**：需要关联查询 Bid 表获取竞价数量，关联 Agent 表获取选中 Agent 名称

### [TODO] DASH-BE-004 实现 getPublishedAgents() 我发布的智能体接口

- **验收标准**：
  - 添加 `getPublishedAgents(address, page, limit)` 方法
  - 过滤条件：`Agent.owner == address`
  - 返回字段：id, name, category, isActive, visibility, skillLevel
  - 返回字段：pricePerTask, currency, rating, successRate
  - 返回字段：activeJobsCount, completedJobsCount, totalEarnings, createdAt
  - 支持分页
  - 添加 `GET /dashboard/published-agents` 路由
- **依赖**：DASH-BE-001
- **Notes**：totalEarnings 通过 Bill 表聚合 (status=PAID)，jobCount 通过 Job.selectedAgentId 统计

### [TODO] DASH-BE-005 实现 getSignedAgents() 已签约智能体接口

- **验收标准**：
  - 添加 `getSignedAgents(address, page, limit)` 方法
  - 过滤条件：`Job.createdBy == address AND Job.selectedAgentId IS NOT NULL`
  - 返回字段：jobId, jobTitle, jobStatus
  - 返回字段：agentId, agentName, agentCategory, agentRating
  - 返回字段：contractAmount (从 Escrow 获取), currency, contractStatus, signedAt
  - 支持分页
  - 添加 `GET /dashboard/signed-agents` 路由
- **依赖**：DASH-BE-001
- **Notes**：需要三层关联查询 Job → Agent + Escrow

### [TODO] DASH-BE-006 实现 getDisputes() 争议中心接口

- **验收标准**：
  - 添加 `getDisputes(address, page, limit)` 方法
  - 过滤条件：`Dispute.initiator == address OR Job.createdBy == address` (双向过滤)
  - 返回字段：id, jobId, jobTitle, status, initiator, isMyInitiated, reason
  - 返回字段：votesFor, votesAgainst, totalWeight
  - 返回字段：escrowAmount (关联 Escrow), currency, resolvedOutcome
  - 返回字段：createdAt, resolvedAt
  - 支持分页
  - 添加 `GET /dashboard/disputes` 路由
- **依赖**：DASH-BE-001
- **Notes**：tags 和 priority 字段暂不实现 (MVP 阶段跳过)

---

## Phase 3: 测试与验证

### [TODO] DASH-BE-007 API 接口测试

- **验收标准**：
  - 所有 5 个接口可通过 curl/Postman 正常调用
  - 分页参数正确工作
  - 空数据返回正确格式 (data: [], pagination: {...})
  - 无效 address 返回空结果而非错误
- **依赖**：DASH-BE-002, DASH-BE-003, DASH-BE-004, DASH-BE-005, DASH-BE-006
- **Notes**：使用 Supabase 测试数据库

---

## 版本历史

- **2026-01-19**: 初始版本，基于 PRD 3.7 拆解
