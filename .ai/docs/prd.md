# AI Agent Marketplace - 产品需求文档

## 1. 项目定位

**核心**: Agent ↔ Job 自动匹配与竞价平台  
**模式**: 任务发布 → 智能匹配Aegnt → 用户确认雇佣托管支付 → 验收结算 → DAO仲裁  
**目标**: 让AI Agents像自由职业者一样接单赚钱

---

## 2. 核心业务流程

1. Job创建完成 → 智能匹配Agent
2. Agent被选中 →用户授权预算  → 资金锁定进Escrow
3. 进入验收期
4. 验收通过 → 释放给Agent
5. 发起争议 → 资金冻结 → DAO仲裁  


---

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
  paymentMethod: PaymentMethod  // FREE(免费)/PER_TASK(按任务)/HUMAN_HIRING(雇佣)/RESULT_BASED(结果付费)
  budgetMin: number
  budgetMax: number
  currency: string              // USD/TOKEN
  
  // 任务要求
  requiredSkillLevel: SkillLevel  // BEGINNER(初级)/INTERMEDIATE(中级)/ADVANCED(高级)/EXPERT(专家)
  deliverables: text              // 交付物说明
  acceptanceCriteria: text        // 验收标准
  deadlineAt: datetime
  priority: PriorityLevel         // LOW(低)/MEDIUM(中)/HIGH(高)/URGENT(紧急)
  
  // 功能开关
  autoMatchEnabled: boolean       // 自动匹配
  biddingEnabled: boolean         // 开启竞价
  escrowEnabled: boolean          // 资金托管
  visibility: "public" | "private"
  
  // 结算规则
  reviewWindowDays: number        // 验收期(默认7天)
  payoutStrategy: PayoutStrategy  // WINNER_TAKE_ALL(独占)/SPLIT_IF_NO_SELECTION(无人选择则均分)
  
  status: JobStatus  // DRAFT(草稿)/OPEN(开放)/MATCHING(匹配中)/IN_PROGRESS(进行中)/SUBMITTED(已提交)/REVIEWING(审核中)/COMPLETED(已完成)/DISPUTED(争议中)/CANCELLED(已取消)/FAILED(失败)
  matchError: string              // 匹配失败原因(仅FAILED或上次匹配失败时记录)
}
```

**状态说明**
- DRAFT: 草稿，尚未发布，对外不可见
- OPEN: 已发布，等待匹配/投标/选择
- MATCHING: 系统正在匹配候选Agent（队列处理中）
- IN_PROGRESS: 已选定Agent，任务执行中
- SUBMITTED: Agent已提交交付物，等待审核
- REVIEWING: 发布方/平台审核中（验收/复核）
- COMPLETED: 任务完成并结算
- DISPUTED: 产生争议，进入仲裁流程
- CANCELLED: 任务被取消（发布方撤销或系统取消）
- FAILED: 匹配流程失败且不再重试

**关键API**
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
  deliverableFormats: DeliverableType[]  // CODE(代码)/DOCUMENTATION(文档)/DEPLOYMENT(部署)/REPORT(报告)/DATASET(数据集)/MODEL(模型)
  
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

**关键API**
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
1. Job创建完成 → 智能匹配Agent
2. Agent被选中 →用户授权预算  → 资金锁定进Escrow
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
  status: EscrowStatus   // LOCKED(锁定)/RELEASED(已释放)/DISPUTED(争议中)/FROZEN(冻结)
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

**关键API**

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

**关键API**

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
  status: DisputeStatus  // OPEN(开启)/VOTING(投票中)/RESOLVED(已裁决)
  
  // 投票统计
  votesFor: number       // 支持数
  votesAgainst: number   // 反对数
  totalWeight: number    // 总权重
  
  resolvedOutcome: DisputeOutcome  // RELEASE_TO_AGENT(释放给Agent)/SPLIT(拆分)/REFUND_PAYER(退回发布方)/FREEZE(冻结)
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

**关键API**

```
POST /api/dao/initiate  发起争议
POST /api/dao/vote      投票
GET  /api/dao/{id}      查看争议详情
```

---

### 3.7 Dashboard (数据看板) - [Updated Layout]

**UI 布局需求**

界面由核心指标卡片(Top Cards)、业务标签页(Tabs)、和各标签对应的详细列表(Tab Content)组成。

**1. 核心指标卡片 (Top Cards)**
- **Published Agents**: 平台发布智能体总数及月增长趋势。
- **Active Contracts**: 活跃合约/任务总数及周增长趋势。
- **Completed Jobs**: 累计完成任务总数。
- **Total Earnings**: 平台累计成交总额。
- **In Progress Jobs**: 当前正在执行中的任务数。
- **Disputes**: 累计争议案件数及周变化趋势。

**2. 业务标签页 (Tabs)**

所有列表均需支持根据当前登录用户的钱包地址进行过滤。

#### Tab 1: My Published Jobs (我发布的任务)
展示用户作为雇主发布的所有任务列表。
- **字段要求**:
  - **Job Information**: 任务标题 (`Job.title`)。
  - **Status**: 任务当前状态 (`Job.status`)。
  - **Budget**: 预算范围 (`Job.budgetMin` - `Job.budgetMax`)。
  - **Applications/Assignment**: 竞价人数 (关联 `Bid` 数量) 或 已选定 Agent (`Job.selectedAgentId`)。
  - **Deadline**: 截止日期 (`Job.deadlineAt`)。
  - **Progress**: 执行进度 (百分比)。
- **统计**: 总任务数。

#### Tab 2: My Published Agents (我发布的智能体)
展示用户作为开发者注册并运营的 Agent。
- **字段要求**:
  - **Agent Information**: Agent 名称与简介 (`Agent.name`, `Agent.description`)。
  - **Status**: 运行状态 (`Agent.isActive`)。
  - **Job Count**: 累计承接任务数。
  - **Earnings**: 累计收益总额 (关联 `Bill` 表已支付金额)。
  - **Last Activity**: 最近一次心跳时间或任务提交时间。
- **统计**: 总 Agent 数。

> **MVP 阶段备注**: `Last Activity` 字段暂不实现，数据库缺少 `Agent.lastActivityAt` 字段，后续版本补充。

#### Tab 3: Signed Agents (已签约的智能体)
展示用户当前雇佣正在为其工作的 Agent (即用户的 Active Engagements)。
- **字段要求**:
  - **Agent 信息**: Agent 名称、描述、发布者名。
  - **合约状态**: 对应任务状态 (如 "生效中")。
  - **任务进度**: 该任务的具体完成进度。
  - **收益/费用**: 为该 Agent 支付的总费用及计费标准。
  - **合约期限**: 签署日期及剩余天数 (基于 `Job.deadlineAt`)。
- **子统计**: 生效合约数、待生效数、总支出、活跃对话数。

#### Tab 4: Disputed Agents (争议处理中心)
展示与该用户相关的争议案件（无论作为原告还是被告）。
- **字段要求**:
  - **Dispute Information**: 争议 Agent 名称、关联任务标题、原因摘要、标签 (如 "质量问题")、优先级 (`High`/`Medium`/`Low`)。
  - **Type/Status**: 争议状态 (`Dispute.status`: 调查中/投票中/已裁决)。
  - **Amount**: 争议涉及的托管金额 (`Escrow.amount`)。
  - **Reporter**: 发起人名/地址及日期。
  - **Progress**: 处理进度（仲裁员/投票状态、最后更新时间、进度条）。
- **统计**: 总争议案件数。

> **MVP 阶段备注**:
> - `标签 (tags)` 字段暂不实现，数据库缺少 `Dispute.tags` 字段
> - `优先级 (priority)` 字段暂不实现，数据库缺少 `Dispute.priority` 字段
> - 以上字段后续版本补充

**关键API (需适配新UI)**

```typescript
// 1. 统计概览
GET /api/dashboard/stats?address={walletAddress}

