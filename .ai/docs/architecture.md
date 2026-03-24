# CyberAgent 项目架构总览

本文档的目标不是回顾历史设计过程，而是帮助新的会话或其他 AI agent 迅速建立正确心智模型。

## 1. 一句话总结

这个仓库实现的是一个 Web3 化的 AI Agent Marketplace。

用户可以：

- 发布 Agent
- 发布 Job
- 让系统为 Job 匹配候选 Agent
- 直接订阅 Agent，或在 Job 场景里选择 Agent 并创建托管
- 使用 CBT 完成支付
- 在争议时进入 DAO 仲裁
- 通过独立的 Mastra 服务把自然语言需求转成结构化 Job 草稿

当前 Monorepo 由五个运行面组成：

- `apps/front-end`: 面向用户的 Next.js 应用
- `apps/back-end`: 面向前端和内部流程的 NestJS API
- `apps/contract`: Solidity 合约
- `apps/contract/subgraph`: The Graph 索引层
- `apps/ai-agent`: Mastra AI 服务

## 2. 当前系统拓扑

```text
浏览器
  |
  v
apps/front-end (Next.js, 3005)
  | \
  |  \_ 钱包 / wagmi / RainbowKit -> Sepolia 合约
  |
  v
/api rewrite
  |
  v
apps/back-end (NestJS, 4000/api)
  |  \
  |   \_ keeper -> Subgraph + RPC -> Escrow / DisputeDAO
  |
  +-> PostgreSQL / Prisma
  +-> Redis (可选, Job 匹配队列)
  +-> Agent Proxy -> apps/ai-agent 或外部 Agent endpoint
  |
  v
apps/contract/subgraph (GraphQL 查询层)

apps/front-end 还会直接访问:
  -> apps/ai-agent (Mastra, 4111)，用于 Job 草稿生成
```

## 3. 工作区结构

### 3.1 应用层

- `apps/front-end`
  - Next.js 16 + React 19
  - 用户主界面
  - 通过 `/api/*` rewrite 转发到后端
  - 通过 wagmi 直接和链上合约交互

- `apps/back-end`
  - NestJS + Prisma + Apollo GraphQL
  - 目前前端主要走 REST Controller
  - 负责 Agent / Job / Dashboard / DAO / Wallet / Quote / Chain Status 等业务接口
  - 内置 keeper，可按配置自动轮询和执行 `releaseReady` / `resolveReady`

- `apps/contract`
  - Hardhat 工程
  - 当前核心合约：`CBT`, `Escrow`, `DisputeDAO`, `Treasury`, `AgentHiring`, `SignatureVerifier`
  - 有效配置目前主要在 Sepolia

- `apps/contract/subgraph`
  - The Graph 子图
  - 索引 Escrow、Dispute、CBT Transfer、AgentHiring Engagement 等链上事件

- `apps/ai-agent`
  - Mastra 服务
  - 当前真正和主业务打通的是 `draftWorkflow`
  - `weather*` 和 `xhsAgents` 属于实验或遗留 demo

- `apps/yt-ui-interface`
  - Storybook 展示应用

### 3.2 共享包层

- `packages/yt-ui`
  - 组件库
  - Button / Card / Table / Tabs / Toast 等基础 UI

- `packages/yt-hooks`
  - 目前较轻，核心是 `useImmer`

- `packages/yt-libs`
  - HTTP client
  - 合约地址与 ABI 导出
  - 地址格式化工具

## 4. 核心业务对象

当前项目同时维护链下业务模型和链上状态模型，两边不是完全一一镜像。

### 4.1 链下主模型（Prisma）

位于 `apps/back-end/prisma/schema.prisma`。

- `Agent`
  - 市场里展示的智能体
  - 关键字段：`name`、`endpointUrl`、`tags`、`owner`、`pricePerTask`、`skillLevel`

- `Job`
  - 用户发布的任务
  - 关键字段：预算、支付方式、优先级、匹配开关、托管开关、状态、`selectedAgentId`

- `Match`
  - Job 与 Agent 的候选匹配结果
  - 由后端匹配逻辑写入

- `Engagement`
  - 链下保存的订阅关系
  - 与链上 `AgentHiring` 的 Engagement 概念相关，但并不总是自动同步

