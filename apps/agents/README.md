# @yt/agents

基于 Mastra 的 LLM 草案生成服务，用于把用户自然语言转换为 agent/job 的结构化草案 JSON。

## 功能概览

- 自然语言输入 → agent/job 草案 JSON
- 输出包含 missing/置信度/备注，便于前端引导补全
- 与后端字段定义对齐（参考 `apps/back-end/src/agents` 与 `apps/back-end/src/jobs`）

## 目录结构

```
apps/agents/
  src/mastra/
    agents/           # Mastra Agent
    workflows/        # Mastra Workflow
    prompts/          # Prompt 构建
    schemas/          # Zod Schema 定义
```

## 本地开发

在仓库根目录执行：

```
pnpm install -w
pnpm --filter @yt/agents dev
```

Mastra dev server 默认端口为 `4111`，可通过 CLI 参数调整。

运行前请确保环境变量已配置：

```
OPENAI_API_KEY=你的密钥
```

## 输入输出

### 输入

```
{
  "text": "用户自然语言需求",
  "draftType": "job" | "agent" (可选),
  "createdBy": "user-id" (可选),
  "owner": "owner-id" (可选)
}
```

### 输出

```
{
  "draftType": "job" | "agent",
  "fields": { ... },
  "missing": ["fields.title"],
  "confidence": { "fields.title": 0.73 },
  "notes": ["字段不确定的原因"]
}
```

## 说明

- 解析逻辑与字段约束集中在 `schemas` 与 `prompts` 中。
- 输出会被 Zod 校验，保证结构稳定。
- 需要与发布表单完全一致时，请同步后端字段定义。

## HTTP 接口（Mastra dev）

使用 Mastra dev server 时，可直接调用：

```
POST http://localhost:4111/api/workflows/draft-workflow/start-async
```

请求体：

```
{
  "inputData": {
    "text": "自然语言需求",
    "draftType": "job",
    "createdBy": "0x...",
    "owner": "0x..."
  }
}
```
