# AgentHiring-Escrow 集成文档

## 架构更改

### 原架构
```
用户 → AgentHiring（直接管理资金）
```

### 新架构
```
用户 → AgentHiring（业务逻辑）→ Escrow（资金托管）→ DisputeDAO（争议处理）
```

## 合约修改

### 1. AgentHiring.sol

#### 新增接口
```solidity
interface IEscrow {
    function createEscrow(bytes32 jobId, address agent, uint256 price) external;
    function statusOf(bytes32 jobId) external view returns (uint8);
}
```

#### 构造函数更新
```solidity
constructor(
    address cbt_,
    address treasury_,
    address escrow_,  // 新增
    address keeper_,
    uint256 serviceFeeBps_,
    uint256 releaseDelay_
)
```

#### hire() 函数核心逻辑
```solidity
function hire(...) {
    // 1. 生成唯一 escrowId
    bytes32 escrowId = keccak256(abi.encodePacked("engagement", engagementId));

    // 2. 收取 price + fee
    cbt.safeTransferFrom(msg.sender, address(this), price);
    cbt.safeTransferFrom(msg.sender, address(treasury), fee);

    // 3. 授权并创建 Escrow
    cbt.approve(address(escrow), price);
    escrow.createEscrow(escrowId, agentOwner, price);

    // 4. 记录 Engagement 元数据
    // ...
}
```

#### 资金管理委托给 Escrow
- ❌ 删除: `approveCompletion()`, `autoRelease()`, `refund()`, `_releasePayment()`
- ✅ 新增: `updateEngagementStatus()` - 供 keeper/owner 同步 Escrow 状态

### 2. 部署参数调整

**deploy.ts**
```typescript
const escrowServiceFeeBps = 0n;  // Escrow 不收费，由 AgentHiring 统一处理
const serviceFeeBps = 1000n;      // AgentHiring 收取 10% 服务费
```

## Subgraph 修改

### Schema 更新

**Engagement 实体**
```graphql
type Engagement @entity(immutable: false) {
  # ... 原有字段
  escrowId: Bytes           # 新增：关联的 Escrow ID
  escrow: Escrow            # 新增：关联的 Escrow 实体
}
```

**Escrow 实体**
```graphql
type Escrow @entity(immutable: false) {
  # ... 原有字段
  engagement: Engagement    # 新增：关联的 Engagement 实体
}
```

### Mapping 更新（待 codegen 后完成）

需要在生成类型后添加：

**agent-hiring.ts**
```typescript
// 计算并保存 escrowId
const encodedData = Bytes.fromUTF8("engagement").concat(
  Bytes.fromUTF8(engagementId)
);
const escrowId = crypto.keccak256(encodedData);
engagement.escrowId = escrowId;
```

**escrow.ts**
```typescript
// 链接到 Engagement
const engagement = Engagement.load(jobIdHex);
if (engagement !== null) {
  escrow.engagement = jobIdHex;
}
```

## 前端修改（待完成）

### 1. 争议创建页面

**apps/front-end/src/app/dao/create/page.tsx**

当前使用：`fetchSignedAgents()` - 获取 AgentHiring Engagements
需要改为：`fetchEscrowsByPayer()` - 获取 Escrow 记录

**原因：** DisputeDAO 合约检查 `escrow.statusOf(jobId)`，必须传入 Escrow 中存在的 jobId。

### 2. API 调用更新

```typescript
// 使用 Escrow 数据
const { data: escrowsData } = useQuery({
  queryKey: ["escrows-by-payer", address],
  queryFn: () => fetchEscrowsByPayer(address, true),
  enabled: Boolean(address),
});

// 过滤 LOCKED 状态的 escrow
const escrows = escrowsData?.escrows.filter(
  (escrow) => escrow.status === "LOCKED" && !escrow.frozen
) ?? [];
```

### 3. openDispute 调用

```typescript
// jobId 已经是 bytes32 格式（从 Escrow 获取）
await openDispute(escrow.jobId, reasonCode);
```

## 部署流程

### 1. 编译合约
```bash
cd apps/contract
pnpm compile
```

### 2. 部署到 Sepolia
```bash
pnpm deploy:sepolia
```

### 3. 更新地址配置
更新以下文件中的合约地址：
- `packages/yt-libs/src/contracts/addresses.ts`
- `apps/contract/subgraph/subgraph.yaml`

### 4. 生成 ABI
```bash
pnpm abi:generate
```

### 5. Subgraph 部署
```bash
cd apps/contract
pnpm codegen        # 生成类型
# 完成 mapping 代码后
pnpm build          # 构建 subgraph
pnpm deploy         # 部署到 Graph Node
```

## 测试流程

### 1. 用户雇佣 Agent
```
用户调用 AgentHiring.hire()
→ 创建 Engagement (ID=1)
→ 生成 escrowId = keccak256("engagement1")
→ 资金托管到 Escrow
→ Subgraph 索引: Engagement ↔ Escrow 关联
```

### 2. 发起争议
```
用户在前端查看自己的 Escrow 列表
→ 选择一个 LOCKED 状态的 Escrow
→ 调用 DisputeDAO.openDispute(escrow.jobId, reason)
→ Escrow 状态变为 FROZEN
```

### 3. 投票与解决
```
投票者调用 DisputeDAO.vote()
→ Keeper 调用 DisputeDAO.resolveReady()
→ 根据投票结果：
  - Employer 胜：Escrow.refundToPayer()
  - Agent 胜：Escrow.releaseToAgent()
```

## 关键点

1. **EscrowId 生成规则**
   - 合约: `keccak256(abi.encodePacked("engagement", engagementId))`
   - Subgraph: 必须使用相同算法计算

2. **服务费处理**
   - AgentHiring 收取并转给 Treasury
   - Escrow 不再收取服务费（serviceFeeBps = 0）

3. **状态同步**
   - Engagement 状态由 keeper 通过 `updateEngagementStatus()` 更新
   - 监听 Escrow 事件进行同步

4. **前端数据源**
   - 争议创建：使用 Escrow 数据（必须）
   - 仪表板展示：可使用 Engagement 数据（带 escrow 关联）

## 下一步

1. ✅ 编译合约
2. ⏳ 运行 `pnpm codegen` 生成 Subgraph 类型
3. ⏳ 完成 Subgraph mapping 代码
4. ⏳ 更新前端使用 Escrow 数据
5. ⏳ 部署测试
