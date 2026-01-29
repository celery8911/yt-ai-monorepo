# Smart Contract Applications

> Contract Agent 的工作目录

## 目录用途

这个目录用于存放所有智能合约项目和 Subgraph。

## 工作范围

- Solidity 智能合约开发
- 合约测试和部署
- Subgraph 开发和维护
- ABI 管理和类型生成
- 链下索引服务

## 技术栈

### 智能合约
- Solidity
- Hardhat / Foundry
- TypeChain
- viem
- OpenZeppelin

### Subgraph
- The Graph Protocol
- AssemblyScript
- GraphQL Schema

## 依赖包

合约应用可以使用以下内部包：
- `@yt/libs` - 通用工具函数库（区块链相关）

## 与其他应用的关系

- 为 `apps/front-end/` 提供智能合约 ABI 和类型定义
- 为 `apps/back-end/` 提供链上事件和 Subgraph 查询接口
- 触发链上事件供后端监听

## 当前架构（重点）

```
用户 → AgentHiring（业务与关系）→ Escrow（资金托管）→ DisputeDAO（争议处理）
```

关键变化与原因（摘要）：
- **Agent 识别与雇佣关系**：合约需要记录 `agentId`、`agentOwner`、`purchaseType` 和可选 `jobId`，以支持按 Agent/Owner/用户统计和展示。
- **资金与业务分离**：资金托管与释放全部委托给 `Escrow`，业务元数据和服务费由 `AgentHiring` 负责，降低耦合并简化争议流程。
- **争议独立**：`DisputeDAO` 专职投票与结算，通过 `Escrow` 执行退款/释放，链上流程可被 Subgraph 稳定索引。
- **统一标识**：链上争议/托管使用 `escrowId`（由 `engagementId` 生成），避免业务 jobId 规则混乱。

### AgentHiring ↔ Escrow/Dispute 数据流示意图

```
1) hire()
User ──▶ AgentHiring
          ├─ store engagement metadata (agentId/owner/type/jobId)
          ├─ collect price + fee (fee -> Treasury)
          └─ createEscrow(escrowId, agentOwner, price) ──▶ Escrow

2) release (no dispute)
Keeper/Timer ──▶ Escrow.releaseReady/autoRelease(escrowId)
                 └─ release to agentOwner

3) dispute
Employer ──▶ DisputeDAO.openDispute(escrowId) ──▶ Escrow.freeze(escrowId)
Voters   ──▶ DisputeDAO.vote(escrowId)
Keeper   ──▶ DisputeDAO.resolveDispute/resolveReady(escrowId)
           └─ Escrow.refundToPayer or Escrow.releaseToAgent
```

### 全部合约架构与数据流（总览）

```
        ┌───────────────┐
        │     User      │
        └──────┬────────┘
               │ buyCBT / hire / dispute / vote / claim
               ▼
┌──────────────┴──────────────┐
│            CBT             │  ERC20
└──────┬───────────┬──────────┘
       │           │
       │           └───────────────▶ TokenTransfer (Subgraph)
       │ buyCBT: ETH
       ▼
┌─────────────────────────────┐
│          Treasury           │  收费与资金归集
└──────┬───────────┬──────────┘
       │           │
       │           └───────────────▶ 记录/索引 Minted/Transfer
       │
       ▼
┌─────────────────────────────┐
│         AgentHiring          │  业务关系/雇佣元数据
└──────┬───────────┬──────────┘
       │           │
       │           ├───────────────▶ Treasury (service fee in CBT)
       │           └───────────────▶ Engagement (Subgraph)
       │
       ▼
┌─────────────────────────────┐
│            Escrow            │  资金托管与释放
└──────┬───────────┬──────────┘
       │           │
       │           └───────────────▶ Escrow (Subgraph)
       │
       ▼
┌─────────────────────────────┐
│          DisputeDAO           │  争议与投票结算
└──────┬───────────┬──────────┘
       │           │
       │           └───────────────▶ Dispute/Vote (Subgraph)
       │
       ▼
┌─────────────────────────────┐
│           Keeper             │  定时触发释放/结算
└─────────────────────────────┘
```

## 负责人

Contract Agent - 详见 [`.ai/agents/contract-agent.md`](../../.ai/agents/contract-agent.md)

## 任务清单

智能合约相关任务请查看：[`.ai/tasks/task-sc.md`](../../.ai/tasks/task-sc.md)

## Dashboard Index Alignment

为满足 Dashboard 统计与列表展示，链上事件与 Subgraph 字段对齐如下：

