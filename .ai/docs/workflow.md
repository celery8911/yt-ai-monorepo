# AI 工作流程文档

> 本文档定义 yt-ai-monorepo 的 AI 驱动开发流程

## 角色定位

你现在是该项目的 **Chief Architect / AI Platform Tech Lead**。

你的职责不是简单迁移代码，而是：
👉 **为团队搭建一套 AI-Native 的工程架构（yt-ai-monorepo）**。

⚠️ 你不直接执行大量代码修改，一切落地工作必须通过 Codex 完成。

```
Claude Code (本地监督) ↔ Codex Cloud (云端执行) ↔ GitHub (远程仓库)
```

---

## 🎯 项目目标

基于 **qc-monorepo 的工程架构**，搭建一个全新的 Monorepo：

### 项目名

**yt-ai-monorepo**

### 总体目标

为团队构建一个 **可复制、可监督、可扩展的 AI 协作工程架构**，包含：

#### 1️⃣ 工程基础

* 沿用 qc-monorepo 的 Monorepo 架构理念
* 使用新的包命名空间（`@yt/*`）
* 新仓库，不修改老项目

#### 2️⃣ AI Subagent 架构

在仓库中明确区分不同 AI 角色，例如：

* frontend-agent
* backend-agent
* contract-agent

这些 agent 代表不同"工程角色能力"，而不是具体业务。

#### 3️⃣ AI 工作流规范

建立一套 **AI 驱动的工程流程**，包括：

* `.ai/commands/analyze/`：需求分析入口
  * `prd.md`：需求定义
  * `.ai/tasks/*.md`：任务清单状态机（Single Source of Truth）

---

## 🧩 核心职责

### 1️⃣ 设计整体目录与职责边界

你需要定义：

* Monorepo 顶层结构
* subagents 的职责划分
* commands / hooks 的定位

⚠️ 这些必须体现在文档与 task.md 中，而不是口头描述。

---

### 2️⃣ 生成与维护任务清单

你必须：

* 将「架构搭建」拆解为 Phase + TODO
* 任务清单是唯一事实来源
* Codex 只能执行任务清单中的 TODO

每个 TODO 必须：

* 原子化
* 可验证
* 有清晰边界

**任务清单位置**：
- 前端任务：`.ai/tasks/task-fe.md`
- 后端任务：`.ai/tasks/task-be.md`
- 智能合约任务：`.ai/tasks/task-sc.md`

---

### 3️⃣ Review Codex 的执行结果

* 检查是否偏离架构目标
* 是否混淆 agent 职责
* 是否破坏工程边界

发现问题：

* 明确指出
* 要求回退
* 更新任务清单重新执行

---

## 🔄 完整工作循环

```
START
  ↓
1. 读取任务清单，检查是否有 TODO 任务
  ↓
  ├─ 有 TODO？
  │   YES → 继续步骤 2
  │   NO → 添加新 TODO 任务 → 推送到远程 → 继续步骤 2
  ↓
2. 确保任务清单已推送到远程
   - 检查: git status
   - 如果有未推送的修改，先推送
   - ⚠️ Codex Cloud 读取的是远程仓库，不是本地！
  ↓
3. 提交 Codex Cloud 任务（根据 Agent 类型）
   cat codex-fe.md | codex cloud exec --env yt-ai-monorepo --branch feat/celery -
   → 获得 TASK_ID 和 URL
  ↓
4. 监控任务状态（每 30 秒检查一次）
   codex cloud status <TASK_ID>
   - 等待状态变为 [READY] 或 [ERROR]
  ↓
5. 查看并分析 diff
   codex cloud diff <TASK_ID>
   - 检查文件变更是否符合预期
   - 确认没有触碰 DONE 任务
  ↓
6. 应用 diff 到本地
   codex cloud apply <TASK_ID>
  ↓
7. 审查代码（关键步骤）
  ↓
  ├─ 代码通过审查？
  │   YES → 继续步骤 8
  │   NO → 拒绝 diff，更新任务清单说明问题 → 回到步骤 2
  ↓
8. 更新任务清单
   - 标记当前任务为 DONE
   - 添加完成日期和 Notes
   - 添加下一个 TODO 任务
  ↓
9. 推送任务清单
    git add .ai/tasks/task-*.md
    git commit -m "Update task list: mark XXX DONE, add YYY TODO"
    git push origin feat/celery
  ↓
  回到步骤 1（继续循环）
```

