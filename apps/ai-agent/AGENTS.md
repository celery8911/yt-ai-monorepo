# `apps/ai-agent` 说明

这不是一个单纯的“天气助手”项目。

当前 `apps/ai-agent` 是 CyberAgent Monorepo 里的独立 Mastra 服务，运行在 `4111` 端口。它同时承载了业务相关工作流、历史 demo 和实验 agent。

## 当前真正和主业务打通的部分

### 1. `draftWorkflow`

主入口：

- `src/mastra/workflows/draft-workflow.ts`
- `src/mastra/agents/draft-agent.ts`
- `src/mastra/prompts/draft-prompt.ts`
- `src/mastra/schemas/draft-schema.ts`

用途：

- 把自然语言需求转成结构化 Job / Agent 草稿 JSON
- 前端 `apps/front-end/src/apis/drafts.ts` 直接依赖这条链路

如果你修改了工作流 API 路径、输入结构或输出结构，必须同步检查：

- `apps/front-end/src/apis/drafts.ts`

## 当前仍保留但不是主业务核心的部分

### 1. 天气相关 agent / workflow

- `weather-agent.ts`
- `weather-workflow.ts`
- `weather-tool.ts`
- `weather-workflow-tool.ts`
- `weather-scorer.ts`

它们更像 Mastra 示例代码，目前不是市场、Job、支付、争议闭环的一部分。

### 2. `xhs-agents.ts`

这是批量注册的一组小红书文案实验 agent，也不是当前主业务主线。

## `index.ts` 当前的真实状态

`src/mastra/index.ts` 现在会同时注册：

- `draftWorkflow`
- `weatherWorkflow`
- `draftAgent`
- `weatherAgent`
- `xhsAgents`

这意味着：

- 业务上真正依赖的是 `draftWorkflow`
- 但历史 demo 仍然会随服务一起暴露
- 没有明确要求前，不要随手删除 weather / xhs 相关注册

## 和其他应用的连接点

### 1. 前端草稿生成

- 前端调用 `POST /api/workflows/draftWorkflow/...`
- 来源：`apps/front-end/src/apis/drafts.ts`

### 2. Agent Proxy

- 后端可以把请求转发到 `apps/ai-agent`
- 来源：`apps/back-end/src/agent-proxy/agent-proxy.service.ts`

如果你修改 agent generate 路径或 agent id，请同步检查后端代理和前端调用方。

## 环境变量

- `MODEL_NAME`
- `IFLOW_API_KEY`
- `OPENAI_API_KEY`

## 运行命令

在仓库根目录：

```bash
pnpm --filter @yt-ai/ai-agent dev
pnpm --filter @yt-ai/ai-agent build
pnpm --filter @yt-ai/ai-agent start
```

## 维护建议

- 业务相关变更优先看 `draftWorkflow`
- 不要把 weather demo 误写进项目主架构文档
- 不要假设 `apps/ai-agent` 是前端市场页 Agent 的唯一执行后端；很多 Agent 仍然可以是外部 `endpointUrl`