| 链上事件 | Subgraph 实体字段 | 对应后端字段/用途 |
| --- | --- | --- |
| Minted(buyer, ethIn, cbtOut) | Wallet.balance, Treasury.ethCollected | walletBalance, 充值总额 |
| Transfer(from, to, value) | TokenTransfer.* | wallet/交易记录 |
| PaymentCreated(escrowId, payer, agent, price, serviceFee) | Escrow.amount, Escrow.serviceFee, Escrow.status | signedAgents/escrowAmount, contractStatus |
| AutoReleaseScheduled(escrowId, releaseAt) | Escrow.releaseAt | signedAt/结算时间参考 |
| AutoReleased(escrowId, amount) | Escrow.status=RELEASED, Escrow.releasedAt | contractStatus, releasedAt |
| EscrowFrozen(escrowId) | Escrow.status=FROZEN | disputes/contractStatus |
| DisputeOpened(escrowId, initiator, reason) | Dispute.initiator, Dispute.status | disputes/initiator, status |
| VoteCast(escrowId, voter, support, cost) | Dispute.votesFor/votesAgainst, Vote.* | disputes/voteProgress |
| DisputeResolved(escrowId, employerWins) | Dispute.resolvedOutcome, Dispute.resolvedAt | disputes/resolvedOutcome |

说明：
- Escrow/争议使用 `escrowId`（由 AgentHiring 生成），不直接使用业务 jobId。
- Job/Agent 的业务字段由后端数据库维护，链上仅索引与托管/争议相关信息。
- Subgraph Schema 位于 `apps/contract/subgraph/schema.graphql`，映射逻辑位于 `apps/contract/subgraph/src/mappings/`。

## Contract Interface (Current)

以下为当前接口与事件摘要，作为合约实现与前后端/索引对齐的依据。

### AgentHiring

- **参数**：
  - cbt, treasury, escrow, keeper
  - serviceFeeBps, releaseDelay
- **核心函数**：
  - `hire(...)`：创建 Engagement 并托管资金
  - `updateEngagementStatus(bytes32 escrowId)`：同步 Escrow 状态

### CBT (ERC20)

- **参数**：
  - name: CBT
  - symbol: CBT
  - decimals: 18
  - rate: 1 ETH = 1,000,000 CBT（可配置）
- **核心函数**：
  - `buyCBT()`：用户发送 ETH，按汇率 mint CBT
  - `setRate(uint256 newRate)`：管理员设置汇率
  - `setPaused(bool paused)`：管理员暂停/恢复兑换
- **事件**：
  - `Minted(address indexed buyer, uint256 ethIn, uint256 cbtOut)`
  - `RateUpdated(uint256 oldRate, uint256 newRate)`

### Escrow

- **参数**：
  - serviceFeeBps: 0（服务费由 AgentHiring 收取）
  - releaseDelay: 15 minutes（可配置）
  - keeper: 自动化触发地址（可配置）
- **核心函数**：
  - `createEscrow(bytes32 escrowId, address agent, uint256 price)`
  - `scheduleRelease(bytes32 escrowId)`
  - `autoRelease(bytes32 escrowId)`：仅 keeper
  - `releaseReady()`：仅 keeper，自动处理队列头部到期任务
  - `freeze(bytes32 escrowId)`：争议期间冻结
- **事件**：
  - `PaymentCreated(bytes32 indexed escrowId, address payer, address agent, uint256 price, uint256 serviceFee)`
  - `AutoReleaseScheduled(bytes32 indexed escrowId, uint256 releaseAt)`
  - `AutoReleased(bytes32 indexed escrowId, address agent, uint256 amount)`
  - `EscrowFrozen(bytes32 indexed escrowId)`

### DisputeDAO

- **参数**：
  - voteCost: 100 CBT（可配置）
  - votingPeriod: 48 hours（可配置）
  - minVoters: 3（可配置）
  - defaultOutcome: EmployerWins
  - keeper: 自动化触发地址（可配置）
- **核心函数**：
  - `openDispute(bytes32 escrowId, uint8 reason)`：仅雇主
  - `vote(bytes32 escrowId, bool support)`：消耗 100 CBT
  - `resolveDispute(bytes32 escrowId)`：仅 keeper
  - `resolveReady()`：仅 keeper，自动处理队列头部到期争议
  - `claimReward(bytes32 escrowId)`：胜方投票者领取奖励
- **事件**：
  - `DisputeOpened(bytes32 indexed escrowId, address indexed initiator, uint8 reason)`
  - `VoteCast(bytes32 indexed escrowId, address indexed voter, bool support, uint256 cost)`
  - `DisputeResolved(bytes32 indexed escrowId, bool employerWins)`
  - `RewardDistributed(bytes32 indexed escrowId, address indexed winner, uint256 amount)`
  - 奖励来源：投票者消耗的 `voteCost` 汇总，胜方平分

## Interaction Guide (Draft)

### 0) EscrowId 规范（必须）

