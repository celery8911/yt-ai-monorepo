# CyberAgent Monorepo

CyberAgent 是一个 Web3 AI Agent Marketplace Monorepo。它把前端市场、后端业务 API、链上合约、The Graph 子图和一个独立的 Mastra AI 服务放在同一个工作区里。

当前最重要的产品闭环是：

- 发布 Agent
- 发布 Job
- 用 AI 生成 Job 草稿
- 自动匹配候选 Agent
- 直接订阅 Agent 或围绕 Job 选择 Agent
- 用 CBT 完成托管支付
- 进入 DAO 争议与 keeper 自动结算

## 项目结构

```text
.
├── apps/
│   ├── front-end/        # Next.js 用户前台，端口 3005
│   ├── back-end/         # NestJS API + keeper，端口 4000
│   ├── contract/         # Hardhat 合约工程 + subgraph
│   ├── ai-agent/         # Mastra AI 服务，端口 4111
│   └── yt-ui-interface/  # Storybook
├── packages/
│   ├── yt-ui/            # UI 组件库
│   ├── yt-hooks/         # Hooks 工具库
│   └── yt-libs/          # HTTP / 合约地址 / ABI / 工具函数
└── .ai/docs/
    ├── architecture.md   # 当前项目总览，建议先读
    └── prd.md            # 当前产品定义
```

## 运行面说明

- `apps/front-end`
  - 用户界面
  - 通过 `/api/*` rewrite 转发到后端
  - 通过 wagmi 直接和 Sepolia 合约交互

- `apps/back-end`
  - Agent / Job / Dashboard / DAO / Wallet / Quote / Chain Status
  - 可选 Redis 队列用于 Job 匹配
  - 内置 keeper，用于自动执行 `releaseReady` 和 `resolveReady`

- `apps/contract`
  - 主要合约：`CBT`, `Escrow`, `DisputeDAO`, `Treasury`, `AgentHiring`, `SignatureVerifier`

- `apps/contract/subgraph`
  - 索引 Escrow、Dispute、CBT transfer、AgentHiring engagement 等链上事件

- `apps/ai-agent`
  - 当前主业务真正依赖的是 `draftWorkflow`
  - `weather*` 和 `xhsAgents` 仍在仓库里，但属于 demo / 实验代码

## 快速开始

### 1. 准备 pnpm

```bash
corepack enable
corepack prepare pnpm@10.28.0 --activate
pnpm -v
```

`pnpm -v` 必须输出 `10.28.0`。

### 2. 安装依赖

必须在仓库根目录执行：

```bash
pnpm install
```

### 3. 配置环境变量

至少需要关注：

- `apps/back-end/.env.example`
- `apps/contract/.env.example`
- `apps/ai-agent/.env.example`
- `apps/front-end/.env.local`

### 4. 启动主服务

一条命令同时启动前端、后端、AI 服务：

```bash
pnpm dev-test
```

也可以分开启动：

```bash
pnpm --filter @yt/front-end dev
pnpm --filter yt-back-end dev
pnpm --filter @yt-ai/ai-agent dev
pnpm --filter @yt/ui-interface dev
```

## 常用命令

```bash
pnpm build
pnpm format
pnpm check
pnpm --filter @yt/contracts test
pnpm --filter @yt/contracts deploy:sepolia
```

## 关键文档

- [`.ai/docs/architecture.md`](./.ai/docs/architecture.md)
- [`.ai/docs/prd.md`](./.ai/docs/prd.md)

如果你是新的 AI 会话，建议先读：

1. `README.md`
2. `.ai/docs/architecture.md`
3. `apps/back-end/prisma/schema.prisma`
4. `apps/front-end/src/app/jobs/[id]/page.tsx`
5. `apps/contract/contracts/Escrow.sol`
6. `apps/contract/contracts/DisputeDAO.sol`

## 依赖操作红线

- 只能在仓库根目录执行 `pnpm install/add/remove/update`
- 给子包加依赖请用 `pnpm add <dep> -F <pkg>`
- 不要在子包里用 `npm` 或 `yarn`
- 不要手改 `node_modules`

示例：

```bash
pnpm add axios -F @yt/libs
pnpm add @types/node -D -F yt-back-end
pnpm add dotenv -w
```

## 当前需要特别注意的事实

- 直接订阅 Agent 走 `AgentHiring`
- Job 详情页里的订阅/托管目前直接走 `Escrow`
- 子图是 Dashboard、DAO、Wallet transfer 和 keeper 的关键依赖
- 多链支持在 UI 上已预留，但真实有效地址目前主要只有 Sepolia
