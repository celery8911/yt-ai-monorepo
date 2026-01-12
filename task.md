# yt-ai-monorepo 架构搭建任务清单

> 本文档是项目唯一的执行状态机（Single Source of Truth）
> 所有 AI Agent 只能执行标记为 [TODO] 的任务

## Phase 1: 从 qc-monorepo 复制基础架构

**目标**: 将 qc-monorepo 的工程架构复制到本地，不包含 git 历史

- [DONE] [LC-001] 克隆 qc-monorepo 并复制基础架构 (2026-01-12)
  - **验收标准**: ✓ 所有标准已满足
  - **Notes**: 由 Claude Code 在本地完成，因 Codex Cloud 无法访问私有仓库

---

## Phase 2: 重命名和清理

**目标**: 将 @qincai/* 命名空间更改为 @yt/*，更新项目标识

- [DONE] [LC-002] 重命名包目录 (2026-01-12)
  - **验收标准**: ✓ 所有目录已重命名
  - **Notes**: 由 Claude Code 在本地完成

- [DONE] [LC-003] 更新所有 package.json 的包名 (2026-01-12)
  - **验收标准**: ✓ 所有包名已更新为 @yt/*
  - **Notes**: 由 Codex Cloud 完成

- [DONE] [LC-004] 更新所有 package.json 的依赖引用 (2026-01-12)
  - **验收标准**: ✓ 所有 @qincai/* 引用已替换为 @yt/*
  - **Notes**: 由 Codex Cloud 完成

- [DONE] [LC-005] 更新根 package.json (2026-01-12)
  - **验收标准**: ✓ 所有字段已更新
  - **Notes**: 由 Codex Cloud 完成

- [DONE] [LC-006] 验证依赖安装 (2026-01-12)
  - **验收标准**: ✓ 依赖安装成功，740 个包已安装
  - **Notes**: 由 Claude Code 在本地完成

---

## Phase 3: AI 工作流基础设施

**目标**: 建立 AI 工作流的核心基础设施

- [DONE] [LC-007] 创建目录结构 (2026-01-12)
  - **验收标准**:
    - subagents/ 目录存在
    - commands/ 目录存在
  - **执行步骤**:
    ```bash
    mkdir -p subagents
    mkdir -p commands
    ```

- [DONE] [LC-008] 创建 commands/analyze.md (2026-01-12)
  - **验收标准**:
    - commands/analyze.md 文件存在
    - 文件内容包含命令用途、工作流程、使用方式、task.md 格式规范、示例
  - **影响文件**:
    - commands/analyze.md
  - **文件内容**:
    ```markdown
    # /analyze - 需求分析命令

    ## 命令用途

    将 PRD（产品需求文档）转换为可执行的开发计划和任务清单。

    ## 工作流程

    1. **输入**：prd.md（产品需求文档）
    2. **处理**：
       - 分析需求的技术可行性
       - 识别涉及的工程角色（frontend/backend/contract）
       - 拆解为原子化的开发任务
       - 定义验收标准和依赖关系
    3. **输出**：task.md（任务清单状态机）

    ## 使用方式

    1. 在项目根目录创建 `prd.md`
    2. 执行分析命令（由 Claude Code 执行）
    3. 生成或更新 `task.md`
    4. Review task.md 并确认执行计划

    ## task.md 格式规范

    每个 Phase 包含：
    - Phase 标题和目标描述
    - TODO 列表

    每个 TODO 包含：
    - **ID**：唯一标识符（如 LC-001）
    - **状态**：TODO / DOING / DONE
    - **描述**：清晰的任务描述
    - **验收标准**：可验证的完成条件
    - **Notes**：执行过程中的备注（可选）
    - **完成日期**：标记为 DONE 时填写（可选）

    ## 示例

    ### Phase 1: 环境初始化

    - [TODO] [LC-001] 初始化 git 仓库
      - 验收：git status 显示干净的工作区

    - [DOING] [LC-002] 安装依赖
      - 验收：pnpm install 成功，node_modules 存在

    - [DONE] [LC-003] 配置 ESLint (2026-01-12)
      - 验收：eslint . 无错误
      - Notes: 使用了 @yt/eslint-config
    ```

---

## Phase 4: Subagents 定义

**目标**: 定义不同工程角色的 AI Agent 职责和能力边界

- [DONE] [LC-009] 创建 subagents/frontend-agent.md (2026-01-12)
  - **验收标准**:
    - subagents/frontend-agent.md 文件存在
    - 文件内容包含：角色定位、职责范围（可以做的事、不能做的事）、能力边界、工作流程、约束条件
  - **影响文件**:
    - subagents/frontend-agent.md

- [DONE] [LC-010] 创建 subagents/backend-agent.md (2026-01-12)
  - **验收标准**:
    - subagents/backend-agent.md 文件存在
    - 文件内容包含：角色定位、职责范围（可以做的事、不能做的事）、能力边界、工作流程、约束条件
  - **影响文件**:
    - subagents/backend-agent.md

- [DONE] [LC-011] 创建 subagents/contract-agent.md (2026-01-12)
  - **验收标准**:
    - subagents/contract-agent.md 文件存在
    - 文件内容包含：角色定位、职责范围（可以做的事、不能做的事）、能力边界、工作流程、约束条件
  - **影响文件**:
    - subagents/contract-agent.md

---

## Phase 5: 项目 Identity 和文档

**目标**: 建立项目的身份标识和完整文档

- [DONE] [LC-012] 创建 README.md (2026-01-12)
  - **验收标准**:
    - README.md 文件存在
    - 文件内容包含：项目介绍、特性、项目结构、技术栈、快速开始、AI 工作流、包说明、开发指南
    - 包含到 commands/analyze.md、task.md、subagents/ 的链接
  - **影响文件**:
    - README.md

- [TODO] [LC-013] 初始化 git 仓库
  - **验收标准**:
    - .git/ 目录存在
    - git status 显示干净的工作区或已暂存的文件
    - git remote -v 显示 origin 指向 https://github.com/celery8911/yt-ai-monorepo.git
  - **执行步骤**:
    ```bash
    git init
    git add .
    git commit -m "chore: initial commit - yt-ai-monorepo architecture"
    git branch -M main
    git remote add origin https://github.com/celery8911/yt-ai-monorepo.git
    ```
  - **注意**: 不执行 git push，等待后续验证通过后再推送

---

## 验证阶段

**目标**: 验证整个架构搭建的完整性和正确性

- [TODO] [LC-014] 工程可用性验证
  - **验收标准**:
    - pnpm install 成功，无错误
    - pnpm build 成功，所有包构建完成
  - **执行步骤**:
    ```bash
    pnpm install
    pnpm build
    ```

- [TODO] [LC-015] 命名空间验证
  - **验收标准**:
    - 所有 package.json 中的 name 字段使用 @yt/* 命名空间
    - 无 @qincai/* 引用
  - **执行步骤**:
    ```bash
    # 检查所有包名
    find packages apps -name package.json -exec grep '"name"' {} \;

    # 检查是否还有 @qincai 引用
    grep -r "@qincai" packages/ apps/ || echo "✓ No @qincai references found"
    ```

- [TODO] [LC-016] AI 架构验证
  - **验收标准**:
    - subagents/ 目录存在，包含 3 个 agent 文档（frontend-agent.md、backend-agent.md、contract-agent.md）
    - commands/analyze.md 存在且内容完整
    - task.md 存在且格式正确
    - README.md 包含 AI 工作流说明
  - **执行步骤**:
    ```bash
    ls -la subagents/
    ls -la commands/
    ls -la README.md
    ls -la task.md
    ```

- [TODO] [LC-017] Git 仓库验证
  - **验收标准**:
    - git remote -v 显示 origin 指向正确的远程仓库
    - git status 显示干净的工作区
    - git log 显示初始提交记录
  - **执行步骤**:
    ```bash
    git remote -v
    git status
    git log --oneline
    ```

- [TODO] [LC-018] 推送到远程仓库
  - **验收标准**:
    - git push 成功
    - https://github.com/celery8911/yt-ai-monorepo 可以看到所有文件
  - **执行步骤**:
    ```bash
    git push -u origin main
    ```

---

## 任务执行说明

1. **所有标记为 [TODO] 的任务** 可以由 Codex Cloud 执行
2. **标记为 [DOING] 的任务** 正在执行中
3. **标记为 [DONE] 的任务** 已完成，需要包含完成日期
4. **每个任务完成后**，必须更新状态并添加 Notes（如果有）

## 下一步行动

根据 CLAUDE.md 中定义的工作循环：

1. ✅ 已创建 task.md
2. 准备 Codex Cloud 执行指令
3. 提交任务到 Codex Cloud
4. 监控执行状态
5. Review diff 结果
6. Apply 到本地
7. 更新 task.md
