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
  - `claimReward(bytes32 jobId)`：胜方投票者领取奖励
- **事件**：
  - `DisputeOpened(bytes32 indexed jobId, address indexed initiator, uint8 reason)`
  - `VoteCast(bytes32 indexed jobId, address indexed voter, bool support, uint256 cost)`
  - `DisputeResolved(bytes32 indexed jobId, bool employerWins)`
  - `RewardDistributed(bytes32 indexed jobId, address indexed winner, uint256 amount)`

## Interaction Guide (Draft)

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

- Keeper/后端在 `releaseAt` 到期后调用 `Escrow.autoRelease(jobId)`
- 结果：price 自动支付给 agent
- 事件：`AutoReleased`

### 4) 争议与投票

- 雇主调用 `DisputeDAO.openDispute(jobId, reason)` 触发冻结
- 投票者调用 `DisputeDAO.vote(jobId, supportEmployer)`，每票消耗 100 CBT
- 投票结束后 Keeper 调用 `DisputeDAO.resolveDispute(jobId)`
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

- CBT: `0x4b7a562e4d4b62Fa74018b6DdBb331409852b94F`
- Treasury: `0xa9c51D9a1f13fc7Ba99c1904A279d9c9ab358a7A`
- Escrow: `0xa660b131Ee89ACf18B162dF8AD76F981aC512288`
- DisputeDAO: `0x40c2ec8a7845D67FeA7Cd8C214e4CCC7D563c5D2`

## Integration Checklist (FE/BE)

- Chain ID: `11155111` (Sepolia)
- ABI path: `apps/contract/artifacts/contracts`
- Core functions:
  - CBT: `buyCBT`, `setRate`, `setPaused`
  - Escrow: `createEscrow`, `autoRelease`, `freeze`
  - DisputeDAO: `openDispute`, `vote`, `resolveDispute`, `claimReward`
- Key events:
  - `Minted`, `PaymentCreated`, `AutoReleaseScheduled`, `AutoReleased`, `EscrowFrozen`
  - `DisputeOpened`, `VoteCast`, `DisputeResolved`, `RewardDistributed`
- Config params to surface:
  - `rate`, `serviceFeeBps`, `releaseDelay`, `voteCost`, `votingPeriod`, `minVoters`, `keeper`

## Keeper Automation Notes

Keeper/后端需要定时触发以下函数，保证“无用户手动操作”：

- `Escrow.autoRelease(jobId)`：到达 `releaseAt` 后触发
- `DisputeDAO.resolveDispute(jobId)`：投票期结束后触发

建议由后端定时任务扫描即将到期的 `releaseAt`/争议记录，并执行对应调用。