- `Escrow`
  - 链下托管记录或业务侧映射

- `Dispute`
  - 争议记录
  - 数据库保留业务视角，真实仲裁状态在链上

- `Wallet`
  - 聚合视角的钱包统计
  - 不是链上原生余额

### 4.2 链上主模型（Subgraph）

位于 `apps/contract/subgraph/schema.graphql`。

- `Escrow`
- `Dispute`
- `Vote`
- `RewardClaim`
- `TokenTransfer`
- `Wallet`
- `Treasury`
- `Engagement`
- `Transaction`

链上查询主要由后端 `ChainStatusService` 封装，再提供给前端。

## 5. 最重要的业务流

### 5.1 发布 Agent

主链路：

1. 前端 `apps/front-end/src/app/create/page.tsx` 提交 Agent 表单。
2. 调用 `apps/front-end/src/apis/agent.ts#createAgent`。
3. 后端 `AgentsController` -> `AgentsService` 写入 Prisma `Agent`。
4. 市场页 `/market` 通过 `fetchAgentList` 拉取并展示。

说明：

- Agent 是链下业务对象，不会在发布时自动上链。
- `endpointUrl` 决定这个 Agent 未来被调用时请求发往哪里。

### 5.2 创建 Job 与 AI 草稿

主链路：

1. 前端 Job 表单位于 `apps/front-end/src/app/jobs/_components/JobFormPage.tsx`。
2. 用户输入自然语言需求。
3. 前端调用 `apps/front-end/src/apis/drafts.ts#createJobDraft`。
4. 请求直接打到 `apps/ai-agent` 的 `draftWorkflow`。
5. `apps/ai-agent/src/mastra/workflows/draft-workflow.ts` 使用 `draftAgent` 生成结构化草稿。
6. 前端把 `fields / missing / notes / confidence` 回填到表单。
7. 最终再调用后端 `POST /jobs` 创建真正的 Job。

要点：

- 当前主业务依赖的是 `draftWorkflow`，不是天气示例。
- 草稿服务只负责辅助创作，真实持久化仍由后端负责。

### 5.3 Job 匹配

主链路：

1. Job 创建后，如果 `autoMatchEnabled=true`，后端会触发匹配。
2. 入口在 `apps/back-end/src/jobs/jobs.controller.ts`。
3. 若配置 Redis，则进入 Bull 队列，由 `JobsMatchingProcessor` 异步处理。
4. 若未配置 Redis，则同步执行。
5. `MatchingService` 负责筛选和打分。
6. 结果保存到 `Match` 表，并更新 Job 状态。

当前实现重点：

- `hardFilter` 主要按标签和分类做粗筛
- `score` 主要依赖 `tagSimilarity + categorySimilarity`
- `buildMatchSelection` 会在候选集里再挑选 `SELECTED`

这意味着当前匹配更偏 MVP，而不是复杂推荐系统。

### 5.4 Job 场景下选择 Agent 并创建托管

主链路：

1. Job 详情页 `apps/front-end/src/app/jobs/[id]/page.tsx` 展示候选 Agent。
2. 用户点击订阅或托管动作。
3. 前端直接执行：
   - `approve(CBT -> Escrow)`
   - `Escrow.createEscrow(jobIdHash, payer, agent, amount)`
4. Escrow 交易成功后，再调用后端 `selectJobAgent(jobId, agentId)`。
5. 后端写入 `selectedAgentId` 并把 Job 状态更新为 `REVIEWING`。

这是当前项目里最容易被误判的地方：

- Job 详情页没有走 `AgentHiring.hire()`
- 它是直接调 `Escrow`
- 然后再让后端更新 Job 业务状态

### 5.5 直接订阅 Agent

主链路：

1. Agent 详情页 `apps/front-end/src/app/agent/[id]/page.tsx`。
2. 用户连接钱包，计算费用和服务费。
3. 前端按 nonce 串行执行两笔交易：
   - `CBT.approve(AgentHiring, total)`
   - `AgentHiring.hire(agentId, agentOwner, "", amount, DIRECT)`
4. `AgentHiring` 会：
   - 计算服务费
   - 把服务费转给 `Treasury`
   - 调用 `Escrow.createEscrow(...)`
   - 记录链上 Engagement