- Escrow/争议相关合约参数使用 `bytes32` 类型的 `escrowId`。
- `escrowId` 由 AgentHiring 在链上生成，前端/后端应从 Subgraph 或事件中读取，不要自行 `ethers.id(...)`。
- 生成规则：`keccak256(abi.encodePacked("engagement", engagementId))`。

### 1) ETH -> CBT

- 调用 `CBT.buyCBT()` 并发送 ETH
- 结果：用户收到 CBT，ETH 自动转入 Treasury
- 事件：`Minted`

### 2) 雇主雇佣并托管

- 雇主调用 `AgentHiring.hire(...)`
- AgentHiring 收取 `price + fee`，fee 转 Treasury
- AgentHiring 授权并调用 `Escrow.createEscrow(escrowId, agentOwner, price)`
- 事件：`PaymentCreated`, `AutoReleaseScheduled`, Engagement 相关事件

### 3) 自动释放

- Keeper/后端在 `releaseAt` 到期后调用：
  - `Escrow.autoRelease(escrowId)`（指定任务）
  - 或 `Escrow.releaseReady()`（自动处理队列头部任务）
- 结果：price 自动支付给 agent
- 事件：`AutoReleased`

### 4) 争议与投票

- 雇主调用 `DisputeDAO.openDispute(escrowId, reason)` 触发冻结
- 投票者调用 `DisputeDAO.vote(escrowId, supportEmployer)`，每票消耗 100 CBT
- 投票结束后 Keeper 调用 `DisputeDAO.resolveDispute(escrowId)`
- 或调用 `DisputeDAO.resolveReady()` 自动处理队列头部争议
- 胜方投票者调用 `DisputeDAO.claimReward(escrowId)` 平分奖励（奖励池来自投票消耗的 CBT）

## Hardhat Deployment Guide

### 1) 安装依赖

在仓库根目录执行：

```bash
pnpm install
```

### 2) 配置环境变量

在 `apps/contract/.env` 中配置：

```bash
SEPOLIA_RPC_URL=...
DEPLOYER_PRIVATE_KEY=...
KEEPER_ADDRESS=... # 可选，默认部署者地址
```

### 3) 编译与部署

```bash
pnpm --filter @yt/contracts compile
pnpm --filter @yt/contracts deploy:sepolia
```

部署脚本位于 `apps/contract/scripts/deploy.ts`（对应 `pnpm --filter @yt/contracts deploy:sepolia`），默认参数如下：
- 兑换汇率：1 ETH = 1,000,000 CBT
- AgentHiring 服务费：10%
- Escrow 服务费：0
- 自动释放延迟：15 分钟
- 投票期：48 小时
- 最小参与人数：3
- 每票成本：100 CBT

### 4) ABI 与地址输出

- ABI 输出目录：`apps/contract/artifacts/contracts`
- 部署地址：脚本输出到控制台（可记录到 `.env` 或文档中）

## Sepolia Deployment (Latest)

- CBT: `0x502BccF9d143ecB89983EdFbf107ebDeD3B9a9fc`
- Treasury: `0x80E3E5bEeCee6A1EE694e7CE8D34660a9C65EA1d`
- Escrow: `0xd2a24326950A80272aCe018E2dcE25E22d5B5A7e`
- DisputeDAO: `0xe0132Ef13B63223345039E910b5080B1CaaA54DE`
- AgentHiring: `0xf54EEa283A05A5dD10944404D088c65bB60552dA`

## Integration Checklist (FE/BE)

- Chain ID: `11155111` (Sepolia)
- ABI path: `apps/contract/artifacts/contracts`
- Core functions:
  - AgentHiring: `hire`, `updateEngagementStatus`
  - CBT: `buyCBT`, `setRate`, `setPaused`
  - Escrow: `createEscrow`, `autoRelease`, `releaseReady`, `freeze`
  - DisputeDAO: `openDispute`, `vote`, `resolveDispute`, `resolveReady`, `claimReward`
- Key events:
  - `Minted`, `PaymentCreated`, `AutoReleaseScheduled`, `AutoReleased`, `EscrowFrozen`
  - `DisputeOpened`, `VoteCast`, `DisputeResolved`, `RewardDistributed`
- Config params to surface:
  - `rate`, `serviceFeeBps`, `releaseDelay`, `voteCost`, `votingPeriod`, `minVoters`, `keeper`

## 协作/联调任务清单（合约 & Subgraph 负责人）

- 文档补全：合约地址/ABI、JobId 规则、状态机/边界说明、Subgraph 查询模板、接口契约建议。
- EscrowId 规范：统一 `escrowId = keccak256(abi.encodePacked("engagement", engagementId))`，明确来源与稳定性要求。
- 状态机与边界：说明 LOCKED/RELEASED/REFUNDED/DISPUTED/FROZEN 等状态与触发事件。
- 查询模板：提供 agent/job 维度的最小字段查询与状态映射规则。
- 接口契约：给后端预留聚合接口字段协议（输入/输出）。
- 变更记录：合约/ABI/地址变更记录到文档。

