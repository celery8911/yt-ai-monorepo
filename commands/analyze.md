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