5. Subgraph 索引 Engagement 和 Escrow。
6. Dashboard / ChainStatus 再从子图读取这些记录。

这是当前链上闭环最完整的一条路径。

### 5.6 争议与 keeper 自动化

主链路：

1. 前端 `apps/front-end/src/app/dao/create/page.tsx`。
2. 从子图读取用户名下 `LOCKED` 且未冻结的 Escrow。
3. 用户选择 Escrow 并发起争议。
4. 前端调用 `DisputeDAO.openDispute(escrowId, reasonCode)`。
5. 链上 Escrow 被 `freeze`。
6. 成功后再调用后端 `initiateDispute(...)` 记录数据库视图。
7. keeper 轮询子图：
   - `Escrow releaseReady`
   - `DisputeDAO resolveReady`
8. 解决后，奖励与结果通过子图和后端接口回显到 Dashboard / DAO 页面。

keeper 相关文件：

- `apps/back-end/src/keeper/runner.ts`
- `apps/back-end/src/keeper/queries.ts`
- `apps/back-end/src/keeper/config.ts`

## 6. 模块地图

### 6.1 前端主页面

- `/market`
  - Agent 市场列表
  - 主要读后端 `/agents`

- `/create`
  - 发布 Agent

- `/jobs`
  - Job 列表和筛选

- `/jobs/post`
  - 创建 Job
  - 集成 AI 草稿生成

- `/jobs/[id]`
  - Job 详情
  - 展示匹配结果
  - 可发起托管
  - 可触发 Agent Proxy 演示执行

- `/dashboard`
  - 我的任务、我的 Agent、我的签约、我的争议

- `/dao`
  - 争议列表

- `/dao/create`
  - 发起争议

- `/dao/[id]`
  - 争议详情、投票、claim reward、keeper 配置显示

- `/wallet`
  - 钱包连接、购买 CBT、查看授权、查看 CBT transfer

### 6.2 前端演示 / 占位页面

- `/signature-demo`
  - EIP-712 / SIWE / allowance / gas / nonce 等展示能力

- `/docs`
  - 目前是营销式占位页，不是仓库文档入口

- `/`
  - 主要是品牌展示页，部分数据不是实时业务数据

### 6.3 后端核心模块

- `agents`
  - Agent CRUD
  - 市场检索

- `jobs`
  - Job CRUD
  - 自动匹配
  - 选择 Agent
  - 调用外部 Agent endpoint

- `matching`
  - Job 与 Agent 的筛选和打分

- `dashboard`
  - 聚合数据库与子图数据

- `dao`
  - 争议数据库视图
  - 与链上 dispute 状态联动

- `chain-status`
  - 子图查询封装层

- `engagements`
  - 链下 Engagement 记录接口

- `wallet`
  - 链下钱包统计接口

- `agent-proxy`
  - 把请求转发到 `AI_AGENT_SERVICE_URL`

- `auth`
  - SIWE nonce + 验签示例
  - 当前返回 mock token，不是完整生产认证

- `quote`
  - EIP-712 报价验签 demo
  - 当前仍是内存存储

- `keeper`
  - 自动巡检 Escrow / Dispute 是否到达可执行时点

### 6.4 合约职责

- `CBT.sol`
  - 平台代币
  - 支持 `buyCBT()`

- `Treasury.sol`
  - 记录服务费
  - 发放 dispute reward

- `Escrow.sol`
  - 托管资金
  - 支持自动释放、冻结、退款

- `DisputeDAO.sol`
  - 发起争议
  - 投票
  - keeper 到期结算
  - 胜方投票者 claim reward

- `AgentHiring.sol`
  - 直接订阅 Agent 的入口合约
  - 收费、创建 Engagement、调用 Escrow

- `SignatureVerifier.sol`
  - EIP-712 签名验证 demo 合约

## 7. 子图的真实角色

子图不是可有可无的补充，而是多个功能的真实读取来源：

- Dashboard 的签约记录
- DAO 页面争议数据
- Wallet 页面 CBT transfer 历史
- keeper 的 ready 集合查询
- Escrow / Engagement / Dispute 的列表页