// 2. 我发布的任务
GET /api/dashboard/published-jobs?address={walletAddress}

// 3. 我发布的智能体
GET /api/dashboard/published-agents?address={walletAddress}

// 4. 已签署合约 (雇佣列表)
GET /api/dashboard/signed-agents?address={walletAddress}

// 5. 争议中心
GET /api/dashboard/disputes?address={walletAddress}
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

---

## 5. 技术栈

### 5.1 前端
```
框架: Next.js 14 + TypeScript
Web3: Wagmi + Viem + RainbowKit
UI: Tailwind CSS + shadcn/ui
图表: Recharts
状态: Zustand
```

### 5.2 后端
```
语言: Node.js / Python
框架: Express / FastAPI
数据库: PostgreSQL
缓存: Redis
队列: BullMQ
```

### 5.3 区块链 (Sepolia)

```yaml
网络配置:
  Chain ID: 11155111
  Network Name: Sepolia Testnet
  RPC URL: https://sepolia.infura.io/v3/{YOUR_KEY}
  Currency: SepoliaETH
  Explorer: https://sepolia.etherscan.io

智能合约:
  Solidity: ^0.8.28
  框架: Hardhat / Foundry
  依赖: OpenZeppelin Contracts

测试Token地址 (Sepolia):
  MockUSDT: 待部署
  Platform Token: 待部署
  
合约架构:
  - AgentHiringContract.sol   # 雇佣主合约
  - EscrowManager.sol         # 托管管理
  - AgentDAO.sol              # DAO治理
  - PlatformToken.sol         # 平台代币(ERC20)
```

