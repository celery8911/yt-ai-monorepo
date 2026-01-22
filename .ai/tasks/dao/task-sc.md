# DAO 投票模块 - 合约任务清单

> 任务清单位置：`.ai/tasks/dao/task-sc.md`
> 工作分支：`feat/celery`
> 关联 PRD：`.ai/docs/prd.md`（如适用）

---



---

## Phase 2: 部署配置与地址落地

### [TODO] DAO-SC-002 部署参数与环境变量补全

- **验收标准**：
  - 更新 `apps/contract/.env.example` 添加 `SEPOLIA_RPC_URL`、`DEPLOYER_PRIVATE_KEY`、`KEEPER_ADDRESS`
  - 在 `apps/contract/README.md` 补充部署步骤与地址填写说明
  - `deploy.ts` 中 `minVoters` 默认值为 3（若已有配置则确保一致）
- **Notes**：目前地址为空，需完成部署后再对接前后端。