如果 `SUBGRAPH_URL` 未配置，以下能力会明显受影响：

- 争议列表和详情
- 已签约 Agent 统计
- CBT transfer 历史
- keeper 自动执行

## 8. `apps/ai-agent` 的真实地位

这个应用不是“整个项目唯一的 AI 中心”，而是一个并行的 Mastra 服务，内部混合了三类内容：

- 业务相关
  - `draftAgent`
  - `draftWorkflow`
  - `draft-prompt.ts`
  - `draft-schema.ts`

- 遗留 demo
  - `weatherAgent`
  - `weatherWorkflow`
  - `weather-tool.ts`

- 实验内容
  - `xhs-agents.ts`

目前主业务与它的直接连接点只有两个：

- 前端 Job 表单的自然语言草稿生成
- 后端 `agent-proxy` 转发到它的 agent generate 接口

## 9. 本地开发

### 9.1 关键端口

- front-end: `3005`
- back-end: `4000`
- ai-agent: `4111`
- Storybook: `6006`

### 9.2 常用启动命令

在仓库根目录执行：

```bash
pnpm install
pnpm dev-test
```

也可以分开启动：

```bash
pnpm --filter @yt/front-end dev
pnpm --filter yt-back-end dev
pnpm --filter @yt-ai/ai-agent dev
pnpm --filter @yt/ui-interface dev
```

### 9.3 关键环境变量

前端：

- `NEXT_PUBLIC_API_BASE_URL`
- `API_PROXY_TARGET`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

后端：

- `DATABASE_URL`
- `DIRECT_URL`
- `REDIS_HOST`
- `REDIS_PORT`
- `SUBGRAPH_URL`
- `AI_AGENT_SERVICE_URL`
- keeper 相关变量

合约：

- `SEPOLIA_RPC_URL`
- `DEPLOYER_PRIVATE_KEY`
- `KEEPER_ADDRESS`

AI agent：

- `MODEL_NAME`
- `IFLOW_API_KEY`
- `OPENAI_API_KEY`

## 10. 新会话推荐阅读顺序

建议新 AI session 按下面顺序建立上下文：

1. `README.md`
2. `apps/back-end/prisma/schema.prisma`
3. `apps/front-end/src/app/jobs/[id]/page.tsx`
4. `apps/front-end/src/app/agent/[id]/page.tsx`
5. `apps/back-end/src/jobs/jobs.controller.ts`
6. `apps/back-end/src/matching/matching.service.ts`
7. `apps/back-end/src/dashboard/dashboard.service.ts`
8. `apps/back-end/src/chain-status/chain-status.service.ts`
9. `apps/contract/contracts/Escrow.sol`
10. `apps/contract/contracts/DisputeDAO.sol`
11. `apps/contract/contracts/AgentHiring.sol`
12. `apps/ai-agent/src/mastra/workflows/draft-workflow.ts`

## 11. 当前已知差异与风险点

这些内容不是 bug 列表，而是新的 AI agent 最容易踩坑的地方。

### 11.1 Job 托管流和直接订阅流并不统一

- Agent 详情页走 `AgentHiring`
- Job 详情页直接走 `Escrow`
- 这会导致 Engagement、服务费、状态来源并不完全一致

### 11.2 一些前端 hooks 仍然停留在旧合约接口上

例如 `useAgentHiring` 仍引用部分当前合约里已经不存在的接口语义。

### 11.3 `apps/ai-agent` 里业务代码和 demo 代码混在一起

- `draftWorkflow` 是当前有效主线
- `weather*` 和 `xhsAgents` 不应被误判为核心支付链路的一部分

### 11.4 Quote / Signature demo 尚未完全收敛

- 前端 `useAgentQuote`
- 后端 `quote.service.ts`
- 合约 `SignatureVerifier.sol`

三者更像演示能力，而不是主支付链路的一部分。

### 11.5 多链支持主要停留在前端选择层

- `packages/yt-libs/src/contracts/addresses.ts` 中主要只有 Sepolia 地址有效
- 其他链大多还是占位

### 11.6 `/docs` 页面不是仓库主文档

真正的项目文档应看：

- 本文件
- `.ai/docs/prd.md`
- `README.md`
