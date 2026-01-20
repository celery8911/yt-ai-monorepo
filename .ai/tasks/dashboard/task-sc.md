# Dashboard 模块 - 合约任务清单

> 任务清单位置：`.ai/tasks/dashboard/task-sc.md`
> 工作分支：`feat/celery`
> 关联 PRD：`.ai/docs/prd.md` 3.4 章节

---

## Phase 1: 事件与索引

### [DONE] DASH-SC-001 对齐 Dashboard 需要的合约事件与索引字段

- **验收标准**：
  - 明确 Dashboard 统计与列表所需的链上字段来源（任务、签约、争议、托管）
  - 在合约中补充或确认事件/状态变更字段满足索引需求
  - 在 Subgraph Schema 中定义对应实体字段与关系
  - 在 Subgraph 映射中处理事件并写入实体
  - 提供字段对齐说明（链上事件 → Subgraph 字段 → 后端字段）
- **依赖**：DASH-BE-002 ~ DASH-BE-006, DASH-FE-001
- **影响文件**：
  - `apps/contract/contracts/*.sol`
  - `apps/contract/subgraph/schema.graphql`
  - `apps/contract/subgraph/src/mappings/*.ts`
  - `apps/contract/README.md`
- **Notes**：字段命名以 Dashboard API 的响应结构为准，避免前后端字段歧义
- **完成日期**：2026-01-20

---

## Phase 2: Token Mint & Payment Escrow

### [DONE] DASH-SC-002 设计 CBT 平台币与兑换机制

- **验收标准**：
  - 选型并定义 CBT（ERC20）基础参数（name=CBT, symbol=CBT, decimals）
  - 定义 ETH -> CBT 兑换规则（1 ETH = 1,000,000 CBT）
  - 明确最小兑换额与是否可暂停兑换
  - 明确 mint 权限与资金流向（ETH 进入 Treasury/收款地址）
  - 定义事件：Minted、RateUpdated（或等效事件）
  - 输出接口说明与事件字段列表
- **接口/事件草案**：
  - `buyCBT()`：`msg.value` 按固定汇率铸造 CBT 给调用者
  - `setRate(uint256 newRate)`：仅管理员可设置汇率
  - `pause()` / `unpause()`：仅管理员
  - `event Minted(address indexed buyer, uint256 ethIn, uint256 cbtOut)`
  - `event RateUpdated(uint256 oldRate, uint256 newRate)`
- **依赖**：[可选] 价格/汇率来源方案确认
- **影响文件**：
  - `apps/contract/contracts/CBT.sol`
  - `apps/contract/contracts/Treasury.sol`
  - `apps/contract/README.md`
- **完成日期**：2026-01-20

### [DONE] DASH-SC-003 设计 Agent 付款与服务费托管流程

- **验收标准**：
  - 定义支付结构：price + 10% serviceFee
  - 明确付款入口函数与资金分账（price 进入 Escrow，serviceFee 进入 Treasury）
  - 定义 15 分钟延迟自动释放的机制与触发方式（Keeper/后端自动触发）
  - 定义事件：PaymentCreated、AutoReleaseScheduled、AutoReleased（或等效事件）
  - 输出接口说明与事件字段列表
- **接口/事件草案**：
  - `createEscrow(bytes32 jobId, address agent, uint256 price)`：从雇主转入 `price + serviceFee` CBT
  - `scheduleRelease(bytes32 jobId)`：记录 `releaseAt = block.timestamp + 15 minutes`
  - `autoRelease(bytes32 jobId)`：仅 Keeper/自动化地址调用，转出 `price` 给 agent
  - `freeze(bytes32 jobId)`：争议期间冻结自动释放
  - `event PaymentCreated(bytes32 indexed jobId, address payer, address agent, uint256 price, uint256 serviceFee)`
  - `event AutoReleaseScheduled(bytes32 indexed jobId, uint256 releaseAt)`
  - `event AutoReleased(bytes32 indexed jobId, address agent, uint256 amount)`
- **依赖**：[可选] Job/Agent 绑定方式确认
- **影响文件**：
  - `apps/contract/contracts/Escrow.sol`
  - `apps/contract/README.md`
- **完成日期**：2026-01-20

