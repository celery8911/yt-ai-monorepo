# Codex Cloud 执行指令

> 本文档面向 Codex Cloud AI Agent，定义任务执行的规则和约束

---

## 项目背景

搭建一个 AI-Native Monorepo 工程平台 yt-ai-monorepo。

**远程仓库**: https://github.com/celery8911/yt-ai-monorepo
**工作分支**: dev

---

## 当前任务

根据你的 Agent 类型，请阅读并执行对应任务清单中标记为 [TODO] 的任务：

### Frontend Agent
任务清单：`.ai/tasks/task-fe.md`

负责：
- @yt/ui 组件库开发
- @yt/hooks Hooks 开发
- Storybook 文档维护

### Backend Agent
任务清单：`.ai/tasks/task-be.md`

负责：
- API 接口开发
- 数据库设计和操作
- 服务端逻辑实现

### Contract Agent
任务清单：`.ai/tasks/task-sc.md`

负责：
- Solidity 合约开发
- 合约测试和部署
- ABI 管理和类型生成

---

## ⚠️ 重要执行规则

### 1. 严格按照任务清单执行

- **只执行标记为 [TODO] 的任务**
- **忽略 [DOING] 和 [DONE] 的任务**
- **不要修改已标记为 [DONE] 的任务相关的文件**

### 2. 验收标准全部满足

- 每个任务都有明确的验收标准
- 必须全部满足才算完成
- 如果无法满足，停止执行并报告

### 3. 严格按照执行步骤

- 如果任务中包含"执行步骤"，严格按照步骤执行
- 不要跳过任何步骤
- 不要改变步骤顺序

### 4. 状态更新由 Claude Code 负责

- **执行完成后，不要修改任务清单的状态**
- 状态更新（TODO → DONE）由 Claude Code 在本地完成

---


## 执行流程

1. **阅读任务清单**：了解所有任务和验收标准
2. **按顺序执行**：从第一个 [TODO] 开始，逐个完成
3. **验证每个任务**：确保验收标准全部满足
4. **保持文件完整性**：不要删除或修改不应该改动的文件

---

## Agent 职责边界

### Frontend Agent 可以做的事

✅ **允许**：
- 在 `packages/yt-ui/` 开发 React 组件
- 在 `packages/yt-hooks/` 开发 React Hooks
- 在 `apps/yt-ui-interface/` 更新 Storybook
- 在 `packages/yt-libs/` 添加前端相关工具函数

❌ **禁止**：
- 不涉及 API 接口开发
- 不编写 Solidity 合约
- 不修改根目录构建配置（除非任务明确授权）

### Backend Agent 可以做的事

✅ **允许**：
- 开发 RESTful API 或 GraphQL API
- 设计数据库模型和迁移脚本
- 实现服务端业务逻辑

❌ **禁止**：
- 不开发前端 UI 组件
- 不编写 Solidity 合约
- 不修改根目录构建配置（除非任务明确授权）

### Contract Agent 可以做的事

✅ **允许**：
- 编写 Solidity 智能合约
- 编写合约测试（Hardhat/Foundry）
- 生成 TypeScript 类型定义（TypeChain/viem）

❌ **禁止**：
- 不开发前端 UI 组件
- 不开发后端 API 接口
- 不修改根目录构建配置（除非任务明确授权）

详细职责定义请参考：
- [`.ai/agents/frontend-agent.md`](../agents/frontend-agent.md)
- [`.ai/agents/backend-agent.md`](../agents/backend-agent.md)
- [`.ai/agents/contract-agent.md`](../agents/contract-agent.md)

---

## 特别注意

### 不要初始化 git 仓库

git 初始化由 Claude Code 执行，不要在任务中运行 `git init`。

### 不要推送到远程

推送操作由 Claude Code 在验证后执行，不要在任务中运行 `git push`。

### 保留原有文档

.ai/ 目录不要删除或修改（除非任务明确要求）。

---


## 任务清单格式

任务清单使用以下格式：

```markdown
## Phase N: [Phase 描述]

### [TODO] [ID] 任务标题

- **验收标准**：
  - 标准 1
  - 标准 2
- **依赖**：[可选] 其他任务 ID
- **执行步骤**：[可选]
  1. 步骤 1
  2. 步骤 2
- **影响文件**：[可选]
  - file1.ts
  - file2.md
- **Notes**：[可选] 备注信息
```

---

## 错误处理

### 如果遇到无法解决的问题

1. **停止执行**：不要继续执行后续任务
2. **报告问题**：在输出中清晰说明遇到的问题
3. **提供上下文**：包括错误信息、尝试的方法、环境信息

### 如果验收标准无法满足

1. **不要强行标记为完成**
2. **说明原因**：为什么无法满足
3. **提供建议**：如何修改任务或验收标准

---

## 质量标准

### 代码质量

- 所有代码必须是 TypeScript（除非特殊说明）
- 遵循项目现有的代码风格
- 通过 Biome 格式化和 Lint 检查
- 类型安全，无 `any` 类型（除非必要）

### 测试要求

- 如果任务涉及新功能，必须包含测试
- 测试必须通过
- 测试覆盖核心逻辑

### 文档要求

- 如果添加新的公共 API，必须有文档注释
- 如果是 UI 组件，必须有 Storybook Story
- 复杂逻辑必须有代码注释

---

## 开始执行

请立即开始执行任务清单中的所有 [TODO] 任务。

**执行完成后**：
- 不要修改任务清单状态
- 提供简要的执行总结
- 列出完成的任务 ID
- 说明是否遇到问题

---

## 参考文档

- [架构文档](./architecture.md)
- [工作流程文档](./workflow.md)
- [需求分析命令](./../commands/analyze.md)

---

