# Dashboard 模块 - 前端任务清单

> 任务清单位置：`.ai/tasks/dashboard/task-fe.md`
> 工作分支：`feat/celery`
> 关联 PRD：`.ai/docs/prd.md` 3.7 章节

---

## Phase 1: API 层

### [DONE] DASH-FE-001 创建 Dashboard API 类型定义

- **验收标准**：
  - 创建 `apps/front-end/src/apis/dashboard.types.ts`
  - 定义 `PaginatedResponse<T>` 泛型接口
  - 定义 `DashboardStatsResponse` 接口
  - 定义 `PublishedJobItem` 接口
  - 定义 `PublishedAgentItem` 接口
  - 定义 `SignedAgentItem` 接口
  - 定义 `DisputeItem` 接口
- **依赖**：后端 DASH-BE-001 完成
- **Notes**：类型与后端响应结构保持一致
- **完成日期**：2026-01-19

### [DONE] DASH-FE-002 创建 Dashboard API 函数

- **验收标准**：
  - 创建 `apps/front-end/src/apis/dashboard.ts`
  - 实现 `fetchDashboardStats(address)` 函数
  - 实现 `fetchPublishedJobs(address, pagination)` 函数
  - 实现 `fetchPublishedAgents(address, pagination)` 函数
  - 实现 `fetchSignedAgents(address, pagination)` 函数
  - 实现 `fetchDisputes(address, pagination)` 函数
  - 使用 `@yt/libs/http` 的 request 方法
- **依赖**：DASH-FE-001
- **Notes**：参考 `apis/agent.ts` 的实现模式
- **完成日期**：2026-01-19

### [DONE] DASH-FE-003 创建 Dashboard 数据 Hooks

- **验收标准**：
  - 创建 `apps/front-end/src/hooks/useDashboard.ts`
  - 实现 `useDashboardStats(address)` hook
  - 实现 `usePublishedJobs(address, page)` hook
  - 实现 `usePublishedAgents(address, page)` hook
  - 实现 `useSignedAgents(address, page)` hook
  - 实现 `useDisputes(address, page)` hook
  - 包含 loading, error, data 状态
- **依赖**：DASH-FE-002
- **Notes**：使用 React useState + useEffect 或 SWR/React Query
- **完成日期**：2026-01-19

---

## Phase 2: 组件开发

### [DONE] DASH-FE-004 重构 Dashboard 主页面

- **验收标准**：
  - 修改 `apps/front-end/src/app/dashboard/page.tsx`
  - 添加 4 个 Tab 切换组件 (使用 @yt/ui 或自定义)
  - Tab 列表：我发布的任务、我的智能体、已签约智能体、争议中心
  - 保留顶部统计卡片区域
  - 未连接钱包时显示提示信息
- **依赖**：无
- **Notes**：使用 wagmi 的 useAccount 获取钱包地址
- **完成日期**：2026-01-19

### [DONE] DASH-FE-005 实现 DashboardStats 统计卡片组件

- **验收标准**：
  - 创建 `apps/front-end/src/app/dashboard/components/DashboardStats.tsx`
  - 显示钱包余额、锁定金额、总收益、总支出
  - 显示发布任务数、活跃任务数、完成任务数
  - 显示发布智能体数、签约数、争议数
  - 调用 `useDashboardStats` 获取数据
  - 支持 loading 和 error 状态
- **依赖**：DASH-FE-003, DASH-FE-004
- **Notes**：参考现有卡片 UI 样式
- **完成日期**：2026-01-19

### [DONE] DASH-FE-006 实现 PublishedJobsTab 组件

- **验收标准**：
  - 创建 `apps/front-end/src/app/dashboard/components/PublishedJobsTab.tsx`
  - 表格显示：任务标题、状态、预算范围、竞价数/已选Agent、截止日期
  - 调用 `usePublishedJobs` 获取数据
  - 支持分页
  - 空数据显示友好提示
- **依赖**：DASH-FE-003, DASH-FE-004
- **Notes**：状态使用不同颜色标签展示
- **完成日期**：2026-01-19

### [DONE] DASH-FE-007 实现 PublishedAgentsTab 组件

- **验收标准**：
  - 创建 `apps/front-end/src/app/dashboard/components/PublishedAgentsTab.tsx`
  - 表格显示：Agent 名称、状态、技能等级、定价、评分、任务数、收益
  - 调用 `usePublishedAgents` 获取数据
  - 支持分页
- **依赖**：DASH-FE-003, DASH-FE-004
- **Notes**：isActive 显示为 在线/离线 状态
- **完成日期**：2026-01-19

### [DONE] DASH-FE-008 实现 SignedAgentsTab 组件

- **验收标准**：
  - 创建 `apps/front-end/src/app/dashboard/components/SignedAgentsTab.tsx`
  - 表格显示：任务标题、Agent 名称、合约状态、费用、签署日期
  - 调用 `useSignedAgents` 获取数据
  - 支持分页
- **依赖**：DASH-FE-003, DASH-FE-004
- **Notes**：无
- **完成日期**：2026-01-19

### [DONE] DASH-FE-009 实现 DisputesTab 组件

- **验收标准**：
  - 创建 `apps/front-end/src/app/dashboard/components/DisputesTab.tsx`
  - 表格显示：任务标题、争议状态、发起人、金额、投票进度、创建日期
  - 调用 `useDisputes` 获取数据
  - 支持分页
  - 显示是否为我发起的争议
- **依赖**：DASH-FE-003, DASH-FE-004
- **Notes**：tags 和 priority 字段暂不显示 (MVP 阶段)
- **完成日期**：2026-01-19

### [DONE] DASH-FE-010 实现 Pagination 分页组件

- **验收标准**：
  - 创建 `apps/front-end/src/app/dashboard/components/Pagination.tsx`
  - 支持上一页/下一页按钮
  - 显示当前页码和总页数
  - 禁用边界按钮 (第一页禁用上一页，最后一页禁用下一页)
- **依赖**：DASH-FE-004
- **Notes**：可复用于其他页面
- **完成日期**：2026-01-19

---

## Phase 3: 集成测试

### [DONE] DASH-FE-011 前后端联调测试

- **验收标准**：
  - 所有 Tab 正确显示后端数据
  - 分页功能正常工作
  - 空数据状态正确显示
  - 错误状态正确处理
  - 加载状态有 loading 提示
- **依赖**：后端所有 DASH-BE-* 任务完成
- **Notes**：使用 Supabase 测试数据
- **完成日期**：2026-01-19

---

## 版本历史

- **2026-01-19**: 初始版本，基于 PRD 3.7 拆解
- **2026-01-19**: DASH-FE-001 ~ 011 全部完成，由 Codex Cloud 执行

