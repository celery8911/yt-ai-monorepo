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

## 负责人

Contract Agent - 详见 [`.ai/agents/contract-agent.md`](../../.ai/agents/contract-agent.md)

## 任务清单

智能合约相关任务请查看：[`.ai/tasks/task-sc.md`](../../.ai/tasks/task-sc.md)

## Dashboard Index Alignment

为满足 Dashboard 统计与列表展示，链上事件与 Subgraph 字段对齐如下：

| 链上事件 | Subgraph 实体字段 | 对应后端字段/用途 |
| --- | --- | --- |
| Minted(buyer, ethIn, cbtOut) | Wallet.balance, Treasury.ethCollected | walletBalance, 充值总额 |
| PaymentCreated(jobId, payer, agent, price, serviceFee) | Escrow.amount, Escrow.serviceFee, Escrow.status | signedAgents/escrowAmount, contractStatus |
| AutoReleaseScheduled(jobId, releaseAt) | Escrow.releaseAt | signedAt/结算时间参考 |
| AutoReleased(jobId, amount) | Escrow.status=RELEASED, Escrow.releasedAt | contractStatus, releasedAt |
| EscrowFrozen(jobId) | Escrow.status=FROZEN | disputes/contractStatus |
| DisputeOpened(jobId, initiator, reason) | Dispute.initiator, Dispute.status | disputes/initiator, status |
| VoteCast(jobId, voter, support, cost) | Dispute.votesFor/votesAgainst, Vote.* | disputes/voteProgress |
| DisputeResolved(jobId, employerWins) | Dispute.resolvedOutcome, Dispute.resolvedAt | disputes/resolvedOutcome |

说明：
- Job/Agent 的业务字段由后端数据库维护，链上仅索引与托管/争议相关信息。
- Subgraph Schema 位于 `apps/contract/subgraph/schema.graphql`，映射逻辑位于 `apps/contract/subgraph/src/mappings/`。

## Contract Interface Draft

以下为当前确定的接口与事件草案，作为合约实现与前后端/索引对齐的依据。

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
  - serviceFeeBps: 1000（10%）
  - releaseDelay: 15 minutes（可配置）
  - keeper: 自动化触发地址（可配置）
- **核心函数**：
  - `createEscrow(bytes32 jobId, address agent, uint256 price)`
  - `scheduleRelease(bytes32 jobId)`
  - `autoRelease(bytes32 jobId)`：仅 keeper
  - `releaseReady()`：仅 keeper，自动处理队列头部到期任务
  - `freeze(bytes32 jobId)`：争议期间冻结
- **事件**：
  - `PaymentCreated(bytes32 indexed jobId, address payer, address agent, uint256 price, uint256 serviceFee)`
  - `AutoReleaseScheduled(bytes32 indexed jobId, uint256 releaseAt)`
  - `AutoReleased(bytes32 indexed jobId, address agent, uint256 amount)`
  - `EscrowFrozen(bytes32 indexed jobId)`

### DisputeDAO

- **参数**：
  - voteCost: 100 CBT（可配置）
  - votingPeriod: 48 hours（可配置）
  - minVoters: 3（可配置）
  - defaultOutcome: EmployerWins
  - keeper: 自动化触发地址（可配置）
- **核心函数**：
  - `openDispute(bytes32 jobId, uint8 reason)`：仅雇主
  - `vote(bytes32 jobId, bool support)`：消耗 100 CBT
  - `resolveDispute(bytes32 jobId)`：仅 keeper
  - `resolveReady()`：仅 keeper，自动处理队列头部到期争议
  - `claimReward(bytes32 jobId)`：胜方投票者领取奖励
- **事件**：
  - `DisputeOpened(bytes32 indexed jobId, address indexed initiator, uint8 reason)`
  - `VoteCast(bytes32 indexed jobId, address indexed voter, bool support, uint256 cost)`
  - `DisputeResolved(bytes32 indexed jobId, bool employerWins)`
  - `RewardDistributed(bytes32 indexed jobId, address indexed winner, uint256 amount)`

## Interaction Guide (Draft)

### 0) Job ID 规范（必须）

- 合约参数使用 `bytes32` 类型的 `jobId`。
- 前后端需在调用合约前将业务 `jobId` 转为 `bytes32`。
- 推荐统一做法：`ethers.id(jobId)`（Keccak256 哈希）。
- 同一 jobId 必须使用同一转换规则，保证链上/链下一致。

### 1) ETH -> CBT

- 调用 `CBT.buyCBT()` 并发送 ETH
- 结果：用户收到 CBT，ETH 自动转入 Treasury
- 事件：`Minted`

### 2) 雇主支付并托管