影响文件（预计）：
- `apps/contract/README.md`
- `apps/contract/subgraph/schema.graphql`（若需补字段）
- `apps/back-end/README.md`（若补接口契约说明）
- `apps/back-end/src/keeper/queries.ts`（若补查询字段）

## EscrowId 规范（前后端必读）

- Escrow/争议合约统一使用 `bytes32 escrowId`。
- `escrowId` 由 AgentHiring 在链上生成并在事件/Subgraph 中提供。
- 生成规则：
  - Solidity：`keccak256(abi.encodePacked("engagement", engagementId))`
  - Subgraph/前端：从 Engagement/Escrow 记录直接读取 `escrowId`
- 规则要求：
  - 前端/后端不得自行 `ethers.id(jobIdString)` 推导 escrowId。
  - 业务 jobId 仍可作为业务标识，但不可用于 Escrow/Dispute 参数。

示例（Solidity 逻辑）：

```solidity
bytes32 escrowId = keccak256(abi.encodePacked("engagement", engagementId));
```

## 状态机与边界说明（Escrow & Dispute）

建议前后端按以下状态展示（链上事件/函数触发）：

| 状态 | 触发条件 | 说明 |
| --- | --- | --- |
| OPEN | 业务侧创建任务 | 未上链托管 |
| LOCKED | `PaymentCreated` | 已托管，待释放 |
| RELEASED | `AutoReleased` | 已支付给 agent |
| REFUNDED | `EscrowRefunded` | 已退回雇主 |
| DISPUTED | `DisputeOpened` | 进入争议 |
| FROZEN | `EscrowFrozen` | 托管冻结 |

边界说明：
- `LOCKED` 超时且无争议：由 keeper 调用 `releaseReady/autoRelease` 进入 `RELEASED`。
- `DISPUTED` 投票期结束：由 keeper 调用 `resolveReady/resolveDispute`，结果为退回或释放。
- `FROZEN` 表示当前禁止释放，必须先走争议流程或解除冻结逻辑。

## Subgraph 查询模板（最小字段）

1) 查询某个 escrow 是否存在（escrowId 维度）

```graphql
query JobEscrow($id: Bytes!) {
  escrow(id: $id) {
    id
    jobId
    payer
    agent
    status
    createdAt
    releaseAt
  }
}
```

2) 查询某个 agent 是否存在进行中的雇佣

```graphql
query AgentEscrows($agent: Bytes!) {
  escrows(where: { agent: $agent, status_in: [LOCKED, DISPUTED, FROZEN] }, first: 20, orderBy: createdAt, orderDirection: desc) {
    id
    jobId
    payer
    status
    createdAt
    releaseAt
  }
}
```

提示：
- `status` 为 Subgraph enum 字段时，前端请使用常量映射（避免硬编码数字）。
- `id/jobId` 实际为 escrowId（bytes32），应从 Subgraph 或事件读取。

## 聚合接口契约（后端建议实现）

后端建议提供统一查询接口（避免前端重复拼 Subgraph 查询）：

### GET /api/chain-status/escrow/by-job

请求参数：
- `escrowId`（bytes32 hex，从 Subgraph/事件读取）

响应：
```json
{
  "escrowId": "0x...",
  "payer": "0x...",
  "agent": "0x...",
  "status": "LOCKED",
  "createdAt": 1769101440,
  "releaseAt": 1769102340
}
```

### GET /api/chain-status/escrow/by-agent

请求参数：
- `agent`（address）
 - `activeOnly`（可选，默认 true）

响应：
```json
{
  "agent": "0x...",
  "activeEscrows": [
    { "escrowId": "0x...", "status": "LOCKED", "createdAt": 1769101440 }
  ]
}
```

## 变更记录（建议）

格式建议：
- 日期
- 合约名称/版本
- 变更内容
- 影响范围（ABI/地址/前后端）

## Keeper Automation Notes

Keeper/后端需要定时触发以下函数，保证“无用户手动操作”：

- `Escrow.autoRelease(escrowId)`：到达 `releaseAt` 后触发
- `Escrow.releaseReady()`：到达 `releaseAt` 后自动处理队列头部任务
- `DisputeDAO.resolveDispute(escrowId)`：投票期结束后触发
- `DisputeDAO.resolveReady()`：投票期结束后自动处理队列头部争议
- `AgentHiring.updateEngagementStatus(escrowId)`：同步 Engagement 状态（可选，但建议）

建议由后端定时任务扫描即将到期的 `releaseAt`/争议记录，并执行对应调用。

补充说明：
- `releaseReady/resolveReady` 会扫描队列并跳过未到期或被冻结的任务，优先处理最先满足条件的项。
