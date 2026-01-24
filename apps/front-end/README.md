# Front-End Applications

> Frontend Agent 的工作目录

## 目录用途

这个目录用于存放所有前端应用项目。

## 工作范围

- Web 应用开发
- 其他前端项目

## 技术栈

- 框架: Next.js 16 + TypeScript
- Web3: Wagmi + Viem + RainbowKit
- UI: Tailwind CSS + shadcn/ui
- 图表: Recharts
- 状态: Zustand

## 依赖包

前端应用可以使用以下内部包：
- `@yt/ui` - UI 组件库
- `@yt/hooks` - React Hooks 工具库
- `@yt/libs` - 通用工具函数库

## 与其他应用的关系

- 可以调用 `apps/back-end/` 中的 API 接口
- 可以集成 `apps/contract/` 中的智能合约（通过 ABI）

## 链上雇佣状态查询（推荐走后端聚合接口）

为避免前端各自拼 Subgraph 查询，建议统一调用后端聚合接口：

- `GET /api/chain-status/escrow/by-job?jobId=job-1`
- `GET /api/chain-status/escrow/by-agent?agent=0x...&activeOnly=true`

说明：
- `jobId` 为业务字符串，后端会统一转换为 `bytes32`（`ethers.id(jobId)`）。
- `activeOnly=true` 仅返回进行中的雇佣（LOCKED/DISPUTED/FROZEN）。
- 响应包含 `jobIdBytes32` 与 `status`，可直接映射 UI 状态。

如需直连 Subgraph，请先与合约负责人确认 schema 与查询模板，避免字段变更导致前端报错。

### JobId 规则（前端输入）

- 前端只传业务字符串 `jobId`（如 `job-1` 或数据库 ID）。
- 后端统一转换为 `bytes32`（`ethers.id(jobId)`），前端不要自行计算。

### 状态映射（UI 显示）

| 状态 | 含义 | UI 建议 |
| --- | --- | --- |
| LOCKED | 已托管，待释放 | 进行中 |
| RELEASED | 已支付给 agent | 已完成 |
| REFUNDED | 退回雇主 | 已取消 |
| DISPUTED | 争议中 | 争议中 |
| FROZEN | 冻结中 | 冻结中 |

## 负责人

Frontend Agent - 详见 [`.ai/agents/frontend-agent.md`](../../.ai/agents/frontend-agent.md)

## 任务清单

前端应用相关任务请查看：[`.ai/tasks/task-fe.md`](../../.ai/tasks/task-fe.md)

## 项目开发规范

### 分支与提交

- 分支命名：`feature/<scope>`、`fix/<scope>`、`chore/<scope>`
- 提交信息：`type(scope): message`，示例：`feat(ui): add header nav`
- 必须自检通过后再提交，保持提交粒度小且可回滚

### 代码风格

- 统一使用 TypeScript，避免 `any`（除非有明确注释说明）
- 组件与文件命名使用 `PascalCase`，hooks 使用 `useXxx`
- 优先使用现有 `@yt/ui` 组件与 `@yt/hooks` 工具
- 使用 Tailwind 工具类，避免无理由的内联样式

### 目录与模块

- 页面放在 `src/app`，组件放在 `src/components`
- 业务逻辑与服务调用放在 `src/services` 或 `src/apis`
- 公共工具函数放在 `src/utils`

### 模块与目录映射

- `src/app`：路由与页面模块
- `src/components`：通用组件模块
- `src/apis`：接口调用模块
- `src/services`：业务服务模块
- `src/hooks`：自定义 hooks 模块
- `src/store`：状态管理模块
- `src/utils`：工具函数模块

### 接口与类型

- 所有 API 调用必须集中在 `src/apis`，禁止在组件内直接请求
- API 返回值必须定义类型，并在调用处严格校验
- 复用接口协议时优先从共享包中导入

### 质量与测试

- 保持 UI 可访问性与基础键盘操作支持
- 关键页面变更需自测主要用户路径
- 视觉或交互变更要更新对应文档或截图

### 环境与依赖

- 依赖安装与脚本统一使用 `pnpm`
- 环境变量写入 `.env`，不要提交敏感信息
