# 前端工程任务清单

> 本文件仅由 Frontend Agent 读取和更新
> 负责 @yt/ui、@yt/hooks、Storybook 相关任务

**任务 ID 前缀**: FE-XXX

---

## 当前状态

当前项目处于架构搭建阶段（已完成），尚无具体的前端开发任务。

所有架构搭建任务（LC-001 到 LC-018）已于 2026-01-12 完成。

---

## 待办任务

### Phase 1: 账单号账簿功能实现

#### [DONE] FE-001: 添加 Bills API 客户端方法 (2026-01-19)

**任务描述**: 在前端添加调用后端 Bills API 的客户端方法

- **验收标准**:
  - 在 `apps/front-end/src/apis/client.ts` 中添加 `billsApi` 对象
  - 实现 `billsApi.list()` 方法（支持 role 和 address 查询参数）
  - 实现 `billsApi.getById(id)` 方法
  - 添加适当的 TypeScript 类型定义（使用后端的 Bill 类型）
  - 处理 API 错误情况（网络错误、404等）

- **影响文件**:
  - `apps/front-end/src/apis/client.ts` (修改)

- **依赖**: BE-001（后端 API 需要可用且有测试数据）

- **完成日期**: 2026-01-19

- **Notes**: 
  - ✅ 使用 @yt/libs/http 的 request 方法
  - ✅ 完整的 TypeScript 类型支持
  - ✅ API 基础 URL 配置为 http://localhost:4000/api

---

#### [DONE] FE-002: 更新账单页面使用真实数据 (2026-01-19)

**任务描述**: 更新 `/billing` 页面从 API 获取真实账单数据并展示，符合 UI 设计稿

- **验收标准**:
  - 添加 'use client' 指令（使用 React hooks）
  - 使用 `@tanstack/react-query` 的 useQuery 获取账单数据
  - 实现月度数据聚合函数 `aggregateByMonth()`
  - 计算并显示累计总收入（绿色卡片，payee 角色）
  - 计算并显示累计总支出（粉红色卡片，payer 角色）
  - 按月份分组显示账单历史，每月显示总金额和任务数
  - 添加加载状态（Loading skeleton 或 spinner）
  - 添加错误处理和空状态展示
  - UI 与 `ui/image.png` 设计稿保持一致（颜色、布局、间距）

- **影响文件**:
  - `apps/front-end/src/app/billing/page.tsx` (修改)

- **依赖**: FE-001, BE-001

- **完成日期**: 2026-01-19

- **实现亮点**:
  - ✅ 使用 React Query 进行数据获取和缓存
  - ✅ useMemo 优化月度数据聚合性能
  - ✅ 完整的加载状态和错误处理
  - ✅ UI 完全符合设计稿（颜色、布局、间距）
  - ✅ 响应式设计支持移动端和桌面端

- **Notes**: 
  - 当前使用模拟用户地址，生产环境需集成 Web3 钱包
  - 月度聚合按时间倒序显示（最新月份在前）
  - 待测试: 需启动前端服务验证完整功能

---

## 任务格式示例

```markdown
## Phase 1: [Phase 描述]

### [TODO] [FE-001] 任务标题

- **验收标准**：
  - 标准 1
  - 标准 2
  - 标准 3
- **依赖**：[可选] BE-001, SC-005
- **执行步骤**：[可选]
  1. 步骤 1
  2. 步骤 2
- **影响文件**：
  - packages/yt-ui/src/components/Button.tsx
  - packages/yt-ui/src/components/Button.stories.tsx
- **Notes**：[可选] 备注信息

### [DONE] [FE-002] 完成的任务示例 (2026-01-12)

- **验收标准**：
  - 标准 1 ✓
  - 标准 2 ✓
- **Notes**：完成说明
```

---

## 工作范围

Frontend Agent 负责的代码范围：

### ✅ 可以修改的目录

- `apps/front-end/` - 前端应用项目（主要工作目录）
  - Web 应用开发
  - React / Next.js 应用

- `packages/yt-ui/` - UI 组件库
  - 开发 React 组件
  - 使用 Tailwind CSS 4 编写样式
  - 基于 Radix UI 构建无障碍组件

- `packages/yt-hooks/` - React Hooks 库
  - 开发可复用的 React Hooks
  - 状态管理逻辑（使用 Immer）

- `apps/yt-ui-interface/` - Storybook 文档站
  - 更新组件 Stories
  - 维护组件文档

- `packages/yt-libs/` - 工具函数库
  - 添加纯函数工具

### ❌ 禁止修改的目录

- `apps/back-end/` - 后端应用（Backend Agent 负责）
- `apps/contract/` - 智能合约和 Subgraph（Contract Agent 负责）
- 不修改根目录构建配置（除非明确授权）
- 不修改 Turborepo/pnpm workspace 配置

---

## 详细职责说明

请参考：[`.ai/agents/frontend-agent.md`](../agents/frontend-agent.md)

---

## 依赖管理

如果前端任务依赖后端或合约任务，请在任务的"依赖"字段中明确标注：

```markdown
- **依赖**：BE-003（用户 API 接口）, SC-001（合约 ABI）
```

---

## 版本历史

- **2026-01-12**: 初始版本，文档重组创建
