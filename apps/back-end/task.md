1. 读取 apps/back-end/README.md，获取后端开发规范
2. 根据 README.md 中的 ## 技术栈，使用现在最先进以及流行的方式搭建 back-end 后端项目架构
3. 根据下面的功能模块实现对应的模块，数据库暂时没有，预留空位让我填连接方式就好，agents 模块帮我写一个 mock 返回 agents 列表的接口，方便我测试

## 3. 功能模块

### 3.1 Jobs 市场 (任务)

**核心字段**

```typescript
Job {
  // 基础信息
  title: string
  description: text
  category: string
  tags: string[]

  // 支付设置
  paymentMethod: PaymentMethod  // FREE/PER_TASK/HUMAN_HIRING/RESULT_BASED
  budgetMin: number
  budgetMax: number
  currency: string              // USD/TOKEN

  // 任务要求
  requiredSkillLevel: SkillLevel  // BEGINNER/INTERMEDIATE/ADVANCED/EXPERT
  deliverables: text              // 交付物说明
  acceptanceCriteria: text        // 验收标准
  deadlineAt: datetime
  priority: PriorityLevel         // LOW/MEDIUM/HIGH/URGENT

  // 功能开关
  autoMatchEnabled: boolean       // 自动匹配
  biddingEnabled: boolean         // 开启竞价
  escrowEnabled: boolean          // 资金托管
  visibility: "public" | "private"

  // 结算规则
  reviewWindowDays: number        // 验收期(默认7天)
  payoutStrategy: PayoutStrategy  // WINNER_TAKE_ALL/SPLIT_IF_NO_SELECTION

  status: JobStatus  // DRAFT/OPEN/MATCHING/IN_PROGRESS/SUBMITTED/REVIEWING/COMPLETED/DISPUTED/CANCELLED
}
```

**关键 API**

```
POST /api/jobs              创建任务
GET  /api/jobs              列表(支持筛选分页)
GET  /api/jobs/{id}         详情
PUT  /api/jobs/{id}/select  选择最佳Agent
POST /api/jobs/{id}/dispute 发起争议
```

---

### 3.2 Agents 市场 (智能体)

**核心字段**

```typescript
Agent {
  // 基础信息
  name: string
  description: text
  category: string
  tags: string[]
  endpointUrl: string  // Agent调用地址

  // 能力声明
  supportedPaymentMethods: PaymentMethod[]  // 支持的支付方式
  skillLevel: SkillLevel
  deliverableFormats: DeliverableType[]  // CODE/DOCUMENTATION/DEPLOYMENT/REPORT/DATASET/MODEL

  // 定价
  pricePerTask: number         // 按任务定价
  resultBasedMinPrice: number  // 结果付费底价
  minBid: number               // 竞价底价
  currency: string

  // 运营指标
  avgResponseTimeMs: number    // 平均响应时间
  successRate: number          // 成功率
  rating: number               // 评分

  owner: string
  visibility: "public" | "private"
  isActive: boolean
}
```

**关键 API**

```
POST /api/agents           注册Agent
GET  /api/agents           列表(支持筛选)
GET  /api/agents/{id}      详情
PUT  /api/agents/{id}      更新
```

---

### 3.3 Matching & Bidding (匹配与竞价)

**匹配算法 (MVP)**

```python
# 1. Hard Filter (强过滤)
- Agent.supportedPaymentMethods 包含 Job.paymentMethod
- Agent.skillLevel >= Job.requiredSkillLevel
- Agent价格在Job.budget范围内
- Agent.isActive = true
- visibility权限满足

# 2. Scoring (评分排序)
score = 0.35 * tagSimilarity        # 标签相似度
      + 0.20 * priceFit             # 价格匹配度
      + 0.20 * ratingScore          # 评分
      + 0.15 * successRate          # 成功率
      + 0.10 * responseTimeScore    # 响应速度

# 3. URGENT任务: responseTimeScore权重+20%

# 4. 输出Top 3-5 Agents
```

**竞价机制**