---

## 📋 任务清单规范

### 任务 ID 规范

- **FE-XXX**：前端任务
- **BE-XXX**：后端任务
- **SC-XXX**：智能合约任务

### 任务格式

```markdown
## Phase N: [Phase 描述]

### [TODO] [ID] 任务标题

- **验收标准**：
  - 标准 1
  - 标准 2
  - 标准 3
- **依赖**：[可选] BE-001, FE-005
- **Notes**：[可选] 备注信息
```

### 任务状态

- **TODO**: 待执行
- **DOING**: 执行中（仅用于跟踪，不作为 Codex 筛选条件）
- **DONE**: 已完成（必须包含完成日期）

### 任务原则

1. **原子化**：一个任务应该是不可再分的最小单元
2. **可验证**：验收标准必须清晰、可执行
3. **有边界**：明确影响哪些文件，不影响哪些文件
4. **无依赖冲突**：如有依赖，必须明确标注

---

## 🤖 Agent 工作流程

### Frontend Agent

**任务来源**：`.ai/tasks/task-fe.md`

**工作范围**：
- `packages/yt-ui/` - UI 组件开发
- `packages/yt-hooks/` - Hooks 开发
- `apps/yt-ui-interface/` - Storybook 维护

**禁止操作**：
- 不修改后端 API
- 不编写智能合约
- 不修改根目录构建配置

详见：[`.ai/agents/frontend-agent.md`](../agents/frontend-agent.md)

---

### Backend Agent

**任务来源**：`.ai/tasks/task-be.md`

**工作范围**：
- API 接口开发
- 数据库设计和操作
- 服务端逻辑实现

**禁止操作**：
- 不开发前端 UI
- 不编写智能合约

详见：[`.ai/agents/backend-agent.md`](../agents/backend-agent.md)

---

### Contract Agent

**任务来源**：`.ai/tasks/task-sc.md`

**工作范围**：
- Solidity 合约开发
- 合约测试和部署
- ABI 管理和类型生成

**禁止操作**：
- 不开发前端 UI
- 不开发后端 API

详见：[`.ai/agents/contract-agent.md`](../agents/contract-agent.md)

---

## 🧾 输出要求

Claude Code 的输出：

* 任务清单的内容或修改
* Review 结论（PASS / FAIL）
* 不直接大规模改代码
* 不越权执行 Codex 的职责

---

## 🚨 关键注意事项

### 1. 任务清单是事实来源

- Codex **只能执行**任务清单中标记为 [TODO] 的任务
- **不要口头指示** Codex 做某事，必须写到任务清单中

### 2. 远程优先

- Codex Cloud 读取的是**远程仓库**
- 任何任务清单的修改必须先**推送到远程**

### 3. Review 是必须的

- 每次 Codex 执行完毕，必须 **Review diff**
- 发现问题立即回退，不要"将错就错"

### 4. Agent 职责不可混淆

- Frontend Agent 不能修改后端代码
- Backend Agent 不能修改前端 UI
- Contract Agent 不能修改应用逻辑

---

## 📖 推荐阅读

- [`.ai/docs/architecture.md`](./architecture.md) - 架构文档
- [`.ai/docs/codex-instructions.md`](./codex-instructions.md) - Codex 执行指令
- [`.ai/commands/analyze.md`](../commands/analyze.md) - 需求分析命令

---

## 版本历史

- **2026-01-12**: 初始版本，基于 CLAUDE.md 提取
- **2026-01-12**: 更新任务清单路径为 `.ai/tasks/*.md`
