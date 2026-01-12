# Codex Cloud 执行指令

你是一个 AI 工程执行助手，负责完成 yt-ai-monorepo 架构搭建任务。

## 项目背景

正在基于 [qc-monorepo](https://github.com/celery8911/qc-monorepo) 搭建一个全新的 AI-Native Monorepo 工程平台 yt-ai-monorepo。

**远程仓库**: https://github.com/celery8911/yt-ai-monorepo
**工作分支**: dev

## 当前任务

请阅读并执行 `task.md` 中标记为 [TODO] 的任务 LC-013。

**已完成的任务**：
- [DONE] LC-001: 克隆 qc-monorepo 并复制基础架构
- [DONE] LC-002: 重命名包目录
- [DONE] LC-003 到 LC-012: 架构搭建和 AI 工作流设置
- [DONE] LC-013-old: 初始化 git 仓库并推送

**重要执行规则**:

1. **严格按照 task.md 中的顺序执行任务**
2. **只执行标记为 [TODO] 的任务，忽略 [DOING] 和 [DONE]**
3. **每个任务都有明确的验收标准，必须全部满足**
4. **如果任务中包含"执行步骤"，严格按照步骤执行**
5. **不要修改已标记为 [DONE] 的任务相关的文件**
6. **执行完成后，不要修改 task.md 的状态（状态更新由 Claude Code 负责）**

## 关键约束

### 代码迁移范围

**必须保留**：
- packages/ 目录及所有包（qc-ui、qc-hooks、qc-libs）
- apps/qc-ui-interface/ 应用
- 根配置文件（package.json、pnpm-workspace.yaml、turbo.json、tsconfig.base.json、.npmrc）
- .changeset/ 目录
- .github/workflows/（除 release.yml 外）

**必须移除**：
- apps/web-app/
- .github/workflows/release.yml
- .claude/ 目录

### 技术栈

完全沿用 qc-monorepo 的配置：
- 包管理：pnpm workspace
- 构建工具：Turborepo
- 包命名空间：@yt/* （从 @qincai/* 更改）
- 包级构建工具：保持不变（Vite、Rollup、Microbundle）

### 命名规范

- 所有包名必须使用 `@yt/*` 命名空间
- 目录名与包名保持一致（如 packages/yt-ui/ 对应 @yt/ui）

## 执行流程

1. **阅读 task.md**：了解所有任务和验收标准
2. **按顺序执行**：从 LC-001 开始，逐个完成
3. **验证每个任务**：确保验收标准全部满足
4. **保持文件完整性**：不要删除或修改不应该改动的文件

## 特别注意

- **不要初始化 git 仓库**：git 初始化会在最后阶段（LC-013）执行
- **不要推送到远程**：推送操作由 Claude Code 在验证后执行
- **保留原有文档**：CLAUDE.md、CODEX.md、task.md 不要删除或修改
- **遵循原有架构**：所有修改必须符合 qc-monorepo 的工程架构模式

## 当前工作目录

`/Users/zhangqin/offlineProject`

当前目录已有文件：
- CLAUDE.md（项目需求文档）
- CODEX.md（本文件）
- task.md（任务清单）

## 开始执行

请立即开始执行 task.md 中的所有 [TODO] 任务。
