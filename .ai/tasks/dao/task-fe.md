# DAO 投票模块 - 前端任务清单

> 任务清单位置：`.ai/tasks/dao/task-fe.md`
> 工作分支：`feat/celery`
> 关联 PRD：`.ai/docs/prd.md`（如适用）

---

## Phase 1: 投票 UI 与限制

### [TODO] DAO-FE-001 投票权限与状态限制

- **验收标准**：
  - 更新 `apps/front-end/src/app/dao/[id]/page.tsx`
  - 投票人是甲方/乙方时禁用投票按钮并提示原因
  - 已投票用户禁用投票按钮并提示“已投票”
  - 争议已 `RESOLVED` 时禁用投票按钮
  - 未连接钱包时提示连接钱包
- **依赖**：DAO-BE-001

---

## Phase 2: 投票数据与百分比展示

### [TODO] DAO-FE-002 投票百分比计算与展示对齐

- **验收标准**：
  - 更新 `apps/front-end/src/app/dao/[id]/page.tsx`
  - 使用 `votesFor` / `votesAgainst` 计算百分比（0 票时显示 0%/0%）
  - 页面数据展示与后端字段保持一致
  - 断网或错误状态保持友好提示
- **依赖**：DAO-BE-001
