# Job Matching 智能匹配系统分析报告

> **文档版本**: v1.0
> **创建日期**: 2026-01-23
> **分析范围**: `apps/back-end/src/jobs` + `apps/back-end/src/matching` + `apps/front-end/src/app/jobs`

---

## 📋 目录

- [1. 系统概述](#1-系统概述)
- [2. 后端实现流程](#2-后端实现流程)
- [3. 智能匹配算法](#3-智能匹配算法)
- [4. 后端问题分析](#4-后端问题分析)
- [5. 前端实现逻辑](#5-前端实现逻辑)
- [6. 前端问题分析](#6-前端问题分析)
- [7. 改进建议](#7-改进建议)

---

## 1. 系统概述

### 1.1 功能定位
用户发布任务后，系统根据任务需求（技能、预算、标签等）智能匹配最合适的 AI Agent，并返回匹配结果。

### 1.2 核心模块
- **Jobs Service**: 任务管理服务 (`apps/back-end/src/jobs/jobs.service.ts`)
- **Matching Service**: 智能匹配算法 (`apps/back-end/src/matching/matching.service.ts`)
- **Matching Queue**: 异步队列处理 (`apps/back-end/src/jobs/jobs.matching.queue.ts`)
- **Matching Processor**: 队列消费者 (`apps/back-end/src/jobs/jobs.matching.processor.ts`)

### 1.3 技术栈
- **后端**: NestJS + Prisma + Bull (Redis Queue)
- **前端**: Next.js + React + TypeScript
- **数据库**: PostgreSQL

---

## 2. 后端实现流程

### 2.1 任务创建入口
**位置**: `apps/back-end/src/jobs/jobs.controller.ts:66-96`

```typescript
@Post()
async create(@Body() payload: CreateJobDto) {
  const job = await this.jobsService.create(payload);

  if (!payload.autoMatchEnabled) {
    return { job, matches: [] };
  }

  const hasRedisHost = Boolean(process.env.REDIS_HOST);

  if (hasRedisHost) {
    // 异步模式：加入队列
    await this.matchingQueue.enqueue(job.id);
    return { job, matches: [] };  // 返回空 matches
  }

  // 同步模式：立即匹配
  const agents = await this.agentsService.all();
  const matches = this.matchingService.match(job, agents);
  await this.jobsService.saveMatches(job.id, matches.map(...));

  const updated = await this.jobsService.setMatchStatus(
    job.id,
    matches.length ? "IN_PROGRESS" : "FAILED",
    matches.length ? null : noMatchReason
  );

  return { job: updated, matches };
}
```

### 2.2 流程对比

#### 同步流程（无 Redis）
```
用户创建任务
    ↓
检查 autoMatchEnabled
    ↓
立即执行匹配算法
    ↓
保存匹配结果到数据库
    ↓
更新任务状态: OPEN → IN_PROGRESS/FAILED
    ↓
返回 { job, matches: [Agent[], ...] }
```

#### 异步流程（有 Redis）
```
用户创建任务
    ↓
检查 autoMatchEnabled
    ↓
加入 Bull 队列
    ↓
立即返回 { job, matches: [] }  ⚠️
    ↓
后台 Worker 处理
    ↓
执行匹配算法
    ↓
保存结果，更新状态: MATCHING → IN_PROGRESS/FAILED
```

### 2.3 队列处理器
**位置**: `apps/back-end/src/jobs/jobs.matching.processor.ts:19-43`

```typescript
@Process({ name: MATCHING_JOB_NAME, concurrency: 5 })
async handle(job: QueueJob<{ jobId: string }>) {
  const target = await this.jobsService.findById(job.data.jobId);
  if (!target || !target.autoMatchEnabled) return;

  // 更新状态为 MATCHING
  if (target.status !== "MATCHING") {
    await this.jobsService.setMatchStatus(target.id, "MATCHING", null);
  }

  // 执行匹配
  const agents = await this.agentsService.all();
  const matches = this.matchingService.match(target, agents);

  await this.jobsService.saveMatches(target.id, matches.map(...));

  // 更新最终状态
  const nextStatus = matches.length ? "IN_PROGRESS" : "FAILED";
  await this.jobsService.setMatchStatus(target.id, nextStatus, matchError);
}
```

**队列配置**:
- **并发数**: 5
- **重试次数**: 3
- **退避策略**: 指数退避，初始延迟 1000ms
- **完成后删除**: `removeOnComplete: true`
- **失败保留**: `removeOnFail: false`

---

## 3. 智能匹配算法

### 3.1 匹配流程
**位置**: `apps/back-end/src/matching/matching.service.ts:159-162`

```typescript
match(job: Job, agents: Agent[]): Array<Agent & { score: number }> {
  const filtered = this.hardFilter(job, agents);
  return this.score(job, filtered).slice(0, 3);  // 返回前3个
}
```

### 3.2 硬性过滤（Hard Filter）
**位置**: `apps/back-end/src/matching/matching.service.ts:103-116`

过滤条件（全部必须满足）:
1. ✅ Agent 必须处于活跃状态 (`isActive === true`)
2. ✅ 可见性匹配（public job 不能匹配 private agent）
3. ✅ 币种一致 (`job.currency === agent.currency`)
4. ✅ 支持的支付方式 (`agent.supportedPaymentMethods.includes(job.paymentMethod)`)
5. ✅ 技能等级达标 (`skillLevelMeets(agent.skillLevel, job.requiredSkillLevel)`)
6. ✅ 价格适配度 > 0 (`priceFit(job, agent) > 0`)

### 3.3 评分算法（Scoring）
**位置**: `apps/back-end/src/matching/matching.service.ts:118-157`

#### 权重分配
```typescript
const weightsBase = {
  tagSimilarity: 0.35,      // 标签相似度 35%
  priceFit: 0.2,            // 价格匹配度 20%
  ratingScore: 0.2,         // Agent 评分 20%
  successRate: 0.15,        // 成功率 15%
  responseTimeScore: 0.1,   // 响应时间 10%
};

// URGENT 任务响应时间权重 ×1.2
if (job.priority === "URGENT") {
  weights.responseTimeScore *= 1.2;
}
```

#### 评分指标

##### 1. 标签相似度（Jaccard Index）
```typescript
tagSimilarity = intersection(jobTags, agentTags) / union(jobTags, agentTags)
```
- **范围**: 0.0 ~ 1.0
- **示例**:
  - Job tags: `["defi", "data"]`, Agent tags: `["defi", "analytics"]` → 0.33
  - Job tags: `["defi", "data"]`, Agent tags: `["defi", "data"]` → 1.0

##### 2. 价格匹配度
**位置**: `apps/back-end/src/matching/matching.service.ts:38-64`

```typescript
if (budgetMin && budgetMax) {
  if (agentPrice < budgetMin)
    return max(0, 1 - (budgetMin - agentPrice) / budgetMin);
  if (agentPrice > budgetMax)
    return max(0, 1 - (agentPrice - budgetMax) / budgetMax);

  // 在预算范围内
  const mid = (budgetMin + budgetMax) / 2;
  const span = budgetMax - budgetMin;
  return 1 - abs(agentPrice - mid) / span;
}
```

**问题示例**:
- 预算: 100-200
  - Agent 价格 = 50 → **得分 0.5** ⚠️
  - Agent 价格 = 10 → **得分 0.1** ❌（更便宜反而得分更低）
  - Agent 价格 = 150 → **得分 1.0** ✅

##### 3. Agent 评分
```typescript
ratingScore = agent.rating / 5  // 满分 5 星
```
- 未评分 → 默认 0.5

##### 4. 成功率
```typescript
successRate = agent.successRate ?? 0.5
```
- 范围: 0.0 ~ 1.0

##### 5. 响应时间
```typescript
responseTimeScore = 1 - min(avgResponseTimeMs / 5000, 1)
```
- 0ms → 1.0
- 5000ms → 0.0
- 未知 → 0.5

### 3.4 最终评分公式
```
finalScore = (
  0.35 × tagSimilarity +
  0.20 × priceFit +
  0.20 × ratingScore +
  0.15 × successRate +
  0.10 × responseTimeScore
) / sumWeights
```

---

## 4. 后端问题分析

### 4.1 P0 级别（严重，需立即修复）

#### 🔴 问题 1: 同步/异步行为不一致
**位置**: `jobs.controller.ts:73-77`

**问题描述**:
- 有 Redis: 返回 `{ job, matches: [] }`
- 无 Redis: 返回 `{ job, matches: [Agent[], ...] }`

**影响**:
- 前端无法统一处理响应
- 用户体验不一致
- 需要额外的轮询机制

**复现步骤**:
1. 设置 `REDIS_HOST` 环境变量
2. 创建任务（`autoMatchEnabled=true`）
3. 检查响应的 `matches` 字段

#### 🔴 问题 2: 价格匹配逻辑有缺陷
**位置**: `matching.service.ts:52-53`

**问题代码**:
```typescript
if (agentPrice < budgetMin)
  return Math.max(0, 1 - (budgetMin - agentPrice) / budgetMin);
```

**问题示例**:
```javascript
// 预算: budgetMin=100, budgetMax=200
priceFit({ budgetMin: 100, budgetMax: 200 }, { price: 50 })  // → 0.5
priceFit({ budgetMin: 100, budgetMax: 200 }, { price: 10 })  // → 0.1 ❌
priceFit({ budgetMin: 100, budgetMax: 200 }, { price: 1 })   // → 0.01 ❌
```

**预期行为**: 价格低于预算应该得到更高分数

**建议修复**:
```typescript
if (agentPrice < budgetMin) {
  // 低于预算不应扣分，而应视为加分项
  return 1.0;  // 或给予奖励分 1.1
}
```

#### 🔴 问题 3: 状态机不完整
**位置**: `jobs.controller.ts:89-94`

**问题描述**:
- 同步模式跳过 `MATCHING` 状态
- 异步模式: `OPEN → MATCHING → IN_PROGRESS`
- 同步模式: `OPEN → IN_PROGRESS` ❌

**影响**: 状态流转不一致，难以追踪

#### 🔴 问题 4: select 方法重复匹配
**位置**: `jobs.controller.ts:199-200`

**问题代码**:
```typescript
const agents = await this.agentsService.all();
const matches = this.matchingService.match(job, agents);  // 重新计算
```

**问题**: 不使用已保存的匹配结果，可能导致:
- 不同时间匹配结果不一致
- 性能浪费

**建议**: 使用 `getStoredMatches` 方法

---

### 4.2 P1 级别（重要，需尽快修复）

#### 🟠 问题 5: 并发竞态条件
**位置**: `jobs.matching.processor.ts:24-26`

**问题代码**:
```typescript
if (target.status !== "MATCHING") {
  await this.jobsService.setMatchStatus(target.id, "MATCHING", null);
}
```

**问题**: 缺少数据库锁，并发场景下可能:
- 同一任务被多次处理
- 状态更新冲突

**建议**: 使用乐观锁或分布式锁

#### 🟠 问题 6: explainNoMatch 逻辑漏洞
**位置**: `matching.service.ts:97-100`

**问题代码**:
```typescript
const priceOk = skillOk.filter((agent) => priceFit(job, agent) > 0);
if (!priceOk.length) return "暂无符合预算范围的智能体";

return "暂未匹配到合适的智能体";  // ❓ 何时执行？
```

**问题**: 如果 `priceOk.length > 0`，却没有匹配到 agents，原因未被解释

#### 🟠 问题 7: 重试失败的中间状态丢失
**位置**: `jobs.matching.processor.ts:47-48`

**问题代码**:
```typescript
if (job.attemptsMade < maxAttempts) return;  // 前 2 次失败不记录
```

**影响**: 无法追踪重试历史

---

### 4.3 P2 级别（优化建议）

#### 🟡 问题 8: 硬编码返回数量
**位置**: `matching.service.ts:161`

```typescript
return this.score(job, filtered).slice(0, 3);  // 硬编码 3
```

**建议**: 改为可配置参数

#### 🟡 问题 9: 队列配置不合理
**位置**: `jobs.matching.queue.ts:22-23`

```typescript
removeOnComplete: true,   // 完成任务删除
removeOnFail: false,      // 失败任务保留 → 可能堆积
```

**建议**:
- 失败任务设置 TTL
- 或定期清理

#### 🟡 问题 10: 缺少日志和监控
整个匹配流程没有详细日志，建议添加:
- 匹配耗时统计
- 过滤后 Agent 数量
- 最终得分分布

#### 🟡 问题 11: 重复代码
`buildMatches()` 和 `matches()` 方法逻辑重复，建议提取公共方法

#### 🟡 问题 12: 缺少输入验证
没有验证 `agents` 列表是否为空

---

## 5. 前端实现逻辑

### 5.1 任务创建流程
**位置**: `apps/front-end/src/app/jobs/_components/JobFormPage.tsx:221-226`

```typescript
const response = await createJob(payload);
toast({ message: "任务已发布", variant: "success" });
router.push(`/jobs/${response.job.id}`);  // 直接跳转
```

**特点**:
- 不检查 `response.matches` 是否为空
- 假设后端已完成匹配

### 5.2 任务详情页加载
**位置**: `apps/front-end/src/app/jobs/[id]/page.tsx:105-124`

```typescript
useEffect(() => {
  if (!id) return;
  const loadJob = async () => {
    const data = await fetchJobDetail(id);
    setJob(data.job);
    setMatches(data.matches ?? []);
    setSelectedAgent(data.selectedAgent ?? null);
  };
  loadJob();
}, [id]);
```

**特点**:
- 依赖后端返回完整 `matches` 数据
- 没有轮询机制

### 5.3 匹配结果展示逻辑
**位置**: `apps/front-end/src/app/jobs/[id]/page.tsx:171-177`

```typescript
const showSelectedAgent =
  job?.status === "SUBMITTED" ||
  job?.status === "REVIEWING" ||
  job?.status === "COMPLETED";

const showMatchError =
  job?.status === "FAILED" || job?.status === "CANCELLED";

const showMatches = job?.status === "IN_PROGRESS";
```

**问题**: `status=MATCHING` 时，既不显示匹配结果，也不显示加载提示

---

## 6. 前端问题分析

### 6.1 🔴 严重问题

#### 问题 1: 没有处理异步匹配场景

**场景复现**:
```
1. 用户创建任务（autoMatchEnabled=true，后端有 Redis）
2. 后端返回 { job: { status: "OPEN" }, matches: [] }
3. 前端跳转到 /jobs/{id}
4. 调用 fetchJobDetail(id)
5. 后端可能还在匹配中，返回 { job: { status: "MATCHING" }, matches: [] }
6. 前端显示：空白（没有任何提示）❌
```

**用户体验**:
- ❌ 用户不知道系统在匹配
- ❌ 需要手动刷新页面
- ❌ 没有进度提示

**对比同步模式**:
```
1. 用户创建任务（autoMatchEnabled=true，后端无 Redis）
2. 后端同步匹配，返回 { job: { status: "IN_PROGRESS" }, matches: [Agent[], ...] }
3. 前端跳转到 /jobs/{id}
4. 调用 fetchJobDetail(id)
5. 前端立即显示匹配结果 ✅
```

#### 问题 2: 缺少轮询或实时更新机制

前端没有实现:
- ❌ 轮询检查任务状态
- ❌ WebSocket 实时推送
- ❌ Server-Sent Events (SSE)

#### 问题 3: MATCHING 状态没有友好 UI

**当前逻辑**:
```typescript
const showMatches = job?.status === "IN_PROGRESS";  // MATCHING 时不显示
```

**效果**: `status=MATCHING` 时，页面显示空白区域

### 6.2 🟡 中等问题

#### 问题 4: 状态展示不完整

虽然定义了 `MATCHING` 状态：
```typescript
const statusVariants: Record<JobStatus, ...> = {
  MATCHING: "purple",
  // ...
};
```

但详情页没有对应的 UI 处理

#### 问题 5: 缺少刷新按钮

详情页没有提供:
- 手动刷新按钮
- 自动刷新倒计时
- "匹配中，请稍候..." 的提示

---

## 7. 改进建议

### 7.1 后端改进

#### 方案 1: 统一响应格式（推荐）

```typescript
@Post()
async create(@Body() payload: CreateJobDto) {
  const job = await this.jobsService.create(payload);

  if (!payload.autoMatchEnabled) {
    return { job, matches: [] };
  }

  const hasRedisHost = Boolean(process.env.REDIS_HOST);

  if (hasRedisHost) {
    await this.matchingQueue.enqueue(job.id);
    // 更新状态为 MATCHING
    const updated = await this.jobsService.setMatchStatus(job.id, "MATCHING", null);
    return { job: updated, matches: [] };  // 明确状态
  }

  // 同步模式也先设置 MATCHING 状态
  await this.jobsService.setMatchStatus(job.id, "MATCHING", null);

  const agents = await this.agentsService.all();
  const matches = this.matchingService.match(job, agents);

  await this.jobsService.saveMatches(job.id, matches.map(...));
  const finalJob = await this.jobsService.setMatchStatus(
    job.id,
    matches.length ? "IN_PROGRESS" : "FAILED",
    matches.length ? null : noMatchReason
  );

  return { job: finalJob, matches };
}
```

#### 方案 2: 修复价格匹配逻辑

```typescript
const priceFit = (job: Job, agent: Agent): number => {
  const budgetMin = job.budgetMin ?? 0;
  const budgetMax = job.budgetMax ?? 0;
  if (!budgetMin && !budgetMax) return 0.5;

  const agentPrice = getAgentPrice(job.paymentMethod, agent);
  if (!agentPrice) return 0.4;

  if (budgetMin && budgetMax) {
    // 低于预算下限：给予满分或奖励分
    if (agentPrice < budgetMin) {
      return 1.0;  // 或 1.1 作为奖励
    }

    // 高于预算上限：线性扣分
    if (agentPrice > budgetMax) {
      return Math.max(0, 1 - (agentPrice - budgetMax) / budgetMax);
    }

    // 在预算范围内：越接近中位数得分越高
    const mid = (budgetMin + budgetMax) / 2;
    const span = budgetMax - budgetMin;
    if (!span) return 1;
    return 1 - Math.abs(agentPrice - mid) / span;
  }

  // 只有单一预算值的情况
  const budget = budgetMax || budgetMin;
  if (!budget) return 0.5;

  if (agentPrice <= budget) {
    return 1.0;  // 满足预算
  }

  return Math.max(0, 1 - (agentPrice - budget) / budget);
};
```

#### 方案 3: 添加并发控制

```typescript
@Process({ name: MATCHING_JOB_NAME, concurrency: 5 })
async handle(job: QueueJob<{ jobId: string }>) {
  const lockKey = `matching:lock:${job.data.jobId}`;
  const lock = await this.redisService.acquireLock(lockKey, 60000);  // 60s 超时

  if (!lock) {
    throw new Error('Failed to acquire lock for matching');
  }

  try {
    // 执行匹配逻辑
    // ...
  } finally {
    await this.redisService.releaseLock(lockKey, lock);
  }
}
```

#### 方案 4: 完善日志

```typescript
this.logger.log(`Starting match for job ${jobId}`);
this.logger.debug(`Agents before filter: ${agents.length}`);
this.logger.debug(`Agents after filter: ${filtered.length}`);
this.logger.debug(`Top 3 matches: ${JSON.stringify(matches.map(m => ({ id: m.id, score: m.score })))}`);
```

---

### 7.2 前端改进

#### 方案 1: 添加轮询机制（推荐）

```typescript
// apps/front-end/src/app/jobs/[id]/page.tsx
useEffect(() => {
  if (job?.status !== "MATCHING") return;

  const pollInterval = setInterval(async () => {
    try {
      const data = await fetchJobDetail(id);

      if (data.job.status !== "MATCHING") {
        setJob(data.job);
        setMatches(data.matches ?? []);
        setSelectedAgent(data.selectedAgent ?? null);
        clearInterval(pollInterval);
      }
    } catch (error) {
      console.error('Failed to poll job status:', error);
    }
  }, 3000);  // 每 3 秒轮询一次

  return () => clearInterval(pollInterval);
}, [job?.status, id]);
```

#### 方案 2: 添加友好的 UI 提示

```typescript
// 在 JobMatchSection 组件中添加
{job?.status === "MATCHING" && (
  <Card className="border-purple-500/20 bg-purple-500/10">
    <CardContent className="p-6">
      <div className="flex items-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-400 border-t-transparent" />
        <div className="flex-1">
          <p className="text-purple-200 font-semibold">正在智能匹配合适的 Agent...</p>
          <p className="text-purple-300/70 text-sm mt-1">
            系统正在根据任务需求筛选最佳匹配，预计需要 5-10 秒
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

#### 方案 3: 添加手动刷新按钮

```typescript
<div className="flex items-center justify-between">
  <h4 className="font-black text-xs uppercase tracking-[0.2em]">
    匹配结果
  </h4>
  {job?.status === "MATCHING" && (
    <Button
      size="sm"
      variant="outline"
      onClick={async () => {
        const data = await fetchJobDetail(id);
        setJob(data.job);
        setMatches(data.matches ?? []);
      }}
      className="text-xs"
    >
      <RefreshIcon className="w-3 h-3 mr-1" />
      刷新状态
    </Button>
  )}
</div>
```

#### 方案 4: WebSocket 实时推送（长期方案）

**后端**:
```typescript
// jobs.matching.processor.ts
async handle(job: QueueJob<{ jobId: string }>) {
  // ... 匹配逻辑

  // 匹配完成后推送
  this.websocketGateway.emit(`job:${job.data.jobId}:matched`, {
    jobId: job.data.jobId,
    status: nextStatus,
    matches: matches.map(m => ({ id: m.id, score: m.score }))
  });
}
```

**前端**:
```typescript
useEffect(() => {
  if (!id || job?.status !== "MATCHING") return;

  const socket = io(WS_URL);

  socket.on(`job:${id}:matched`, (data) => {
    setJob(prevJob => ({ ...prevJob, ...data }));
    setMatches(data.matches);
    toast({ message: "匹配完成！", variant: "success" });
  });

  return () => socket.disconnect();
}, [id, job?.status]);
```

---

### 7.3 优先级建议

#### 立即修复（P0）
1. ✅ 统一后端响应格式
2. ✅ 修复价格匹配逻辑
3. ✅ 前端添加轮询 + UI 提示

#### 尽快修复（P1）
1. 添加并发控制
2. 修复 `explainNoMatch` 逻辑
3. `select` 方法使用已保存的匹配结果

#### 优化改进（P2）
1. 添加日志和监控
2. 配置化匹配参数
3. 代码重构（去重）
4. WebSocket 实时推送

---

## 附录

### A. 相关文件清单

#### 后端
- `apps/back-end/src/jobs/jobs.controller.ts` - 任务 API 控制器
- `apps/back-end/src/jobs/jobs.service.ts` - 任务业务逻辑
- `apps/back-end/src/jobs/jobs.matching.queue.ts` - 队列服务
- `apps/back-end/src/jobs/jobs.matching.processor.ts` - 队列消费者
- `apps/back-end/src/matching/matching.service.ts` - 匹配算法

#### 前端
- `apps/front-end/src/apis/jobs.ts` - API 调用层
- `apps/front-end/src/app/jobs/page.tsx` - 任务列表页
- `apps/front-end/src/app/jobs/[id]/page.tsx` - 任务详情页
- `apps/front-end/src/app/jobs/_components/JobFormPage.tsx` - 任务表单
- `apps/front-end/src/app/jobs/_components/JobMatchSection.tsx` - 匹配结果展示

### B. 术语表

| 术语 | 说明 |
|------|------|
| Hard Filter | 硬性过滤，不满足条件的 Agent 直接排除 |
| Soft Score | 软评分，通过加权计算得出综合分数 |
| Jaccard Index | 集合相似度算法，用于计算标签相似度 |
| Bull Queue | 基于 Redis 的任务队列库 |
| Optimistic Locking | 乐观锁，用于解决并发冲突 |

### C. 测试建议

#### 单元测试
```typescript
describe('MatchingService', () => {
  it('should filter agents by skill level', () => {
    const job = { requiredSkillLevel: 'ADVANCED', ... };
    const agents = [
      { skillLevel: 'BEGINNER', ... },
      { skillLevel: 'ADVANCED', ... },
      { skillLevel: 'EXPERT', ... },
    ];

    const result = matchingService.hardFilter(job, agents);
    expect(result).toHaveLength(2);  // ADVANCED + EXPERT
  });

  it('should prioritize cheaper agents within budget', () => {
    const job = { budgetMin: 100, budgetMax: 200, ... };
    const cheap = { pricePerTask: 50, ... };
    const mid = { pricePerTask: 150, ... };
    const expensive = { pricePerTask: 250, ... };

    expect(priceFit(job, cheap)).toBeGreaterThan(priceFit(job, mid));
    expect(priceFit(job, expensive)).toBeLessThan(priceFit(job, mid));
  });
});
```

#### 集成测试
```typescript
describe('Job Creation with Matching', () => {
  it('should match agents asynchronously with Redis', async () => {
    // 设置 REDIS_HOST
    process.env.REDIS_HOST = 'localhost';

    const job = await createJob({ autoMatchEnabled: true, ... });

    expect(job.matches).toEqual([]);  // 初始为空
    expect(job.job.status).toBe('MATCHING');

    // 等待队列处理
    await delay(5000);

    const updated = await fetchJobDetail(job.job.id);
    expect(updated.job.status).toBe('IN_PROGRESS');
    expect(updated.matches.length).toBeGreaterThan(0);
  });
});
```

---

**文档结束**
