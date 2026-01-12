# Smart Contract Applications

> Contract Agent 的工作目录

## 目录用途

这个目录用于存放所有智能合约项目和 Subgraph。

## 工作范围

- Solidity 智能合约开发
- 合约测试和部署
- Subgraph 开发和维护
- ABI 管理和类型生成
- 链下索引服务

## 技术栈

### 智能合约
- Solidity
- Hardhat / Foundry
- TypeChain
- viem
- OpenZeppelin

### Subgraph
- The Graph Protocol
- AssemblyScript
- GraphQL Schema

## 依赖包

合约应用可以使用以下内部包：
- `@yt/libs` - 通用工具函数库（区块链相关）

## 与其他应用的关系

- 为 `apps/front-end/` 提供智能合约 ABI 和类型定义
- 为 `apps/back-end/` 提供链上事件和 Subgraph 查询接口
- 触发链上事件供后端监听

## 负责人

Contract Agent - 详见 [`.ai/agents/contract-agent.md`](../../.ai/agents/contract-agent.md)

## 任务清单

智能合约相关任务请查看：[`.ai/tasks/task-sc.md`](../../.ai/tasks/task-sc.md)
