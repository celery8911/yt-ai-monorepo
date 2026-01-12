# yt-ai-monorepo 任务总览

> 本文件是只读的任务总览，实际任务清单已按工程角色拆分

---

## 架构搭建（已完成）

所有架构搭建任务（LC-001 到 LC-018）已于 2026-01-12 完成。

详细历史请查看：`git log`

### 完成的阶段

- ✅ Phase 1: 从 qc-monorepo 复制基础架构
- ✅ Phase 2: 重命名和清理
- ✅ Phase 3: AI 工作流基础设施
- ✅ Phase 4: Subagents 定义
- ✅ Phase 5: 项目 Identity 和文档
- ✅ Phase 6: 代码规范与工具链（Biome）
- ✅ 验证阶段：所有验证通过

---

## 专门任务清单

根据工程角色，任务清单已拆分为以下三个文件：

### 前端任务
📋 [.ai/tasks/task-fe.md](.ai/tasks/task-fe.md)

**负责范围**：
- @yt/ui 组件库开发
- @yt/hooks Hooks 开发
- Storybook 文档维护
- 前端应用开发

**当前状态**：无待办任务

---

### 后端任务
📋 [.ai/tasks/task-be.md](.ai/tasks/task-be.md)

**负责范围**：
- API 接口开发
- 数据库设计和操作
- 服务端逻辑实现
- 后端测试

**当前状态**：无待办任务

---

### 智能合约任务
📋 [.ai/tasks/task-sc.md](.ai/tasks/task-sc.md)

**负责范围**：
- Solidity 合约开发
- 合约测试和部署
- ABI 管理和类型生成
- 区块链工具函数

**当前状态**：无待办任务

---

## 工作流程

### 1. 创建任务

当有新需求时：

1. 使用 `/analyze` 命令分析 PRD
2. 根据需求类型，在对应的任务清单中添加 [TODO] 任务：
   - 前端需求 → `.ai/tasks/task-fe.md`
   - 后端需求 → `.ai/tasks/task-be.md`
   - 合约需求 → `.ai/tasks/task-sc.md`

### 2. 执行任务

1. 根据工程角色，查看对应的任务清单
2. 选择标记为 [TODO] 的任务
3. 通过 Codex Cloud 执行（或本地开发）

### 3. 完成任务

1. 完成任务后，更新状态为 [DONE]
2. 添加完成日期和 Notes
3. 推送到远程仓库

### 4. 跨角色协作

如有跨角色依赖，在任务的"依赖"字段中明确标注：

```markdown
- **依赖**：BE-003（用户 API 接口）, SC-001（合约 ABI）
```

---

## 任务 ID 规范

### 前缀含义

- **FE-XXX**：Frontend 前端任务
- **BE-XXX**：Backend 后端任务
- **SC-XXX**：Smart Contract 智能合约任务
- **LC-XXX**：Lifecycle 生命周期任务（架构搭建，已完成）

### 编号规则

- 从 001 开始递增
- 不重复使用已完成任务的 ID
- 建议按功能模块分组（如 FE-100～199 为认证模块）

---

## 任务格式规范

每个任务必须包含：

```markdown
### [TODO] [ID] 任务标题

- **验收标准**：
  - 标准 1（清晰、可验证）
  - 标准 2
- **依赖**：[可选] 其他任务 ID
- **执行步骤**：[可选]
  1. 步骤 1
  2. 步骤 2
- **影响文件**：
  - file1.ts
  - file2.md
- **Notes**：[可选] 备注信息
```

---

## AI 工作流文档

详细的 AI 工作流程和指导文档：

- 📘 [工作流程](.ai/docs/workflow.md) - AI 协作流程
- 📘 [架构文档](.ai/docs/architecture.md) - 项目架构说明
- 📘 [Codex 指令](.ai/docs/codex-instructions.md) - Codex Cloud 执行规则
- 📘 [需求分析](.ai/commands/analyze.md) - /analyze 命令说明

---

## Agent 定义

各工程角色的详细职责和能力边界：

- 🤖 [Frontend Agent](.ai/agents/frontend-agent.md)
- 🤖 [Backend Agent](.ai/agents/backend-agent.md)
- 🤖 [Contract Agent](.ai/agents/contract-agent.md)

---

## 快速导航

| 角色 | 任务清单 | Agent 定义 | 工作范围 |
|------|----------|------------|----------|
| 前端工程师 | [task-fe.md](.ai/tasks/task-fe.md) | [frontend-agent.md](.ai/agents/frontend-agent.md) | UI组件, Hooks, Storybook |
| 后端工程师 | [task-be.md](.ai/tasks/task-be.md) | [backend-agent.md](.ai/agents/backend-agent.md) | API, 数据库, 服务端 |
| 合约工程师 | [task-sc.md](.ai/tasks/task-sc.md) | [contract-agent.md](.ai/agents/contract-agent.md) | Solidity, 合约测试, ABI |

---

## 版本历史

- **2026-01-12**: 初始版本，完成架构搭建（LC-001 到 LC-018）
- **2026-01-12**: 文档重组，拆分任务清单为三个专门文件