### [DONE] DASH-SC-004 实现 CBT + Escrow 合约与基础测试

- **验收标准**：
  - 实现 CBT 合约与兑换入口（ETH -> CBT mint）
  - 实现 Escrow 支付、服务费分账与延迟释放逻辑
  - 支持雇主发起争议并冻结自动释放
  - 覆盖核心流程测试（mint, pay, schedule, release, dispute）
  - 合约结构模块化（CBT/Treasury/Escrow 分离），便于后续扩展
  - 关键参数可配置（汇率、服务费比例、释放延迟、Keeper 地址）
- **依赖**：DASH-SC-002, DASH-SC-003
- **影响文件**：
  - `apps/contract/contracts/CBT.sol`
  - `apps/contract/contracts/Escrow.sol`
  - `apps/contract/contracts/Treasury.sol`
  - `apps/contract/test/*.ts`
- **完成日期**：2026-01-20

---

## Phase 3: Dispute DAO & Reward

### [DONE] DASH-SC-005 设计争议 DAO 与投票奖励

- **验收标准**：
  - 定义争议提交流程与参与条件（需持有/消耗 CBT）
  - 定义投票计费方式（每次投票消耗 100 CBT）
  - 定义胜方奖励分配：从 10% serviceFee 中按票数均分，仅胜方投票者获得
  - 定义投票限制：同一地址对同一争议仅允许投 1 票
  - 定义最小参与人数：至少 3 人，否则进入默认结果处理
  - 定义投票期：48 小时
  - 定义默认结果：人数不足或平票时，默认雇主胜（退款给雇主）
  - 定义事件：DisputeOpened、VoteCast、DisputeResolved、RewardDistributed
  - 输出接口说明与事件字段列表
- **接口/事件草案**：
  - `openDispute(bytes32 jobId, uint8 reason)`：仅雇主可发起，冻结 escrow
  - `vote(bytes32 jobId, bool support)`：消耗 100 CBT
  - `resolveDispute(bytes32 jobId)`：仅 Keeper/自动化地址调用，结算胜方与资金去向
  - `claimReward(bytes32 jobId)`：胜方投票者领取奖励（由服务费池分配）
  - `event DisputeOpened(bytes32 indexed jobId, address indexed initiator, uint8 reason)`
  - `event VoteCast(bytes32 indexed jobId, address indexed voter, bool support, uint256 cost)`
  - `event DisputeResolved(bytes32 indexed jobId, bool employerWins)`
  - `event RewardDistributed(bytes32 indexed jobId, address indexed winner, uint256 amount)`
- **依赖**：[可选] DAO 参与规则确认
- **影响文件**：
  - `apps/contract/contracts/DisputeDAO.sol`
  - `apps/contract/README.md`
- **完成日期**：2026-01-20

### [DONE] DASH-SC-006 实现 Dispute DAO 与集成测试

- **验收标准**：
  - 实现争议创建、投票、结算与奖励发放
  - 争议期间冻结 Escrow 自动释放
  - 覆盖核心流程测试（open, vote, resolve, reward）
  - 关键参数可配置（投票期、最小参与人数、每票成本、默认结果）
- **依赖**：DASH-SC-004, DASH-SC-005
- **影响文件**：
  - `apps/contract/contracts/DisputeDAO.sol`
  - `apps/contract/contracts/Escrow.sol`
  - `apps/contract/test/*.ts`
- **完成日期**：2026-01-20

---

## Phase 4: 文档与集成说明

### [DONE] DASH-SC-007 完善合约交互与部署文档

- **验收标准**：
  - 补充合约交互说明（流程、调用顺序、事件/ABI 对齐）
  - 补充 Hardhat 部署指南（环境变量、编译、部署命令、验证）
  - 补充 Keeper/后端自动化触发说明
  - 提供合约地址、链 ID 与 ABI 产出位置说明
  - 提供前后端联调清单（核心函数、事件、配置项）
- **依赖**：DASH-SC-004, DASH-SC-006
- **影响文件**：
  - `apps/contract/README.md`
- **Notes**：联调入口文档以 `apps/contract/README.md` 为准
- **完成日期**：2026-01-20

---

## 版本历史

- **2026-01-19**: 初始版本，新增 Dashboard 合约任务草案