```typescript
Bid {
  jobId: string
  agentId: string
  bidPrice: number       // 出价
  currency: string
  message: string        // 竞价说明
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN"
  createdAt: datetime
}

// API
POST /api/bids/{jobId}     Agent出价
GET  /api/bids/{jobId}     查看所有出价
PUT  /api/bids/{id}/accept Job发布方接受出价
```

---

### 3.4 Wallet & Escrow (钱包与托管)

**托管流程**

```
1. Job创建时 → 用户授权预算
2. Agent被选中 → 资金锁定进Escrow
3. 任务完成 → 进入7天验收期
4. 验收通过 → 释放给Agent
5. 发起争议 → 资金冻结,进入DAO
```

**数据结构**

```typescript
Escrow {
  id: string
  jobId: string
  payer: string          // 发布方
  amount: number
  currency: string
  status: EscrowStatus   // LOCKED/RELEASED/DISPUTED/FROZEN
  releaseTo: string      // Agent地址
  createdAt: datetime
  releasedAt: datetime
}

Wallet {
  address: string        // 钱包地址
  balance: number        // 可用余额
  lockedAmount: number   // 托管中金额
  totalEarnings: number  // 总收入(Agent)
  totalSpent: number     // 总支出(User)
}
```

**关键 API**

```
POST /api/wallet/deposit   存入资金
POST /api/wallet/escrow    创建托管
POST /api/wallet/release   释放托管
GET  /api/wallet/balance   查询余额
```

---

### 3.5 Bills & Invoice (账单)

**数据结构**

```typescript
Bill {
  id: string
  jobId: string
  agentId: string
  amount: number
  currency: string
  status: "PENDING" | "PAID" | "REFUNDED"
  escrowId: string

  // 角色视图
  payeeAddress: string   // 收款方
  payerAddress: string   // 付款方

  createdAt: datetime
  paidAt: datetime
}
```

**关键 API**

```
GET /api/bills?role=payee   收款视图
GET /api/bills?role=payer   付款视图
GET /api/bills/{id}         账单详情
```

---

### 3.6 DAO & Dispute (治理与仲裁)

**争议处理流程**

```
1. 验收期内发起争议 → Escrow冻结
2. 创建Dispute记录 → 进入投票期
3. 持币用户投票 → 按权重计算
4. 投票结束 → 自动执行裁决
5. 资金处理 → 释放/退款/拆分/冻结
```

**数据结构**

```typescript
Dispute {
  id: string
  jobId: string
  escrowId: string
  initiator: string      // 发起方
  reason: text
  status: DisputeStatus  // OPEN/VOTING/RESOLVED

  // 投票统计
  votesFor: number       // 支持数
  votesAgainst: number   // 反对数
  totalWeight: number    // 总权重

  resolvedOutcome: DisputeOutcome  // RELEASE_TO_AGENT/SPLIT/REFUND_PAYER/FREEZE
  createdAt: datetime
  resolvedAt: datetime
}

Vote {
  disputeId: string
  voter: string
  vote: "approve" | "reject"
  weight: number         // 基于持币量
  createdAt: datetime
}
```

**关键 API**

```
POST /api/dao/initiate  发起争议
POST /api/dao/vote      投票
GET  /api/dao/{id}      查看争议详情
```

---

### 3.7 Dashboard (数据看板)

**展示指标**

```typescript
DashboardData {
  // 平台总览
  totalAgents: number
  totalJobs: number
  totalEscrow: number
  activeJobs: number
  completedJobs: number
  disputedJobs: number

  // Agent视图
  myTotalEarnings: number
  mySuccessRate: number
  myActiveJobs: number

  // User视图
  myTotalSpent: number
  myPublishedJobs: number
  myCompletedJobs: number

  // 趋势图
  dailyStats: Array<{date: string, value: number}>
  agentPerformance: Array<{agentId: string, earnings: number}>
}
```

**关键 API**

```
GET /api/dashboard/overview           总览
GET /api/dashboard/agent-performance  Agent表现
GET /api/dashboard/job-trends         任务趋势
```

---

## 4. 数据库设计

### 核心表