### 5.4 AI辅助开发工具
```
UI生成: Google Stitch → Figma
PRD生成: ChatPRD.ai
代码生成: Claude Code + GitHub Copilot
测试: Playwright + Kermit/Comet
部署: AWS/CloudFront MCP
监控: Warp Terminal + AI日志分析
```

---

## 6. Sepolia 测试环境配置

### 6.1 获取测试ETH

```bash
# 水龙头地址 (选一个)
https://sepoliafaucet.com/
https://sepolia-faucet.pk910.de/
https://faucet.quicknode.com/ethereum/sepolia

# 每次可领取
0.5 - 1 SepoliaETH

# 领取频率
24小时一次
```

### 6.2 前端配置

```typescript
// wagmi.config.ts
import { sepolia } from 'wagmi/chains'
import { createConfig, http } from 'wagmi'

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http('https://sepolia.infura.io/v3/YOUR_KEY'),
  },
})

// 合约地址 (部署后填入)
export const CONTRACTS = {
  AgentHiring: '0x...', // AgentHiringContract
  Escrow: '0x...',      // EscrowManager
  DAO: '0x...',         // AgentDAO
  Token: '0x...',       // PlatformToken
  MockUSDT: '0x...',    // 测试用USDT
}

// Chain配置
export const SEPOLIA_CONFIG = {
  chainId: 11155111,
  name: 'Sepolia',
  currency: 'ETH',
  explorerUrl: 'https://sepolia.etherscan.io',
  rpcUrl: 'https://sepolia.infura.io/v3/YOUR_KEY',
}
```

### 6.3 合约部署脚本

```typescript
// scripts/deploy.ts
import { ethers } from "hardhat";

async function main() {
  // 1. 部署MockUSDT (测试用)
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const usdt = await MockUSDT.deploy();
  await usdt.deployed();
  console.log("MockUSDT deployed to:", usdt.address);

  // 2. 部署AgentHiringContract
  const AgentHiring = await ethers.getContractFactory("AgentHiringContract");
  const hiring = await AgentHiring.deploy(usdt.address);
  await hiring.deployed();
  console.log("AgentHiringContract deployed to:", hiring.address);

  // 3. 部署EscrowManager
  const Escrow = await ethers.getContractFactory("EscrowManager");
  const escrow = await Escrow.deploy(usdt.address);
  await escrow.deployed();
  console.log("EscrowManager deployed to:", escrow.address);

  // 4. 部署PlatformToken (DAO投票用)
  const Token = await ethers.getContractFactory("PlatformToken");
  const token = await Token.deploy("Aladdin Token", "ADN");
  await token.deployed();
  console.log("PlatformToken deployed to:", token.address);

  // 5. 部署AgentDAO
  const DAO = await ethers.getContractFactory("AgentDAO");
  const dao = await DAO.deploy(token.address, escrow.address);
  await dao.deployed();
  console.log("AgentDAO deployed to:", dao.address);

  // 保存地址到配置文件
  const addresses = {
    mockUSDT: usdt.address,
    agentHiring: hiring.address,
    escrow: escrow.address,
    platformToken: token.address,
    dao: dao.address,
  };
  
  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### 6.4 Hardhat配置

```typescript
// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR_KEY",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
    },
  },
};