- 雇主先对 `Escrow` 进行 CBT `approve`
- 调用 `Escrow.createEscrow(jobId, agent, price)`
- 结果：price 进入 Escrow，10% serviceFee 进入 Treasury
- 事件：`PaymentCreated`, `AutoReleaseScheduled`

### 3) 自动释放

- Keeper/后端在 `releaseAt` 到期后调用：
  - `Escrow.autoRelease(jobId)`（指定任务）
  - 或 `Escrow.releaseReady()`（自动处理队列头部任务）
- 结果：price 自动支付给 agent
- 事件：`AutoReleased`

### 4) 争议与投票

- 雇主调用 `DisputeDAO.openDispute(jobId, reason)` 触发冻结
- 投票者调用 `DisputeDAO.vote(jobId, supportEmployer)`，每票消耗 100 CBT
- 投票结束后 Keeper 调用 `DisputeDAO.resolveDispute(jobId)`
- 或调用 `DisputeDAO.resolveReady()` 自动处理队列头部争议
- 胜方投票者调用 `DisputeDAO.claimReward(jobId)` 平分奖励

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

部署脚本位于 `apps/contract/scripts/deploy.ts`，默认参数如下：
- 兑换汇率：1 ETH = 1,000,000 CBT
- 服务费：10%
- 自动释放延迟：15 分钟
- 投票期：48 小时
- 最小参与人数：3
- 每票成本：100 CBT

### 4) ABI 与地址输出

- ABI 输出目录：`apps/contract/artifacts/contracts`
- 部署地址：脚本输出到控制台（可记录到 `.env` 或文档中）

## Sepolia Deployment (Latest)

- CBT: `0x973391Eb58B2F60C4a73629729e715C216C84DA9`
- Treasury: `0x1E3A87049aAAc4cC1623294c1216ea25Fab99fe6`
- Escrow: `0x60D37F92572fD48eD215d87F76B8A3261342F82A`
- DisputeDAO: `0x13e6b7acaCA7f8f758CC4B68a7f16f71a0EB2289`

## Integration Checklist (FE/BE)

- Chain ID: `11155111` (Sepolia)
- ABI path: `apps/contract/artifacts/contracts`
- Core functions:
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
- JobId 规范：统一 `ethers.id(jobId)`，明确 jobId 的来源与稳定性要求。
- 状态机与边界：说明 LOCKED/RELEASED/REFUNDED/DISPUTED/FROZEN 等状态与触发事件。
- 查询模板：提供 agent/job 维度的最小字段查询与状态映射规则。
- 接口契约：给后端预留聚合接口字段协议（输入/输出）。
- 变更记录：合约/ABI/地址变更记录到文档。

影响文件（预计）：
- `apps/contract/README.md`
- `apps/contract/subgraph/schema.graphql`（若需补字段）
- `apps/back-end/README.md`（若补接口契约说明）
- `apps/back-end/src/keeper/queries.ts`（若补查询字段）

## JobId 规范（前后端必读）

- 合约层统一使用 `bytes32 jobId`。
- 业务侧使用字符串 jobId（建议来源于数据库主键或可追溯业务编号）。
- 唯一转换规则：`ethers.id(jobIdString)`（keccak256）。
- 规则要求：
  - jobIdString 必须稳定不可变（不允许后续更改）。
  - 前后端、后端任务、Subgraph 查询必须使用同一规则。
  - 若旧数据使用其它规则，需迁移或在接口层做兼容映射。

示例：

```ts
import { ethers } from "ethers";

const jobIdBytes32 = ethers.id("job-1");
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

1) 查询某个 job 是否被雇佣（jobId 维度）

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
- jobId 为 bytes32，查询时需传 bytes32 hex（`ethers.id(jobIdString)`）。

## 聚合接口契约（后端建议实现）

后端建议提供统一查询接口（避免前端重复拼 Subgraph 查询）：

### GET /api/chain-status/escrow/by-job

请求参数：
- `jobId`（string，业务层 jobId，后端转换为 bytes32）

响应：
```json
{
  "jobId": "job-1",
  "jobIdBytes32": "0x...",
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
    { "jobId": "job-1", "jobIdBytes32": "0x...", "status": "LOCKED", "createdAt": 1769101440 }
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

- `Escrow.autoRelease(jobId)`：到达 `releaseAt` 后触发
- `Escrow.releaseReady()`：到达 `releaseAt` 后自动处理队列头部任务
- `DisputeDAO.resolveDispute(jobId)`：投票期结束后触发
- `DisputeDAO.resolveReady()`：投票期结束后自动处理队列头部争议

建议由后端定时任务扫描即将到期的 `releaseAt`/争议记录，并执行对应调用。

补充说明：
- `releaseReady/resolveReady` 会扫描队列并跳过未到期或被冻结的任务，优先处理最先满足条件的项。