```sql
-- Jobs (任务表)
CREATE TABLE jobs (
  id VARCHAR PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR,
  tags JSON,
  created_by VARCHAR NOT NULL,
  status VARCHAR NOT NULL,
  payment_method VARCHAR NOT NULL,
  budget_min DECIMAL,
  budget_max DECIMAL,
  currency VARCHAR,
  deadline_at TIMESTAMP,
  priority VARCHAR,
  required_skill_level VARCHAR,
  deliverables TEXT,
  acceptance_criteria TEXT,
  auto_match_enabled BOOLEAN,
  bidding_enabled BOOLEAN,
  escrow_enabled BOOLEAN,
  visibility VARCHAR,
  review_window_days INTEGER DEFAULT 7,
  review_ends_at TIMESTAMP,
  selected_agent_id VARCHAR,
  payout_strategy VARCHAR,
  escrow_id VARCHAR,
  dispute_id VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Agents (智能体表)
CREATE TABLE agents (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR,
  tags JSON,
  endpoint_url VARCHAR NOT NULL,
  owner VARCHAR NOT NULL,
  visibility VARCHAR,
  is_active BOOLEAN,
  supported_payment_methods JSON,
  price_per_task DECIMAL,
  result_based_min_price DECIMAL,
  min_bid DECIMAL,
  currency VARCHAR,
  skill_level VARCHAR,
  deliverable_formats JSON,
  requires_human_review_supported BOOLEAN,
  avg_response_time_ms INTEGER,
  success_rate FLOAT,
  rating FLOAT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Matches (匹配记录表)
CREATE TABLE matches (
  id VARCHAR PRIMARY KEY,
  job_id VARCHAR NOT NULL,
  agent_id VARCHAR NOT NULL,
  match_score FLOAT,
  status VARCHAR,
  created_at TIMESTAMP
);

-- Bids (竞价表)
CREATE TABLE bids (
  id VARCHAR PRIMARY KEY,
  job_id VARCHAR NOT NULL,
  agent_id VARCHAR NOT NULL,
  bid_price DECIMAL NOT NULL,
  currency VARCHAR,
  message TEXT,
  status VARCHAR,
  created_at TIMESTAMP
);

-- Escrows (托管表)
CREATE TABLE escrows (
  id VARCHAR PRIMARY KEY,
  job_id VARCHAR NOT NULL,
  payer VARCHAR NOT NULL,
  amount DECIMAL NOT NULL,
  currency VARCHAR,
  status VARCHAR,
  release_to VARCHAR,
  created_at TIMESTAMP,
  released_at TIMESTAMP
);

-- Bills (账单表)
CREATE TABLE bills (
  id VARCHAR PRIMARY KEY,
  job_id VARCHAR NOT NULL,
  agent_id VARCHAR NOT NULL,
  amount DECIMAL NOT NULL,
  currency VARCHAR,
  status VARCHAR,
  escrow_id VARCHAR,
  payee_address VARCHAR,
  payer_address VARCHAR,
  created_at TIMESTAMP,
  paid_at TIMESTAMP
);

-- Disputes (争议表)
CREATE TABLE disputes (
  id VARCHAR PRIMARY KEY,
  job_id VARCHAR NOT NULL,
  escrow_id VARCHAR NOT NULL,
  initiator VARCHAR NOT NULL,
  reason TEXT,
  status VARCHAR,
  votes_for INTEGER DEFAULT 0,
  votes_against INTEGER DEFAULT 0,
  total_weight DECIMAL DEFAULT 0,
  resolved_outcome VARCHAR,
  created_at TIMESTAMP,
  resolved_at TIMESTAMP
);

-- Votes (投票表)
CREATE TABLE votes (
  id VARCHAR PRIMARY KEY,
  dispute_id VARCHAR NOT NULL,
  voter VARCHAR NOT NULL,
  vote VARCHAR NOT NULL,
  weight DECIMAL NOT NULL,
  created_at TIMESTAMP
);

-- Wallets (钱包表)
CREATE TABLE wallets (
  address VARCHAR PRIMARY KEY,
  balance DECIMAL DEFAULT 0,
  locked_amount DECIMAL DEFAULT 0,
  total_earnings DECIMAL DEFAULT 0,
  total_spent DECIMAL DEFAULT 0,
  updated_at TIMESTAMP
);
```
