# /analyze - 需求分析命令

## 命令用途

将 PRD（产品需求文档）转换为可执行的开发计划，并拆分到各工程角色的任务清单中。

## 工作流程

1. **输入**：`.ai/docs/prd.md`（产品需求文档）
2. **处理**：
   - 分析需求的技术可行性与风险点
   - 识别涉及的工程角色（frontend/backend/contract）
   - 拆解为原子化的开发任务
   - 定义验收标准、依赖关系与影响范围
3. **输出**：
   - 角色任务清单：`.ai/tasks/task-fe.md`、`.ai/tasks/task-be.md`、`.ai/tasks/task-sc.md`
   - 总览更新：`task.md`（只维护概览与链接）

## 使用方式

1. 在 `.ai/docs/` 下创建或更新 `prd.md`
2. 执行分析命令（由 Claude Code 执行）
3. 更新对应角色的任务清单（添加 [TODO]）
4. 更新 `task.md` 的总览与指向链接
5. Review 任务清单并确认执行计划

## 任务清单格式规范

每个 Phase 包含：
- Phase 标题和目标描述
- TODO 列表

每个 TODO 包含：
- **ID**：唯一标识符（如 FE-001 / BE-001 / SC-001）
- **状态**：TODO / DOING / DONE
- **描述**：清晰的任务描述
- **验收标准**：可验证的完成条件
- **依赖**：跨角色或前置任务（可选）
- **影响文件**：影响范围（可选）
- **Notes**：执行过程中的备注（可选）
- **完成日期**：标记为 DONE 时填写（可选）

## 示例

### Phase 1: 需求落地

- [TODO] [FE-001] 用户登录页 UI 组件
  - 验收：登录页在 Storybook 中可交互预览
  - 依赖：BE-001（登录接口）
  - 影响文件：`packages/yt-ui/src/LoginPage.tsx`

- [TODO] [BE-001] 登录接口实现
  - 验收：`POST /auth/login` 返回 accessToken
  - 影响文件：`apps/back-end/src/routes/auth.ts`

- [DONE] [SC-001] 合约 ABI 初始化 (2026-01-12)
  - 验收：TypeChain 生成的类型可在前端使用
  - Notes: 已同步 ABI 到 `apps/contract/`
