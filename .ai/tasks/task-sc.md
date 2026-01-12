# 智能合约工程任务清单

> 本文件仅由 Contract Agent 读取和更新
> 负责 Solidity 合约、合约测试、ABI 管理相关任务

**任务 ID 前缀**: SC-XXX

---

## 当前状态

当前项目处于架构搭建阶段（已完成），尚无具体的智能合约开发任务。

所有架构搭建任务（LC-001 到 LC-018）已于 2026-01-12 完成。

---

## 待办任务

目前无待办任务。

当有新的智能合约需求时，将在此添加 [TODO] 任务。

---

## 任务格式示例

```markdown
## Phase 1: [Phase 描述]

### [TODO] [SC-001] 任务标题

- **验收标准**：
  - 标准 1
  - 标准 2
  - 标准 3
- **依赖**：[可选] FE-002, BE-001
- **执行步骤**：[可选]
  1. 步骤 1
  2. 步骤 2
- **影响文件**：
  - packages/yt-contracts/src/Token.sol
  - packages/yt-contracts/test/Token.test.ts
- **Notes**：[可选] 备注信息

### [DONE] [SC-002] 完成的任务示例 (2026-01-12)

- **验收标准**：
  - 标准 1 ✓
  - 标准 2 ✓
- **Notes**：完成说明
```

---

## 工作范围

Contract Agent 负责的代码范围：

### ✅ 可以修改的目录

- `apps/contract/` - 智能合约和 Subgraph 项目（主要工作目录）
  - Solidity 智能合约编写
  - 合约测试（Hardhat/Foundry）
  - 合约部署脚本
  - Subgraph 开发（The Graph Protocol）
  - AssemblyScript 映射逻辑
  - GraphQL Schema 定义

### ❌ 禁止修改的目录

- `apps/front-end/` - 前端应用（Frontend Agent 负责）
- `apps/back-end/` - 后端应用（Backend Agent 负责）
- `packages/yt-ui/` - UI 组件库（Frontend Agent 负责）
- `packages/yt-hooks/` - React Hooks（Frontend Agent 负责）
- 不修改根目录构建配置（除非明确授权）

---

## 详细职责说明

请参考：[`.ai/agents/contract-agent.md`](../agents/contract-agent.md)

---

## 依赖管理

如果合约任务依赖前端或后端任务，请在任务的"依赖"字段中明确标注：

```markdown
- **依赖**：FE-007（合约交互界面）, BE-003（链下数据存储）
```

---

## 技术栈建议

### 开发框架
- Hardhat（推荐，TypeScript 支持好）
- Foundry（Rust 工具链，测试性能高）

### 测试工具
- Hardhat Testing Framework
- Foundry Test
- Chai (断言库)

### 类型生成
- TypeChain（从 ABI 生成 TypeScript 类型）
- viem（现代 TypeScript 区块链库）

### 静态分析
- Slither（安全审计工具）
- Mythril（漏洞检测）

### 代码规范
- Solhint（Solidity Linter）
- Prettier + Solidity Plugin

---

## 安全检查清单

每个合约任务完成后，必须通过以下检查：

### 1. 单元测试
- [ ] 测试覆盖率 > 90%
- [ ] 所有测试通过
- [ ] 边界条件测试

### 2. 静态分析
- [ ] Slither 无严重警告
- [ ] Mythril 无漏洞

### 3. Gas 优化
- [ ] 常用函数 Gas 消耗合理
- [ ] 无明显 Gas 浪费

### 4. 代码审查
- [ ] 遵循 Solidity 最佳实践
- [ ] 无重入漏洞
- [ ] 无整数溢出
- [ ] 访问控制正确

---

## 版本历史

- **2026-01-12**: 初始版本，文档重组创建