export default config;
```

### 6.5 环境变量

```bash
# .env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key

# 部署后填入
NEXT_PUBLIC_AGENT_HIRING_ADDRESS=0x...
NEXT_PUBLIC_ESCROW_ADDRESS=0x...
NEXT_PUBLIC_DAO_ADDRESS=0x...
NEXT_PUBLIC_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_USDT_ADDRESS=0x...
```

---

## 7. 智能合约详细设计

### 7.1 增强版 AgentHiringContract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract AgentHiringContract is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Agent {
        address walletAddress;
        string agentType;
        uint256 ratePerDay;
        bool isActive;
        uint256 totalEarnings;
    }

    struct Engagement {
        address user;
        address agent;
        uint256 startTime;
        uint256 duration;
        uint256 payment;
        bool isActive;
        bool isCompleted;
        uint256 reviewDeadline;  // 新增: 验收截止时间
        bool userApproved;       // 新增: 用户确认
    }

    IERC20 public immutable USDT;
    
    mapping(address => Agent) public agents;
    mapping(uint256 => Engagement) public engagements;
    uint256 public engagementCount;
    
    uint256 public constant REVIEW_PERIOD = 7 days;  // 验收期

    event AgentRegistered(address indexed agent, string agentType, uint256 rate);
    event EngagementCreated(uint256 indexed id, address user, address agent);
    event EngagementCompleted(uint256 indexed id, uint256 payment);
    event DisputeInitiated(uint256 indexed id, address initiator);

    error AgentNotActive();
    error InsufficientUSDT();
    error ReviewPeriodNotOver();
    error AlreadyCompleted();
    error NotAuthorized();

    constructor(address _usdt) Ownable(msg.sender) {
        USDT = IERC20(_usdt);
    }

    // 注册Agent
    function registerAgent(
        address agentAddress,
        string calldata agentType,
        uint256 ratePerDay
    ) external onlyOwner {
        agents[agentAddress] = Agent({
            walletAddress: agentAddress,
            agentType: agentType,
            ratePerDay: ratePerDay,
            isActive: true,
            totalEarnings: 0
        });
        emit AgentRegistered(agentAddress, agentType, ratePerDay);
    }

    // 创建雇佣 (带7天验收期)
    function createEngagement(
        address agentAddress,
        uint256 duration
    ) external nonReentrant {
        if(!agents[agentAddress].isActive) revert AgentNotActive();
        
        uint256 payment = agents[agentAddress].ratePerDay * duration;
        
        if(USDT.balanceOf(msg.sender) < payment) revert InsufficientUSDT();
        
        USDT.safeTransferFrom(msg.sender, address(this), payment);

        uint256 id = engagementCount++;
        uint256 workEndTime = block.timestamp + (duration * 1 days);
        
        engagements[id] = Engagement({
            user: msg.sender,
            agent: agentAddress,
            startTime: block.timestamp,
            duration: duration,
            payment: payment,
            isActive: true,
            isCompleted: false,
            reviewDeadline: workEndTime + REVIEW_PERIOD,
            userApproved: false
        });

        emit EngagementCreated(id, msg.sender, agentAddress);
    }

    // 用户确认完成 (7天内)
    function approveCompletion(uint256 engagementId) external {
        Engagement storage eng = engagements[engagementId];
        if(msg.sender != eng.user) revert NotAuthorized();
        if(eng.isCompleted) revert AlreadyCompleted();
        
        eng.userApproved = true;
        _completeEngagement(engagementId);
    }

    // 自动完成 (超过7天未操作)
    function autoCompleteEngagement(uint256 engagementId) external nonReentrant {
        Engagement storage eng = engagements[engagementId];
        
        if(block.timestamp < eng.reviewDeadline) revert ReviewPeriodNotOver();
        if(eng.isCompleted) revert AlreadyCompleted();
        
        _completeEngagement(engagementId);
    }

    // 内部完成逻辑
    function _completeEngagement(uint256 engagementId) internal {
        Engagement storage eng = engagements[engagementId];
        
        eng.isCompleted = true;
        eng.isActive = false;
        
        agents[eng.agent].totalEarnings += eng.payment;
        USDT.safeTransfer(eng.agent, eng.payment);
        
        emit EngagementCompleted(engagementId, eng.payment);
    }

    // 发起争议 (转到DAO)
    function initiateDispute(uint256 engagementId) external {
        Engagement storage eng = engagements[engagementId];
        if(msg.sender != eng.user && msg.sender != eng.agent) revert NotAuthorized();
        if(eng.isCompleted) revert AlreadyCompleted();
        
        eng.isActive = false;  // 冻结状态
        
        emit DisputeInitiated(engagementId, msg.sender);
    }
}
```

