# AgentHiring-Escrow-DisputeDAO 集成完成总结

## 已完成的工作

### 1. 智能合约修改 ✅

#### AgentHiring.sol
- ✅ 添加 `IEscrow` 接口
- ✅ 构造函数添加 `escrow` 参数
- ✅ `hire()` 函数集成 Escrow：
  - 生成唯一 escrowId: `keccak256("engagement" + engagementId)`
  - 将资金托管到 Escrow 合约
  - 服务费直接转给 Treasury
- ✅ 删除资金管理函数，委托给 Escrow
- ✅ 添加 `updateEngagementStatus()` 供 keeper 同步状态
- ✅ 添加 `EngagementStatus.NONE` 枚举值

#### 部署脚本
- ✅ `escrowServiceFeeBps = 0` (Escrow 不收费)
- ✅ `serviceFeeBps = 1000` (AgentHiring 收取 10% 服务费)
- ✅ AgentHiring 构造函数传入 Escrow 地址
- ✅ 合约编译成功

### 2. Subgraph 修改 ✅

#### Schema (schema.graphql)
- ✅ Engagement 添加 `escrowId: Bytes` 字段
- ✅ 移除了复杂的双向关联，改为单向关联

#### Mappings
- ✅ **agent-hiring.ts**:
  - 计算 escrowId 并保存到 Engagement
  - 使用 `Bytes.fromUint8Array()` 正确转换类型
- ✅ **escrow.ts**:
  - 保持原有逻辑，无需修改
- ✅ 类型生成成功
- ✅ Subgraph 构建成功

### 3. ABI 更新 ✅
- ✅ 复制 AgentHiring.json 到 `subgraph/abis/`
- ✅ 复制 AgentHiring.json 到 `packages/yt-libs/src/contracts/abis/`

## 数据流说明

### 用户雇佣 Agent
```
1. 用户调用 AgentHiring.hire(agentId, agentOwner, jobId, price, type)
   ↓
2. engagementId = 自增 ID (例如: 1)
   escrowId = keccak256("engagement1")
   ↓
3. 收取 price + fee 从用户
   ↓
4. fee → Treasury (直接转账)
   ↓
5. price → Escrow (通过 createEscrow)
   ↓
6. Subgraph 索引:
   - Engagement (id=1, escrowId=0x...)
   - Escrow (id=0x..., status=LOCKED)
```

### 用户发起争议
```
1. 前端从 Subgraph 查询 Escrow 列表 (通过 payer)
   ↓
2. 过滤 status=LOCKED 且 frozen=false 的记录
   ↓
3. 用户选择一个 Escrow
   ↓
4. 调用 DisputeDAO.openDispute(escrow.jobId, reason)
   ↓
5. DisputeDAO 检查 Escrow.statusOf(jobId) == LOCKED ✅
   ↓
6. Escrow.freeze(jobId) → status=FROZEN, frozen=true
```

## 待完成的工作

### 1. 重新部署合约 🔄
```bash
cd apps/contract
pnpm deploy:sepolia
```

### 2. 更新地址配置 🔄
部署后更新以下文件：
- `packages/yt-libs/src/contracts/addresses.ts`
- `apps/contract/subgraph/subgraph.yaml`

### 3. 部署 Subgraph 🔄
```bash
cd apps/contract/subgraph
graph deploy --node <GRAPH_NODE_URL> --ipfs <IPFS_URL> <SUBGRAPH_NAME>
```

### 4. 前端修改 🔄

#### 更新争议创建页面
文件: `apps/front-end/src/app/dao/create/page.tsx`

**需要改动**:
```typescript
// 当前 (错误)
const { data: signedAgentsData } = useQuery({
  queryKey: ["signed-agents", address],
  queryFn: () => fetchSignedAgents(address, { page: 1, limit: 50 }),
});

// 应该改为 (正确)
const { data: escrowsData } = useQuery({
  queryKey: ["escrows-by-payer", address],
  queryFn: () => fetchEscrowsByPayer(address, true), // activeOnly=true
});

// 过滤可争议的 Escrow
const escrows = escrowsData?.escrows.filter(
  (escrow) => escrow.status === "LOCKED" && !escrow.frozen
) ?? [];

// 调用 openDispute 时，jobId 已经是 bytes32
await openDispute(escrow.jobId, reasonCode);
```

#### 更新后端 API 实现
文件: `apps/back-end/src/chain-status/chain-status.service.ts`

已添加 `getEscrowsByPayer()` 方法，后端无需修改。

#### 前端显示优化
由于 Escrow 数据不包含 agentName，可以：
1. 通过 escrow.agent 地址查询 agent 信息
2. 或者在 Subgraph 中添加 engagement 查询以获取完整信息

### 5. 测试流程 🔄

#### 测试步骤
1. **雇佣 Agent**
   ```
   调用 AgentHiring.hire()
   验证: Engagement 和 Escrow 都创建成功
   验证: escrowId 正确关联
   ```

2. **查询 Escrow**
   ```
   GET /api/chain-status/escrow/by-payer?payer=0x...
   验证: 返回 LOCKED 状态的 Escrow
   ```

3. **发起争议**
   ```
   前端选择 Escrow → 调用 DisputeDAO.openDispute(escrow.jobId, reason)
   验证: 交易成功
   验证: Escrow 状态变为 FROZEN
   验证: 后端创建 Dispute 记录
   ```

4. **投票与解决**
   ```
   投票 → Keeper 调用 resolveReady() → 资金分配
   ```

## 关键技术点

### 1. EscrowId 计算
- **Solidity**: `keccak256(abi.encodePacked("engagement", engagementId))`
- **Subgraph**:
  ```typescript
  const prefix = Bytes.fromUTF8("engagement");
  const idBytes = Bytes.fromUTF8(engagementId);
  const combined = new Uint8Array(prefix.length + idBytes.length);
  combined.set(prefix, 0);
  combined.set(idBytes, prefix.length);
  const hash = crypto.keccak256(Bytes.fromUint8Array(combined));
  const escrowId = Bytes.fromUint8Array(hash);
  ```

### 2. 类型转换
- `crypto.keccak256()` 返回 `ByteArray`
- Engagement.escrowId 需要 `Bytes`
- 使用 `Bytes.fromUint8Array()` 转换

### 3. 服务费处理
- AgentHiring 统一收取 10% 服务费
- Escrow 不再收取服务费 (serviceFeeBps=0)
- 避免双重收费

## 文档位置

- [集成架构文档](.ai/docs/agenthiring-escrow-integration.md)
- [当前总结](.ai/docs/integration-summary.md)

## 下一步行动

1. **立即执行**: 修改前端争议创建页面，使用 `fetchEscrowsByPayer` 替代 `fetchSignedAgents`
2. **部署准备**: 准备部署到 Sepolia 测试网
3. **完整测试**: 执行端到端测试流程
