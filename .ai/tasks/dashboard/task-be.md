# Dashboard 模块 - 后端任务清单

> 任务清单位置：`.ai/tasks/dashboard/task-be.md`
> 工作分支：`feat/celery`
> 关联 PRD：`.ai/docs/prd.md` 3.7 章节

---

## Phase 1: 基础设施

### [DONE] DASH-BE-001 创建 Dashboard DTO 定义

- **验收标准**：
  - 创建 `apps/back-end/src/dashboard/dashboard.dto.ts`
  - 包含 `PaginationQueryDto` (page, limit 参数)
  - 包含 `DashboardQueryDto` (address + 分页参数)
  - 使用 class-validator 装饰器进行参数校验
- **依赖**：无
- **Notes**：分页默认值 page=1, limit=10
- **完成日期**：2026-01-19

### [DONE] DASH-BE-002 实现 getStats() 统计概览接口

- **验收标准**：
  - 在 `dashboard.service.ts` 添加 `getStats(address: string)` 方法
  - 返回字段：walletBalance, lockedAmount, totalEarnings, totalSpent
  - 返回字段：publishedJobsCount, activeJobsCount, completedJobsCount
  - 返回字段：publishedAgentsCount, signedAgentsCount, openDisputesCount
  - 使用 Prisma $transaction 保证数据一致性
  - 在 `dashboard.controller.ts` 添加 `GET /dashboard/stats` 路由
- **依赖**：DASH-BE-001
- **Notes**：activeJobs 定义为 status IN (OPEN, MATCHING, IN_PROGRESS)
- **完成日期**：2026-01-19

---

## Phase 2: 核心 API 实现

### [DONE] DASH-BE-003 实现 getPublishedJobs() 我发布的任务接口

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
- **完成日期**：2026-01-19

### [DONE] DASH-BE-004 实现 getPublishedAgents() 我发布的智能体接口

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
- **完成日期**：2026-01-19

### [DONE] DASH-BE-005 实现 getSignedAgents() 已签约智能体接口

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
- **完成日期**：2026-01-19

### [DONE] DASH-BE-006 实现 getDisputes() 争议中心接口

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
- **完成日期**：2026-01-19

---

## Phase 3: 测试与验证

### [DONE] DASH-BE-007 API 接口测试

- **验收标准**：
  - 所有 5 个接口可通过 curl/Postman 正常调用
  - 分页参数正确工作
  - 空数据返回正确格式 (data: [], pagination: {...})
  - 无效 address 返回空结果而非错误
- **依赖**：DASH-BE-002, DASH-BE-003, DASH-BE-004, DASH-BE-005, DASH-BE-006
- **Notes**：使用 Supabase 测试数据库
- **完成日期**：2026-01-19

---

## Phase 4: 合约自动化轮询（Backend Keeper）

### [DONE] DASH-BE-008 接入 Subgraph 读链上到期任务

- **验收标准**：
  - 新增 Subgraph 查询客户端（仅用必要字段）
  - 支持查询到期 Escrow（status=LOCKED 且 releaseAt <= now）
  - 支持查询可结算 Dispute（status=OPEN 且 openedAt + votingPeriod <= now）
  - 查询结果限定分页/批量大小，避免全量拉取
- **依赖**：DASH-SC-010, Subgraph 部署可用
- **影响文件**：
  - `apps/back-end/src/keeper/subgraph.client.ts`
  - `apps/back-end/src/keeper/queries.ts`
- **完成日期**：2026-01-23

### [DONE] DASH-BE-009 实现 Keeper 轮询任务

- **验收标准**：
  - 定时轮询间隔默认 2 分钟（可配置）
  - 使用钱包地址作为 keeper 签名地址（配置项）
  - 调用 `Escrow.releaseReady()` 与 `DisputeDAO.resolveReady()`
  - 单轮最多处理 N 条（可配置）
  - 失败自动重试，避免重复执行（幂等处理）
- **依赖**：DASH-BE-008
- **影响文件**：
  - `apps/back-end/src/keeper/index.ts`
  - `apps/back-end/src/keeper/scheduler.ts`
  - `apps/back-end/src/keeper/runner.ts`
- **完成日期**：2026-01-23

### [DONE] DASH-BE-010 测试与本地验证模块

- **验收标准**：
  - 提供本地测试入口（dry-run 模式，仅打印将执行的 jobId）
  - 提供集成测试脚本（可模拟调用 releaseReady/resolveReady）
  - 关键配置项可通过 `.env` 覆盖（RPC、keeper 私钥、轮询间隔）
  - 在 `.env.example` 中补充 keeper 配置项
- **依赖**：DASH-BE-009
- **影响文件**：
  - `apps/back-end/src/keeper/__tests__/keeper.test.ts`
  - `apps/back-end/src/keeper/cli.ts`
- **完成日期**：2026-01-23

### [DONE] DASH-BE-011 错误与日志可观测

- **验收标准**：
  - 轮询与交易失败实时打印到终端（包含 tx hash / revert reason）
  - 每轮任务输出摘要（成功/失败数量、耗时）
  - 支持日志级别配置（info/warn/error）
- **依赖**：DASH-BE-009
- **影响文件**：
  - `apps/back-end/src/keeper/logger.ts`
  - `apps/back-end/src/keeper/runner.ts`
- **完成日期**：2026-01-23

---

## Phase 5: 性能与可靠性优化

### [DONE] DASH-BE-012 批处理与退避策略

- **验收标准**：
  - 支持每轮批量处理（maxBatch 可配置）
  - 失败任务指数退避（避免高频失败刷链）
  - 支持自定义重试上限
- **依赖**：DASH-BE-009
- **影响文件**：
  - `apps/back-end/src/keeper/runner.ts`
  - `apps/back-end/src/keeper/scheduler.ts`
  - `apps/back-end/src/keeper/state.ts`
  - `apps/back-end/src/keeper/config.ts`
  - `apps/back-end/.env.example`
 - **完成日期**：2026-01-24

### [DONE] DASH-BE-013 幂等与重复调用保护

- **验收标准**：
  - 记录已处理 jobId（短期缓存或持久化）
  - 同一 jobId 在冷却窗口内不重复发起交易
  - 出错后可重新放行
- **依赖**：DASH-BE-009
- **影响文件**：
  - `apps/back-end/src/keeper/state.ts`
  - `apps/back-end/src/keeper/runner.ts`
 - **完成日期**：2026-01-24

### [DONE] DASH-BE-014 成本与链上反馈优化

- **验收标准**：
  - 仅对“可执行”的 jobId 发交易（预估 gas + 静态模拟）
  - 记录每笔交易 gas 使用与成本
  - 输出失败原因到终端（revert reason）
- **依赖**：DASH-BE-009, DASH-BE-011
 - **影响文件**：
  - `apps/back-end/src/keeper/runner.ts`
 - **完成日期**：2026-01-24
- **影响文件**：
  - `apps/back-end/src/keeper/runner.ts`
  - `apps/back-end/src/keeper/logger.ts`

---

## 版本历史

- **2026-01-19**: 初始版本，基于 PRD 3.7 拆解
- **2026-01-19**: DASH-BE-001 ~ 006 完成，由 Codex Cloud 执行
