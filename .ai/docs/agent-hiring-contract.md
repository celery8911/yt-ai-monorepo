# AgentHiring 合约设计方案

> 解决 Agent 识别和雇佣关系管理问题
> 时间：2026-01-24
> 版本：v1.0

---

## 📋 目录

- [1. 问题分析](#1-问题分析)
- [2. 业务模型](#2-业务模型)
- [3. 方案设计](#3-方案设计)
- [4. 合约实现](#4-合约实现)
- [5. Subgraph 集成](#5-subgraph-集成)
- [6. 前端集成](#6-前端集成)
- [7. 后端集成](#7-后端集成)
- [8. 查询示例](#8-查询示例)
- [9. 方案对比](#9-方案对比)

---

## 1. 问题分析

### 1.1 当前架构的缺陷

#### **问题 1：无法识别 Agent 身份**

**当前 Escrow 合约：**
```solidity
// apps/contract/contracts/Escrow.sol
function createEscrow(bytes32 jobId, address agent, uint256 price) external {
    escrows[jobId] = EscrowInfo({
        payer: msg.sender,
        agent: agent,        // ❌ 只存储钱包地址
        price: price,
        // ...
    });
}
```

**问题场景：**
```
用户 Alice (0x123...) 发布了 3 个 Agent:
- Agent A (id: "cm5l8xo2y001", owner: 0x123...)
- Agent B (id: "cm5l8xo2y002", owner: 0x123...)
- Agent C (id: "cm5l8xo2y003", owner: 0x123...)

用户 Bob 购买了 Agent A:
escrow.createEscrow(jobId, 0x123..., 1000 CBT)

问题：
❌ 合约只知道钱包地址 0x123...
❌ 不知道购买的是哪个 Agent (A/B/C?)
❌ 无法统计每个 Agent 的收入
```

---

#### **问题 2：缺少雇佣关系记录**

**UI 需要的数据（参考设计稿）：**
```
Signed Agents (已签署的 Agents 合约)
┌─────────────────────────────────────────┐
│ 营销文案生成器                           │
│ 专业营销文案和广告语生成助手             │
│                                         │
│ 合约状态: 生效中                         │
│ 任务进度: 8 / 12 完成 (67%)              │
│ 收益: ¥1,850 (平均 ¥154/任务)           │
│ 签署于: 2024-03-10                      │
│ 到期于: 2024-09-10 (剩余 501 天)        │
└─────────────────────────────────────────┘
```

**当前架构缺失：**
- ❌ 没有记录"用户购买了哪个 Agent"
- ❌ 没有记录"购买时间"、"到期时间"
- ❌ 无法查询"某个 Agent 的所有客户"
- ❌ 无法统计"某个 Agent 的任务完成情况"

---

#### **问题 3：两种购买方式无法区分**

**业务场景：**

**方式 1：直接购买 Agent（Agent 市场）**
```
用户 → 浏览 Agent 市场 → 选择"营销文案生成器" → 立即订阅
❌ 没有 jobId
✅ 有 agentId
```

**方式 2：发布 Job 后匹配（Job 市场）**
```
用户 → 发布 Job → 平台匹配 Agent → 选择 Agent → 购买
✅ 有 jobId
✅ 有 agentId
```

**当前问题：**
- ❌ 合约无法区分这两种购买方式
- ❌ 交易历史中无法标注"直接购买"还是"Job 任务"
- ❌ 统计分析无法区分两种模式的转化率

---

### 1.2 核心需求

✅ **必须实现的功能：**
1. 存储 Agent ID（数据库 ID，如 "cm5l8xo2y"）
2. 存储 Agent Owner（创建者钱包地址）
3. 区分"直接购买"和"Job 匹配"两种模式
4. 记录完整的雇佣关系（用户 - Agent - Job）
5. 支持按 Agent ID 查询所有客户
6. 支持按用户查询所有购买的 Agent
7. 支持按 Agent Owner 查询所有收入

---

## 2. 业务模型

### 2.1 数据关系图

```
┌─────────────────┐
│   Database      │  ← 业务数据（链下）
│  (PostgreSQL)   │
│                 │
│  Agent          │
│  - id: CUID     │  "cm5l8xo2y"
│  - name         │  "营销文案生成器"
│  - owner        │  0x123...（钱包地址）
│  - price        │  1000 CBT
└────────┬────────┘
         │
         ↓ 用户购买时，传入 agentId 和 owner
         │
┌────────┴────────┐
│   Blockchain    │  ← 链上合约
│  (Sepolia)      │
│                 │
│  AgentHiring    │
│  - engagementId │  1, 2, 3...
│  - user         │  0x456...（雇主）
│  - agentId      │  "cm5l8xo2y" ⭐
│  - agentOwner   │  0x123... ⭐
│  - jobId        │  "cm5l8xo2y000008l3cbm9abcd" (可选)
│  - purchaseType │  "DIRECT" | "JOB_BASED" ⭐
│  - totalPaid    │  1000 CBT
│  - startTime    │  1706083200
│  - status       │  ACTIVE
└────────┬────────┘
         │ 索引
         ↓
┌─────────────────┐
│   Subgraph      │  ← 链上数据索引
│  (The Graph)    │
│                 │
│  Engagement     │
│  - id           │
│  - user         │
│  - agentId      │  ⭐ 可以查询
│  - agentOwner   │  ⭐ 可以区分不同 Agent
│  - purchaseType │  ⭐ 可以区分购买方式
└─────────────────┘
         │
         ↓ GraphQL Query
         │
┌─────────────────┐
│   Frontend      │  ← 合并展示
│  (Next.js)      │
│                 │
│  显示:          │
│  - Agent 名称   │  从数据库查（agentId）
│  - 购买时间     │  从 Subgraph 查
│  - 支付金额     │  从 Subgraph 查
│  - 合约状态     │  从 Subgraph 查
└─────────────────┘
```

---

### 2.2 核心实体

#### **Engagement（雇佣关系）**

```typescript
interface Engagement {
    id: number;                    // 自增 ID
    user: address;                 // 雇主地址
    agentId: string;               // Agent ID（数据库 ID）⭐
    agentOwner: address;           // Agent 创建者地址 ⭐
    jobId: string;                 // Job ID（可选）
    purchaseType: "DIRECT" | "JOB_BASED";  // 购买类型 ⭐
    totalPaid: bigint;             // 总支付金额
    startTime: bigint;             // 开始时间
    endTime: bigint;               // 结束时间（0 表示未结束）
    status: "ACTIVE" | "COMPLETED" | "DISPUTED" | "CANCELLED";
}
```

**关键字段：**
- `agentId` - 可以查询"哪些用户购买了这个 Agent"
- `agentOwner` - 可以区分同一 Owner 的不同 Agent
- `purchaseType` - 可以区分购买方式
- `jobId` - 可选，Job 匹配时有值

---

## 3. 方案设计

### 3.1 为什么不需要 AgentRegistry？

#### **方案 A：AgentRegistry + AgentHiring（❌ 不推荐）**

```solidity
// 用户创建 Agent 时需要调用合约
await agentRegistry.registerAgent(
    "cm5l8xo2y",      // agentId
    ownerAddress      // owner
);
// ❌ 需要支付 Gas
// ❌ 需要等待链上确认（5-15秒）
// ❌ 用户体验差

// 用户购买时
await agentHiring.hire(agentId, ...);
// 合约内部验证：
require(agentRegistry.isRegistered(agentId), "Agent not registered");
// ✅ 安全性高（链上验证）
```

**缺点：**
- ❌ 创建 Agent 需要支付 Gas 费
- ❌ 需要等待链上确认
- ❌ 用户体验差（两步操作：注册 + 发布）

---

#### **方案 B：仅 AgentHiring（✅ 推荐）**

```typescript
// 用户创建 Agent - 只调用后端 API
await fetch("/api/agents", {
    method: "POST",
    body: { name: "营销文案生成器", owner: userAddress, ... }
});
// ✅ 不需要 Gas
// ✅ 秒级响应
// ✅ 用户体验好

// 用户购买时
await agentHiring.hire(
    agentId,        // 从数据库获取
    agentOwner,     // 从数据库获取
    ...
);
// 🟡 agentOwner 不做链上验证，依赖后端数据
```

**优点：**
- ✅ 创建 Agent 无需 Gas 费
- ✅ 用户体验好
- ✅ 一次链上交易完成购买

**安全性缓解：**
- 前端验证：检查 `agent.owner` 是否匹配
- 后端签名：可选，提供签名验证

---

### 3.2 架构选择

**最终方案：仅部署 AgentHiring 合约**

```
Current:
┌──────────┐
│  Escrow  │  ← 只有地址，无 Agent ID
└──────────┘

Improved:
┌────────────────┐
│ AgentHiring    │  ← 存储 agentId + agentOwner
│  - Engagement  │  ← 记录雇佣关系
│  - 托管资金     │  ← 内置资金托管
└────────────────┘
```

**改进点：**
1. ✅ 存储 `agentId`（数据库 ID）
2. ✅ 存储 `agentOwner`（钱包地址）
3. ✅ 区分购买类型（`purchaseType`）
4. ✅ 记录雇佣关系（`Engagement`）
5. ✅ 内置资金托管（无需单独的 Escrow）

---

## 4. 合约实现

### 4.1 AgentHiring.sol

**完整合约代码：**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ITreasury {
    function recordServiceFee(bytes32 jobId, uint256 amount) external;
}

contract AgentHiring is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum EngagementStatus {
        ACTIVE,        // 进行中
        COMPLETED,     // 已完成
        DISPUTED,      // 争议中
        CANCELLED      // 已取消
    }

    enum PurchaseType {
        DIRECT,        // 直接购买 Agent
        JOB_BASED      // Job 匹配购买
    }

    struct Engagement {
        uint256 id;
        address user;                // 雇主地址
        string agentId;              // Agent ID（数据库 ID）
        address agentOwner;          // Agent 创建者地址
        string jobId;                // Job ID（可选）
        PurchaseType purchaseType;   // 购买类型
        uint256 totalPaid;           // 总支付金额
        uint256 startTime;           // 开始时间
        uint256 endTime;             // 结束时间（0 表示未结束）
        EngagementStatus status;     // 状态
    }

    // 合约配置
    IERC20 public immutable cbt;
    ITreasury public treasury;
    address public keeper;
    uint256 public serviceFeeBps = 200;      // 2% 手续费
    uint256 public releaseDelay = 15 minutes; // 验收期

    // 存储
    uint256 private nextEngagementId = 1;
    mapping(uint256 => Engagement) public engagements;

    // 索引（支持快速查询）
    mapping(address => uint256[]) public engagementsByUser;      // 用户的雇佣记录
    mapping(string => uint256[]) public engagementsByAgentId;    // Agent 的雇佣记录
    mapping(address => uint256[]) public engagementsByOwner;     // Owner 的收入记录

    // 事件
    event EngagementCreated(
        uint256 indexed engagementId,
        address indexed user,
        string agentId,
        address indexed agentOwner,
        string jobId,
        uint8 purchaseType,
        uint256 amount
    );

    event PaymentReleased(
        uint256 indexed engagementId,
        address indexed agentOwner,
        uint256 amount
    );

    event PaymentRefunded(
        uint256 indexed engagementId,
        address indexed user,
        uint256 amount
    );

    event ServiceFeeUpdated(uint256 oldBps, uint256 newBps);
    event ReleaseDelayUpdated(uint256 oldDelay, uint256 newDelay);
    event KeeperUpdated(address indexed oldKeeper, address indexed newKeeper);

    constructor(
        address cbt_,
        address treasury_,
        address keeper_
    ) Ownable(msg.sender) {
        require(cbt_ != address(0) && treasury_ != address(0), "Zero address");
        cbt = IERC20(cbt_);
        treasury = ITreasury(treasury_);
        keeper = keeper_;
    }

    /**
     * @notice 雇佣 Agent（同时托管资金）
     * @param agentId Agent ID（数据库 ID，如 "cm5l8xo2y"）
     * @param agentOwner Agent 创建者地址（从数据库查询）
     * @param jobId Job ID（可选，直接购买时传空字符串 ""）
     * @param price 支付金额（不含手续费）
     * @param purchaseType 购买类型（0=DIRECT, 1=JOB_BASED）
     * @return engagementId 雇佣关系 ID
     */
    function hire(
        string memory agentId,
        address agentOwner,
        string memory jobId,
        uint256 price,
        PurchaseType purchaseType
    ) external nonReentrant returns (uint256) {
        require(agentOwner != address(0), "Invalid agent owner");
        require(price > 0, "Invalid price");
        require(bytes(agentId).length > 0, "Empty agent ID");

        uint256 engagementId = nextEngagementId++;
        uint256 fee = (price * serviceFeeBps) / 10_000;
        uint256 total = price + fee;

        // 1. 转账 CBT
        cbt.safeTransferFrom(msg.sender, address(this), price);      // 托管
        cbt.safeTransferFrom(msg.sender, address(treasury), fee);    // 手续费

        // 2. 创建 Engagement
        engagements[engagementId] = Engagement({
            id: engagementId,
            user: msg.sender,
            agentId: agentId,
            agentOwner: agentOwner,
            jobId: jobId,
            purchaseType: purchaseType,
            totalPaid: price,
            startTime: block.timestamp,
            endTime: 0,
            status: EngagementStatus.ACTIVE
        });

        // 3. 记录索引
        engagementsByUser[msg.sender].push(engagementId);
        engagementsByAgentId[agentId].push(engagementId);
        engagementsByOwner[agentOwner].push(engagementId);

        // 4. 记录手续费到 Treasury
        bytes32 escrowId = keccak256(abi.encodePacked(engagementId));
        treasury.recordServiceFee(escrowId, fee);

        emit EngagementCreated(
            engagementId,
            msg.sender,
            agentId,
            agentOwner,
            jobId,
            uint8(purchaseType),
            price
        );

        return engagementId;
    }

    /**
     * @notice 用户手动确认完成（提前释放）
     */
    function approveCompletion(uint256 engagementId) external nonReentrant {
        Engagement storage engagement = engagements[engagementId];
        require(msg.sender == engagement.user, "Only payer can approve");
        require(engagement.status == EngagementStatus.ACTIVE, "Invalid status");

        _releasePayment(engagement);
    }

    /**
     * @notice 自动释放（超时后 keeper 触发）
     */
    function autoRelease(uint256 engagementId) external {
        require(msg.sender == keeper, "Only keeper");
        Engagement storage engagement = engagements[engagementId];
        require(engagement.status == EngagementStatus.ACTIVE, "Invalid status");
        require(
            block.timestamp >= engagement.startTime + releaseDelay,
            "Too early"
        );

        _releasePayment(engagement);
    }

    /**
     * @notice 退款给用户（争议后）
     */
    function refund(uint256 engagementId) external {
        require(msg.sender == owner(), "Only owner");
        Engagement storage engagement = engagements[engagementId];
        require(
            engagement.status == EngagementStatus.ACTIVE ||
            engagement.status == EngagementStatus.DISPUTED,
            "Invalid status"
        );

        engagement.status = EngagementStatus.CANCELLED;
        engagement.endTime = block.timestamp;

        cbt.safeTransfer(engagement.user, engagement.totalPaid);

        emit PaymentRefunded(engagementId, engagement.user, engagement.totalPaid);
    }

    /**
     * @dev 内部：释放资金给 Agent Owner
     */
    function _releasePayment(Engagement storage engagement) private {
        engagement.status = EngagementStatus.COMPLETED;
        engagement.endTime = block.timestamp;

        cbt.safeTransfer(engagement.agentOwner, engagement.totalPaid);

        emit PaymentReleased(engagement.id, engagement.agentOwner, engagement.totalPaid);
    }

    // ========== 查询方法 ==========

    /**
     * @notice 查询用户的所有雇佣记录
     */
    function getEngagementsByUser(address user) external view returns (uint256[] memory) {
        return engagementsByUser[user];
    }

    /**
     * @notice 查询某个 Agent 的所有雇佣记录
     */
    function getEngagementsByAgentId(string memory agentId) external view returns (uint256[] memory) {
        return engagementsByAgentId[agentId];
    }

    /**
     * @notice 查询某个 Owner 的所有收入记录
     */
    function getEngagementsByOwner(address owner) external view returns (uint256[] memory) {
        return engagementsByOwner[owner];
    }

    // ========== 管理方法 ==========

    function setServiceFeeBps(uint256 newBps) external onlyOwner {
        require(newBps <= 1000, "Fee too high"); // 最高 10%
        uint256 oldBps = serviceFeeBps;
        serviceFeeBps = newBps;
        emit ServiceFeeUpdated(oldBps, newBps);
    }

    function setReleaseDelay(uint256 newDelay) external onlyOwner {
        uint256 oldDelay = releaseDelay;
        releaseDelay = newDelay;
        emit ReleaseDelayUpdated(oldDelay, newDelay);
    }

    function setKeeper(address newKeeper) external onlyOwner {
        require(newKeeper != address(0), "Zero address");
        address oldKeeper = keeper;
        keeper = newKeeper;
        emit KeeperUpdated(oldKeeper, newKeeper);
    }
}
```

---

## 5. Subgraph 集成

### 5.1 Schema 定义

```graphql
# apps/contract/subgraph/schema.graphql

"""雇佣关系（购买记录）"""
type Engagement @entity {
  id: ID!                      # engagementId (uint256)
  user: Bytes!                 # 雇主地址
  agentId: String!             # Agent ID（数据库 ID）
  agentOwner: Bytes!           # Agent 创建者地址
  jobId: String                # Job ID（可选，直接购买时为空）
  purchaseType: String!        # "DIRECT" | "JOB_BASED"
  totalPaid: BigInt!           # 总支付金额
  startTime: BigInt!           # 开始时间
  endTime: BigInt              # 结束时间
  status: String!              # "ACTIVE" | "COMPLETED" | "DISPUTED" | "CANCELLED"

  # 关联
  transactions: [Transaction!]! @derivedFrom(field: "engagement")
}

"""交易历史"""
type Transaction @entity(immutable: true) {
  id: ID!                      # tx hash + log index
  type: String!                # "ENGAGEMENT_CREATED" | "PAYMENT_RELEASED" | "PAYMENT_REFUNDED"
  engagement: Engagement!      # 关联的雇佣关系
  from: Bytes!                 # 发起方
  to: Bytes!                   # 接收方
  amount: BigInt!              # 金额
  timestamp: BigInt!
  blockNumber: BigInt!
  transactionHash: Bytes!
}

"""钱包统计"""
type Wallet @entity {
  id: ID!                      # 钱包地址
  totalEarnings: BigInt!       # 累计收入（Agent Owner）
  totalSpent: BigInt!          # 累计支出（用户）
  activeEngagements: Int!      # 活跃合约数
  completedEngagements: Int!   # 已完成合约数
  updatedAt: BigInt!
}
```

---

### 5.2 Mapping 实现

```typescript
// apps/contract/subgraph/src/mappings/agent-hiring.ts

import {
  EngagementCreated,
  PaymentReleased,
  PaymentRefunded
} from "../generated/AgentHiring/AgentHiring";
import { Engagement, Transaction, Wallet } from "../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";

export function handleEngagementCreated(event: EngagementCreated): void {
  // 1. 创建 Engagement 实体
  const engagement = new Engagement(event.params.engagementId.toString());
  engagement.user = event.params.user;
  engagement.agentId = event.params.agentId;
  engagement.agentOwner = event.params.agentOwner;
  engagement.jobId = event.params.jobId;
  engagement.purchaseType = event.params.purchaseType == 0 ? "DIRECT" : "JOB_BASED";
  engagement.totalPaid = event.params.amount;
  engagement.startTime = event.block.timestamp;
  engagement.endTime = BigInt.zero();
  engagement.status = "ACTIVE";
  engagement.save();

  // 2. 创建 Transaction 记录
  const txId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  const tx = new Transaction(txId);
  tx.type = "ENGAGEMENT_CREATED";
  tx.engagement = engagement.id;
  tx.from = event.params.user;
  tx.to = event.params.agentOwner;
  tx.amount = event.params.amount;
  tx.timestamp = event.block.timestamp;
  tx.blockNumber = event.block.number;
  tx.transactionHash = event.transaction.hash;
  tx.save();

  // 3. 更新用户 Wallet
  updateWallet(event.params.user, event.params.amount, false, true);

  // 4. 更新 Agent Owner Wallet
  updateWallet(event.params.agentOwner, BigInt.zero(), true, false);
}

export function handlePaymentReleased(event: PaymentReleased): void {
  // 1. 更新 Engagement 状态
  const engagement = Engagement.load(event.params.engagementId.toString());
  if (engagement) {
    engagement.status = "COMPLETED";
    engagement.endTime = event.block.timestamp;
    engagement.save();
  }

  // 2. 创建 Transaction 记录
  const txId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  const tx = new Transaction(txId);
  tx.type = "PAYMENT_RELEASED";
  tx.engagement = event.params.engagementId.toString();
  tx.from = event.address;  // 合约地址
  tx.to = event.params.agentOwner;
  tx.amount = event.params.amount;
  tx.timestamp = event.block.timestamp;
  tx.blockNumber = event.block.number;
  tx.transactionHash = event.transaction.hash;
  tx.save();

  // 3. 更新 Agent Owner 收入
  updateWallet(event.params.agentOwner, event.params.amount, true, false);
}

function updateWallet(
  address: Bytes,
  amount: BigInt,
  isEarning: boolean,
  isActive: boolean
): void {
  let wallet = Wallet.load(address.toHex());
  if (!wallet) {
    wallet = new Wallet(address.toHex());
    wallet.totalEarnings = BigInt.zero();
    wallet.totalSpent = BigInt.zero();
    wallet.activeEngagements = 0;
    wallet.completedEngagements = 0;
  }

  if (isEarning) {
    wallet.totalEarnings = wallet.totalEarnings.plus(amount);
    wallet.completedEngagements += 1;
  } else {
    wallet.totalSpent = wallet.totalSpent.plus(amount);
  }

  if (isActive) {
    wallet.activeEngagements += 1;
  }

  wallet.updatedAt = event.block.timestamp;
  wallet.save();
}
```

---

## 6. 前端集成

### 6.1 场景 1：直接购买 Agent

**代码位置：** [apps/front-end/src/app/agent/[id]/page.tsx](../../apps/front-end/src/app/agent/[id]/page.tsx)

```typescript
// 改进后的代码
const handleSubscribe = async () => {
    if (!agent) return;

    try {
        // 1. 连接钱包
        if (!isConnected) await connect();
        if (chainId !== CHAIN_IDS.sepolia) {
            await switchChainAsync({ chainId: CHAIN_IDS.sepolia });
        }

        // 2. 获取 Agent 信息（从后端 API）
        const agentData = await fetchAgentDetail(agent.id);
        if (!agentData.owner) {
            throw new Error("Agent owner address not found");
        }

        // 3. 计算金额
        const amount = parsePriceToCbt(agent.price);
        const feeBps = BigInt(serviceFeeBps ?? 200);
        const fee = (amount * feeBps) / 10_000n;
        const total = amount + fee;

        // 4. 授权 CBT
        await approve({
            address: CONTRACTS.sepolia.CBT,
            abi: CBT_ABI.abi,
            functionName: "approve",
            args: [CONTRACTS.sepolia.AgentHiring, total]
        });

        // 等待授权确认
        await waitForApprove();

        // 5. 雇佣 Agent
        const tx = await agentHiring.hire({
            address: CONTRACTS.sepolia.AgentHiring,
            abi: AgentHiring_ABI.abi,
            functionName: "hire",
            args: [
                agentData.id,        // agentId: "cm5l8xo2y"
                agentData.owner,     // agentOwner: "0x123..."
                "",                  // jobId: 空（直接购买）
                amount,              // price
                0                    // PurchaseType.DIRECT
            ]
        });

        await tx.wait();
        setHasSubscribed(true);
    } catch (error) {
        setSubscribeError(error.message);
    }
};
```

---

### 6.2 场景 2：Job 匹配购买

```typescript
// apps/front-end/src/app/job/[id]/page.tsx

const handleSelectAgent = async (agentId: string) => {
    // 1. 调用后端 API 选择 Agent
    const response = await fetch(`/api/jobs/${jobId}/select-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId })
    });

    const { agent, job } = await response.json();
    // agent = { id: "cm5l8xo2y", owner: "0x123...", price: 1000 }
    // job = { id: "cm5l8xo2y000008l3cbm9abcd", title: "...", budgetMax: 1000 }

    // 2. 授权 CBT
    const amount = BigInt(job.budgetMax) * 10n ** 18n;
    const fee = (amount * serviceFeeBps) / 10_000n;
    await approve({ args: [CONTRACTS.sepolia.AgentHiring, amount + fee] });
    await waitForApprove();

    // 3. 雇佣 Agent
    await agentHiring.hire({
        args: [
            agent.id,        // agentId
            agent.owner,     // agentOwner
            job.id,          // jobId（有值）
            amount,
            1                // PurchaseType.JOB_BASED
        ]
    });
};
```

---

## 7. 后端集成

### 7.1 查询服务

```typescript
// apps/back-end/src/chain-status/chain-status.service.ts

@Injectable()
export class ChainStatusService {
  private readonly subgraphUrl = process.env.SUBGRAPH_URL || "";

  /**
   * 查询用户购买的所有 Agent（含名称）
   */
  async getUserEngagements(userAddress: string) {
    // 1. 从 Subgraph 查链上数据
    const data = await querySubgraph(this.subgraphUrl, {
      query: `
        query($user: Bytes!) {
          engagements(
            where: { user: $user }
            orderBy: startTime
            orderDirection: desc
          ) {
            id
            agentId
            agentOwner
            jobId
            purchaseType
            totalPaid
            startTime
            endTime
            status
          }
        }
      `,
      variables: { user: userAddress.toLowerCase() }
    });

    // 2. 提取 agentIds，从数据库批量查询
    const agentIds = data.engagements.map(e => e.agentId);
    const agents = await this.prisma.agent.findMany({
      where: { id: { in: agentIds } },
      select: { id: true, name: true, description: true, category: true }
    });

    // 3. 提取 jobIds（过滤掉空字符串）
    const jobIds = data.engagements
      .filter(e => e.jobId && e.jobId !== "")
      .map(e => e.jobId);
    const jobs = await this.prisma.job.findMany({
      where: { id: { in: jobIds } },
      select: { id: true, title: true }
    });

    // 4. 合并数据
    return data.engagements.map(e => {
      const agent = agents.find(a => a.id === e.agentId);
      const job = jobs.find(j => j.id === e.jobId);

      return {
        ...e,
        agentName: agent?.name || "Unknown Agent",
        agentCategory: agent?.category,
        displayTitle: e.purchaseType === "DIRECT"
          ? `直接购买 ${agent?.name || "Agent"}`
          : job?.title || "Unknown Job",
        isDirectPurchase: e.purchaseType === "DIRECT"
      };
    });
  }

  /**
   * 查询某个 Agent 的所有客户
   */
  async getAgentEngagements(agentId: string) {
    const data = await querySubgraph(this.subgraphUrl, {
      query: `
        query($agentId: String!) {
          engagements(
            where: { agentId: $agentId }
            orderBy: startTime
            orderDirection: desc
          ) {
            id
            user
            totalPaid
            startTime
            status
            purchaseType
          }
        }
      `,
      variables: { agentId }
    });

    // 统计信息
    const active = data.engagements.filter(e => e.status === "ACTIVE");
    const completed = data.engagements.filter(e => e.status === "COMPLETED");
    const totalEarnings = completed.reduce(
      (sum, e) => sum + BigInt(e.totalPaid),
      0n
    );

    return {
      agentId,
      engagements: data.engagements,
      statistics: {
        activeCount: active.length,
        completedCount: completed.length,
        totalEarnings: totalEarnings.toString(),
        averageEarnings: completed.length > 0
          ? (totalEarnings / BigInt(completed.length)).toString()
          : "0"
      }
    };
  }

  /**
   * 查询交易历史（含 Agent 和 Job 名称）
   */
  async getTransactions(address: string, limit = 20) {
    const data = await querySubgraph(this.subgraphUrl, {
      query: `
        query($address: Bytes!, $limit: Int!) {
          transactions(
            where: {
              or: [
                { from: $address },
                { to: $address }
              ]
            }
            orderBy: timestamp
            orderDirection: desc
            first: $limit
          ) {
            id
            type
            amount
            timestamp
            transactionHash
            engagement {
              agentId
              agentOwner
              jobId
              purchaseType
            }
          }
        }
      `,
      variables: { address: address.toLowerCase(), limit }
    });

    // 批量查询 Agent 和 Job 名称
    const agentIds = data.transactions.map(tx => tx.engagement.agentId);
    const jobIds = data.transactions
      .filter(tx => tx.engagement.jobId)
      .map(tx => tx.engagement.jobId);

    const agents = await this.prisma.agent.findMany({
      where: { id: { in: agentIds } },
      select: { id: true, name: true }
    });

    const jobs = await this.prisma.job.findMany({
      where: { id: { in: jobIds } },
      select: { id: true, title: true }
    });

    // 合并展示
    return data.transactions.map(tx => {
      const agent = agents.find(a => a.id === tx.engagement.agentId);
      const job = jobs.find(j => j.id === tx.engagement.jobId);

      return {
        ...tx,
        displayTitle: tx.engagement.purchaseType === "DIRECT"
          ? `直接购买 ${agent?.name || "Agent"}`
          : job?.title || "Unknown Job",
        agentName: agent?.name
      };
    });
  }
}
```

---

### 7.2 API 端点

```typescript
// apps/back-end/src/chain-status/chain-status.controller.ts

@Controller("chain-status")
export class ChainStatusController {
  constructor(private readonly service: ChainStatusService) {}

  @Get("engagements/user/:address")
  async getUserEngagements(@Param("address") address: string) {
    return this.service.getUserEngagements(address);
  }

  @Get("engagements/agent/:agentId")
  async getAgentEngagements(@Param("agentId") agentId: string) {
    return this.service.getAgentEngagements(agentId);
  }

  @Get("transactions/:address")
  async getTransactions(
    @Param("address") address: string,
    @Query("limit") limit?: string
  ) {
    const limitNum = limit ? parseInt(limit) : 20;
    return this.service.getTransactions(address, limitNum);
  }
}
```

---

## 8. 查询示例

### 8.1 前端查询：我购买的 Agent

```typescript
// 查询用户购买的所有 Agent
const { engagements } = await fetch(`/api/chain-status/engagements/user/${userAddress}`)
  .then(res => res.json());

// 渲染 "Signed Agents" 界面
engagements.map(engagement => (
  <AgentCard key={engagement.id}>
    <h3>{engagement.agentName}</h3>
    <p>{engagement.displayTitle}</p>
    <div>
      <span>合约状态: {engagement.status === "ACTIVE" ? "生效中" : "已完成"}</span>
      <span>收益: {formatCBT(engagement.totalPaid)}</span>
      <span>签署于: {formatDate(engagement.startTime)}</span>
    </div>
  </AgentCard>
));
```

---

### 8.2 前端查询：某个 Agent 的收入统计

```typescript
// Agent 详情页 - 显示统计信息
const { statistics } = await fetch(`/api/chain-status/engagements/agent/${agentId}`)
  .then(res => res.json());

// 渲染
<div>
  <p>活跃合约: {statistics.activeCount}</p>
  <p>已完成: {statistics.completedCount}</p>
  <p>总收入: {formatCBT(statistics.totalEarnings)}</p>
  <p>平均收入: {formatCBT(statistics.averageEarnings)}</p>
</div>
```

---

### 8.3 前端查询：交易历史

```typescript
// Wallet Dashboard - Recent Transactions
const transactions = await fetch(`/api/chain-status/transactions/${userAddress}`)
  .then(res => res.json());

transactions.map(tx => (
  <TransactionItem key={tx.id}>
    <Icon type={tx.type} />
    <div>
      <h4>{tx.displayTitle}</h4>  {/* "直接购买 营销文案生成器" */}
      <time>{formatDate(tx.timestamp)}</time>
    </div>
    <Amount positive={tx.to === userAddress}>
      {tx.to === userAddress ? "+" : "-"}{formatCBT(tx.amount)}
    </Amount>
    <Status>{getStatusLabel(tx.type)}</Status>
  </TransactionItem>
));
```

---

## 9. 方案对比

### 9.1 与当前 Escrow 方案对比

| 功能 | 当前 Escrow | AgentHiring（推荐） |
|------|------------|-------------------|
| **存储 Agent ID** | ❌ 无 | ✅ agentId 字段 |
| **区分同一 Owner 的多个 Agent** | ❌ 不能 | ✅ 可以 |
| **记录雇佣关系** | ❌ 无 | ✅ Engagement 实体 |
| **区分购买方式** | ❌ 不能 | ✅ purchaseType 字段 |
| **查询用户购买的 Agent** | ❌ 不能 | ✅ getEngagementsByUser() |
| **查询 Agent 的所有客户** | ❌ 不能 | ✅ getEngagementsByAgentId() |
| **统计 Agent 收入** | ❌ 不能 | ✅ 可以按 agentId 统计 |
| **展示交易历史** | 🟡 部分 | ✅ 完整（含 Agent/Job 名称） |
| **UI 完整展示** | ❌ 不能 | ✅ 可以 |

---

### 9.2 与 AgentRegistry 方案对比

| 维度 | AgentRegistry + AgentHiring | 仅 AgentHiring（推荐） |
|------|---------------------------|---------------------|
| **创建 Agent** | ❌ 需调用合约（支付 Gas） | ✅ 后端 API（免费） |
| **用户体验** | ❌ 差（两步操作） | ✅ 好（一步操作） |
| **安全性** | ✅ 高（链上验证） | 🟡 中（依赖后端） |
| **Gas 成本** | ❌ 高 | ✅ 低 |
| **开发复杂度** | 🟡 中等 | ✅ 简单 |
| **数据一致性** | ✅ 强（链上为准） | 🟡 依赖后端 |

**结论：** 对于 MVP 和用户体验优先的场景，推荐使用"仅 AgentHiring"方案。

---

### 9.3 安全性缓解措施

#### **风险：** 合约不验证 `agentOwner` 是否真的拥有该 Agent

#### **缓解方案 1：前端验证（推荐）**

```typescript
// 前端调用前验证
const agent = await fetchAgentDetail(agentId);

// 验证 owner 地址
if (agent.owner.toLowerCase() !== expectedOwner.toLowerCase()) {
    throw new Error("Agent owner mismatch");
}

await agentHiring.hire(agent.id, agent.owner, ...);
```

---

#### **缓解方案 2：后端签名验证（可选）**

```solidity
// 合约添加签名验证
function hire(
    string memory agentId,
    address agentOwner,
    bytes memory signature  // 后端签名
) external {
    // 验证签名
    bytes32 hash = keccak256(abi.encodePacked(agentId, agentOwner));
    require(verifySignature(hash, signature), "Invalid signature");

    // ...
}
```

```typescript
// 后端生成签名
const hash = ethers.solidityPackedKeccak256(
    ["string", "address"],
    [agentId, agentOwner]
);
const signature = await backendSigner.signMessage(ethers.getBytes(hash));

// 前端调用
await agentHiring.hire(agentId, agentOwner, signature, ...);
```

---

## 总结

### 核心改进

✅ **存储 Agent ID** - 可以查询具体哪个 Agent
✅ **存储 Agent Owner** - 可以区分同一 Owner 的多个 Agent
✅ **记录雇佣关系** - 完整的购买记录
✅ **区分购买方式** - 直接购买 vs Job 匹配
✅ **支持复杂查询** - 按用户、Agent、Owner 查询
✅ **完整的 UI 展示** - Signed Agents、交易历史等

### 实施建议

**阶段 1：合约开发**（3-5 天）
1. 实现 AgentHiring.sol
2. 编写测试用例
3. 部署到 Sepolia

**阶段 2：Subgraph 更新**（2-3 天）
4. 更新 Schema
5. 编写 Mapping
6. 部署索引服务

**阶段 3：后端集成**（2-3 天）
7. 实现查询服务
8. 添加 API 端点

**阶段 4：前端适配**（2-3 天）
9. 更新购买流程
10. 实现交易历史展示
11. 实现 Signed Agents 界面

**总计：9-14 天**

---

**文档版本：v1.0**
**最后更新：2026-01-24**