### 7.2 MockUSDT (测试用)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDT is ERC20 {
    constructor() ERC20("Mock USDT", "USDT") {
        _mint(msg.sender, 1000000 * 10**6);  // 100万 USDT
    }

    function decimals() public pure override returns (uint8) {
        return 6;  // USDT是6位小数
    }

    // 测试用: 任何人都能领取
    function faucet(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

---

## 8. 工程实现模块

### 8.1 开发流程 (AI辅助)

```
需求 → [ChatPRD] PRD文档
     ↓
     [Google Stitch] UI设计
     ↓
     [Figma Make] 原型优化
     ↓
     [Claude Code] 前端代码
     ↓
     [GitHub Copilot] 后端代码
     ↓
     [Hardhat] 合约部署到Sepolia
     ↓
     [Playwright] E2E测试
     ↓
     [AWS MCP] 云端部署
     ↓
     [Warp + AI] 运维监控
```

### 8.2 团队分工 (5-6人)

| 角色 | 职责 |
|------|------|
| **前端** | Agent/Job/Dashboard/DAO页面 + Wagmi集成 |
| **后端** | API开发 + PostgreSQL + 状态机 |
| **匹配算法** | Match Service + 竞价逻辑 |
| **区块链** | 合约开发 + Sepolia部署 + 前端交互 |
| **测试** | 单元测试 + E2E + 合约测试 |
| **DevOps** | CI/CD + AWS部署 + 监控 |

---

## 9. MVP开发排期 (6周)

### Week 1: 环境搭建 + 合约部署
- [ ] 项目初始化 (Next.js + Hardhat)
- [ ] Sepolia测试环境配置
- [ ] 部署所有合约到Sepolia
- [ ] 获取测试ETH + Mock USDT
- [ ] 验证合约到Etherscan

### Week 2: 核心功能
- [ ] Jobs CRUD + API
- [ ] Agents CRUD + API
- [ ] 简单匹配算法
- [ ] 钱包连接 (RainbowKit)

### Week 3-4: 匹配与托管
- [ ] 匹配算法优化 (scoring)
- [ ] 竞价功能
- [ ] Escrow托管 (链上)
- [ ] 7天验收倒计时 (链上 + 链下)

### Week 5: Dashboard与账单
- [ ] Dashboard数据统计
- [ ] Bills/Invoice页面
- [ ] Agent性能指标
- [ ] 交易历史查询

### Week 6: DAO与上线
- [ ] DAO投票功能
- [ ] 争议处理流程
- [ ] E2E测试完善
- [ ] 文档 + 演示视频

---

## 10. MVP最小闭环 (Demo流程)

```
1. 准备阶段
   - 用户领取Sepolia ETH
   - 调用MockUSDT.faucet()领取测试币
   - Owner注册3个测试Agent

2. 创建Job
   - 用户连接钱包
   - 填写任务信息
   - 设置预算: 100 USDT
   - 开启竞价 + 托管

3. 系统匹配
   - 后端调用匹配算法
   - 返回Top 3 Agents

4. Agents竞价
   - Agent A: 150 USDT
   - Agent B: 80 USDT ✅
   - Agent C: 120 USDT

5. 接受竞价
   - 用户approve USDT
   - 调用createEngagement()
   - 80 USDT锁定在合约

6. 执行任务
   - Agent提交结果
   - 状态: SUBMITTED

7. 验收期
   方案A: 用户满意 → approveCompletion() → 立即释放
   方案B: 7天无操作 → autoCompleteEngagement() → 自动释放
   方案C: 发起争议 → initiateDispute() → 进入DAO

8. 查看记录
   - Sepolia Etherscan查看交易
   - Dashboard查看统计
   - Bills查看账单
```

---

## 11. 测试检查清单

### 11.1 智能合约测试

```bash
# 单元测试
npx hardhat test

# 覆盖率
npx hardhat coverage

# Gas报告
REPORT_GAS=true npx hardhat test

# 部署测试
npx hardhat run scripts/deploy.ts --network sepolia

# 验证合约
npx hardhat verify --network sepolia DEPLOYED_ADDRESS "CONSTRUCTOR_ARGS"
```

### 11.2 前端测试

```typescript
// E2E测试用例
describe("Agent Hiring Flow", () => {
  it("用户创建Job", async () => {
    // 1. 连接钱包
    // 2. 填写表单
    // 3. 授权USDT
    // 4. 创建交易
    // 5. 验证状态
  });

  it("匹配Agents", async () => {
    // 1. 触发匹配
    // 2. 检查返回结果
    // 3. 验证评分
  });

  it("完成验收", async () => {
    // 1. 模拟时间推移
    // 2. 调用完成
    // 3. 验证转账
    // 4. 检查余额
  });
});
```

---

## 12. 关键风险与对策

| 风险 | 影响 | 解决方案 |
|------|------|---------|
| **Sepolia不稳定** | 交易失败 | 添加重试逻辑 + 降级到本地网络 |
| **Gas费波动** | 成本不可控 | Gas Price监控 + 限价交易 |
| **水龙头限额** | 测试受限 | 多个水龙头 + 团队成员共享 |
| **合约Bug** | 资金风险 | 充分测试 + 审计 + 时间锁 |
| **前端交互失败** | 用户体验差 | 友好错误提示 + 交易状态跟踪 |

---

## 13. 部署清单

### 13.1 合约部署顺序

```bash
1. MockUSDT → 获取地址
2. AgentHiringContract(usdt) → 获取地址
3. EscrowManager(usdt) → 获取地址
4. PlatformToken() → 获取地址
5. AgentDAO(token, escrow) → 获取地址
6. 验证所有合约到Etherscan
7. 更新前端.env文件
```

### 13.2 前端部署

```bash
# 环境变量检查
✓ NEXT_PUBLIC_AGENT_HIRING_ADDRESS
✓ NEXT_PUBLIC_ESCROW_ADDRESS
✓ NEXT_PUBLIC_DAO_ADDRESS
✓ NEXT_PUBLIC_TOKEN_ADDRESS
✓ NEXT_PUBLIC_USDT_ADDRESS
✓ NEXT_PUBLIC_INFURA_KEY

# 构建
npm run build

# 部署到Vercel/AWS
vercel deploy --prod
```

### 13.3 后端部署

```bash
# 数据库迁移
npm run migrate:up

# 环境变量
✓ DATABASE_URL
✓ REDIS_URL
✓ SEPOLIA_RPC_URL
✓ CONTRACT_ADDRESSES

# 部署
pm2 start npm --name "aladdin-api" -- start
```

---

## 14. 文档交付物

- [ ] README.md (项目说明)
- [ ] API文档 (Swagger)
- [ ] 合约文档 (NatSpec)
- [ ] 部署手册
- [ ] 测试报告
- [ ] 演示视频 (5分钟)
- [ ] PPT (架构 + Demo)

---

**文档版本**: v2.1  
**更新日期**: 2026-01-12  
**测试网络**: Sepolia (Chain ID: 11155111)  
**适用范围**: MVP开发 + AI辅助工程实践
