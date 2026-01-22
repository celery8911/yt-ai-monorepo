# DAO 投票模块 - 后端任务清单

> 任务清单位置：`.ai/tasks/dao/task-be.md`
> 工作分支：`feat/celery`
> 关联 PRD：`.ai/docs/prd.md`（如适用）

---

## Phase 1: 投票规则与校验

### [TODO] DAO-BE-001 DAO 投票基础校验与限权

- **验收标准**：
  - 更新 `apps/back-end/src/dao/dao.service.ts` 的 `vote` 流程
  - 投票人不得为任务甲方（`job.createdBy`）或乙方（`job.selectedAgentId`）
  - 投票权重固定为 1（不再使用钱包余额作为权重）
  - 争议已 `RESOLVED` 时拒绝投票并返回明确错误
  - 仍保持“不能重复投票”校验
- **影响文件**：
  - `apps/back-end/src/dao/dao.service.ts`

---

## Phase 2: 自动裁决与结算

### [TODO] DAO-BE-002 到期自动裁决与退款/释放

- **验收标准**：
  - 增加投票截止判断（基于 `dispute.createdAt` + 配置化投票期）
  - 当投票期结束时自动结算：
    - 若投票人数 < 3 或支持/反对打平，默认返还给甲方
    - 否则按多数票返还给甲方或乙方
  - 结算后更新 Dispute 状态为 `RESOLVED`
  - 通过数据库更新 Escrow 状态与归属（本地数据，不接链上）
- **Notes**：可通过定时任务或在查询/投票时触发过期检查，需保证不会重复结算。

---

## Phase 3: 投票期配置

### [TODO] DAO-BE-003 投票期与最小人数配置

- **验收标准**：
  - 新增投票期配置（如环境变量或配置文件）
  - 最小投票人数固定为 3（支持配置但默认 3）
  - 配置项在 `dao.service.ts` 内有明确引用位置
- **影响文件**：
  - `apps/back-end/src/dao/dao.service.ts`
