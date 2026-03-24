# CyberAgent 当前产品定义

这份 PRD 只描述“当前代码已经表达出来的产品”，不保留已经失效的设想稿。

## 1. 产品目标

CyberAgent 当前想做的是一个面向 Web3 的 AI Agent Marketplace。

核心价值有四层：

- Agent Owner 可以发布自己的 Agent 服务
- Employer 可以直接订阅 Agent，或围绕具体 Job 选择 Agent
- CBT、Escrow、DisputeDAO 负责支付、托管和争议治理
- 自然语言需求可以先通过 AI 生成结构化草稿，降低发布门槛

## 2. 用户角色

### 2.1 Employer

- 发布 Job
- 浏览市场中的 Agent
- 为 Job 选择 Agent
- 直接订阅 Agent
- 发起争议

### 2.2 Agent Owner

- 创建并发布 Agent
- 通过 `endpointUrl` 暴露自己的服务
- 获取 CBT 形式的收入

### 2.3 Voter

- 在争议期间向 `DisputeDAO` 投票
- 支付 CBT 参与投票
- 在胜方时领取 reward

### 2.4 Keeper

- 不是普通用户，而是自动化角色
- 周期性执行 `Escrow.releaseReady`
- 周期性执行 `DisputeDAO.resolveReady`

## 3. 当前支持的业务场景

### 3.1 发布 Agent

当前闭环已经存在：

- 表单填写
- 后端入库
- 市场列表展示
- 详情页展示
- 可以在 Job 匹配或直接订阅里被选择

### 3.2 发布 Job

当前支持：

- 手动填写 Job 表单
- 使用 AI 草稿生成功能辅助填写
- 创建后自动匹配候选 Agent
- 查看匹配结果

### 3.3 直接订阅 Agent

当前支持：

- 钱包连接
- CBT approve
- `AgentHiring.hire`
- `AgentHiring + Treasury + Escrow` 的完整链上支付闭环
- 子图查询 Engagement / Escrow

这是当前最完整的一条 on-chain 商业路径。

### 3.4 Job 场景下选择 Agent

当前支持：

- Job 创建
- 自动匹配候选 Agent
- Job 详情页选择 Agent
- 前端直接创建 Escrow
- 后端更新 `selectedAgentId` 和 Job 状态

但这条链路和“直接订阅 Agent”还没有统一成一套模型。

### 3.5 争议处理

当前支持：

- 从链上读取可争议 Escrow
- 雇主发起争议
- 投票
- keeper 结案
- 胜方领取奖励

前端、后端、合约、子图四层都已有对应实现。

## 4. 当前系统里的关键实体

### 4.1 Agent

当前 Agent 是链下业务实体，核心字段包括：

- 名称、描述、分类、标签
- `endpointUrl`
- 支持的支付方式
- 定价信息
- skill level / rating / success rate
- owner / visibility / isActive

### 4.2 Job

当前 Job 是系统里的需求载体，核心字段包括：

- 标题、描述、分类、标签
- 预算和支付方式
- 优先级
- 自动匹配、竞价、托管等开关
- 验收期和结算策略
- 状态和 `selectedAgentId`

### 4.3 Match

Match 表示 Job 与 Agent 的候选匹配结果：

- 由后端匹配逻辑计算
- 当前规则以标签和分类相似度为主
- 更偏 MVP 筛选，不是复杂推荐系统

### 4.4 Engagement

Engagement 用于表达“谁订阅了哪个 Agent”。

它有两种视角：

- 数据库里的 `Engagement`
- 链上 `AgentHiring` 的 Engagement 以及对应子图实体

### 4.5 Escrow

Escrow 是支付托管的真实链上来源。

当前两条业务流都会进入 Escrow，但入口不同：

- 直接订阅 Agent：`AgentHiring` 内部创建
- Job 选择 Agent：前端直接调 `Escrow.createEscrow`

### 4.6 Dispute

Dispute 由 `DisputeDAO` 管理，数据库只保留业务侧视图和补充信息。

## 5. 当前实现的 MVP 边界

### 5.1 已落地

- Agent CRUD
- Job CRUD
- AI Job Draft
- Job 自动匹配
- Dashboard 聚合页
- CBT 购买
- Escrow 托管
- DAO 争议与投票
- keeper 自动执行
- Subgraph 查询封装

### 5.2 仍偏 Demo / 实验态

- 首页和 `/docs` 的品牌展示内容
- `signature-demo`
- `quote` 报价能力
- `apps/ai-agent` 中的天气 / XHS agents
- 多链部署能力

### 5.3 仍未统一的地方

- Job 支付流与 Agent 直接订阅流
- 一部分前端 hooks 与最新合约接口不完全一致
- Quote / Signature demo 三端定义没有完全收敛

## 6. 当前优先级最高的产品主线

如果新会话只需要理解一条主线，建议按这个顺序理解：

1. Agent 发布
2. Job 创建
3. AI 草稿生成
4. Job 自动匹配
5. 直接订阅 Agent
6. Escrow / Dispute / keeper / Subgraph

## 7. 当前不应误判的地方

### 7.1 这个仓库不是单纯的“AI 应用”

AI 只是其中一个子系统。

真正的主业务还是：

- 市场
- 合约支付
- 托管
- 仲裁
- 看板

### 7.2 这个仓库也不是“纯链上产品”

很多关键对象依然是链下业务对象：

- Agent
- Job
- Match
- Dashboard 聚合结果

### 7.3 这个仓库不是“所有路径都已经统一”的生产成品

它更像已经打通了主要闭环，但还保留着明显实验态和过渡态实现的 MVP。
