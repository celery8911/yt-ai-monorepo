# Web3 面试准备计划

## Context
用户需要用现有的 AI Agent Marketplace 项目准备 Web3 前端面试。项目已有：ERC20代币、Escrow托管、DAO投票、Keeper自动化、合约交互等功能，部署在 Sepolia 测试网。但缺少 L2多链支持、消息签名、Token显示处理、显式Nonce管理等面试高频考点。需要补充功能来覆盖所有面试题。

---

## 面试题覆盖分析

| 面试题 | 现有覆盖 | 需新增 |
|--------|---------|--------|
| Q1: Web3主要工作 | ✅ 合约开发/前端DApp/Keeper | 无 |
| Q2: 主要链/Solana | ❌ 只有Sepolia | 添加L2链配置 |
| Q3: Swap支持L1/L2 | ⚠️ 有简单ETH→CBT | 添加L2链支持 |
| Q4: L2交易长时间无反应 | ❌ 无L2经验 | 添加L2+交易重试逻辑 |
| Q5: 消息签名全流程 | ❌ 无签名功能 | 添加EIP-712签名 |
| Q6: Token不显示 | ❌ 无处理 | 添加wallet_watchAsset |
| Q7: 签名合并等复杂逻辑 | ❌ 无 | 添加批量签名验证 |
| Q8: 多笔交易并发注意事项 | ⚠️ 有approve→hire链式调用 | 添加显式Nonce管理 |

---

## 实施计划

### Phase 1: L2 多链支持（覆盖 Q2, Q3, Q4）

支持 6 条 L2/侧链测试网：

| 链 | 测试网 | Chain ID | viem 导出名 | 类型 |
|---|---|---|---|---|
| Arbitrum | Arbitrum Sepolia | 421614 | `arbitrumSepolia` | Optimistic Rollup |
| Base | Base Sepolia | 84532 | `baseSepolia` | Optimistic Rollup |
| Optimism | OP Sepolia | 11155420 | `optimismSepolia` | Optimistic Rollup |
| zkSync | zkSync Sepolia | 300 | `zkSyncSepoliaTestnet` | ZK Rollup |
| Polygon | Polygon Amoy | 80002 | `polygonAmoy` | 侧链/POS |
| BSC | BSC Testnet | 97 | `bscTestnet` | 侧链/POA |

面试要点：能说清各链的区别 — Optimistic Rollup (Arbitrum/Base/OP) vs ZK Rollup (zkSync) vs 侧链 (Polygon/BSC)，以及各自的交易确认机制和 gas 模型差异。

**1.1 Hardhat 配置添加 L2 网络**
- 文件: `apps/contract/hardhat.config.ts`
- 添加 6 条 L2 测试网网络配置，RPC URL 通过环境变量注入
- zkSync 需要额外注意：编译器配置可能需要 `@matterlabs/hardhat-zksync-solc` 插件（可选，面试提及即可）

**1.2 合约地址注册表扩展**
- 文件: `packages/yt-libs/src/contracts/addresses.ts`
- 为每条链添加合约地址映射（部署后填入实际地址，初始可用占位符）
- 添加所有 chainId 常量
- 新增 `getContracts(chainId)` 动态地址解析函数
- 新增 `getSupportedChains()` 返回所有支持链的信息列表

**1.3 前端钱包配置**
- 文件: `packages/yt-hooks/src/hooks/wallet/config.ts`
- 从 `viem/chains` 导入所有 6 条 L2 测试网链
- 为每条链配置 transport（公共 RPC 或自定义 RPC URL）
- 注意：zkSync 和 BSC 的 transport 可能需要自定义 RPC 端点

**1.4 Web3Provider 更新**
- 文件: `apps/front-end/src/components/Web3Provider.tsx`
- chains 数组添加所有 L2 链：`[sepolia, arbitrumSepolia, baseSepolia, optimismSepolia, zkSyncSepoliaTestnet, polygonAmoy, bscTestnet]`

**1.5 合约 hooks 动态化**
- 文件: `apps/front-end/src/hooks/contracts/useCBT.ts`, `useAgentHiring.ts`, `useDisputeDAO.ts`
- 将硬编码的 `CONTRACTS.sepolia.XXX` 替换为 `getContracts(chainId).XXX`
- 添加 `useChainId()` 获取当前链，自动解析对应合约地址

**1.6 L2 交易加速/重试逻辑**
- 新文件: `apps/front-end/src/hooks/useTransactionRetry.ts`
- 监控交易状态，超时后提示用户加速（提高 gas）或重新发送
- 针对不同链设置不同的超时阈值（Optimistic Rollup 较长，zkSync 较快）
- 面试要点（Q4 回答素材）：
  - Optimistic Rollup 的交易延迟来源：sequencer 排队 → batch 提交到 L1 → 7天挑战期（withdrawal）
  - 解决方案：检查 sequencer 状态、用 `eth_getTransactionReceipt` 轮询、提高 gas tip、使用加速RPC
  - zkSync 的 ZK proof 生成耗时但最终确认更快
  - BSC/Polygon 作为侧链，确认通常很快但可能因网络拥堵延迟

---

### Phase 2: 签名功能（覆盖 Q5, Q7）— 不侵入现有业务

采用三个真实生产场景的签名模式，全部增量添加，现有合约和业务逻辑零改动。

**2.1 SIWE 登录签名（Sign-In with Ethereum）— 覆盖 Q5 个人签名流程**
- 前端 hook: `apps/front-end/src/hooks/useSIWE.ts` — 新建
  - 调用 wagmi `useSignMessage` 签名后端返回的 nonce
  - 签名消息格式遵循 EIP-4361 SIWE 标准
  - 签名成功后发送到后端验证，获取 JWT
- 后端接口: `apps/back-end/src/auth/` — 新增 SIWE 验证模块
  - `GET /auth/nonce` — 生成随机 nonce 并存 session
  - `POST /auth/siwe` — 接收签名，用 `ethers.verifyMessage()` 恢复地址，比对后发放 JWT
- 前端 UI: 在 Header 连接钱包后显示 "验证签名" 按钮
- 面试要点（Q5 完整流程）：
  1. 前端请求 nonce → 2. 构建 EIP-4361 消息 → 3. `personal_sign` 调用钱包签名
  4. MetaMask 弹窗展示消息 → 5. 用户确认 → 6. 私钥对 `\x19Ethereum Signed Message:\n` + message 做 keccak256
  7. ECDSA 签名得到 (r, s, v) → 8. 发送到后端 → 9. `ecrecover` 恢复地址 → 10. 比对验证

**2.2 EIP-712 签名独立演示 — 覆盖 Q5 结构化签名 + Q7 签名合并**
- 新文件: `apps/contract/contracts/SignatureVerifier.sol`
  - 独立的签名验证合约，不调用任何现有合约
  - 继承 OpenZeppelin `EIP712`
  - 定义 `Quote` 结构体：`{ agentId, owner, price, nonce, deadline }`
  - `verifyQuote(quote, signature) → bool`: 纯验证，不做任何状态修改
  - `verifyBatchQuotes(quotes[], signatures[]) → bool[]`: 批量验证（覆盖 Q7）
  - 使用 `ECDSA.recover` + `_hashTypedDataV4`
- 前端 hook: `apps/front-end/src/hooks/contracts/useSignTypedDemo.ts` — 新建
  - 使用 wagmi `useSignTypedData`
  - 定义 EIP-712 domain（name, version, chainId, verifyingContract）和 types
  - `signQuote(params)`: 构建 typed data → 钱包签名
  - `verifyOnChain(quote, signature)`: 调用合约验证
- 前端页面: `apps/front-end/src/app/signature-demo/page.tsx` — 新建
  - 签名演示页：填写报价参数 → 签名 → 显示 r,s,v 分解 → 链上验证 → 显示结果
  - 批量签名演示：收集多个签名 → 一次性链上批量验证
- 面试要点（Q5 EIP-712 流程）：
  domain separator → structHash(typeHash + encodedData) → digest = keccak256(0x1901 + domainSeparator + structHash) → ecrecover

**2.3 链下 Agent 报价签名 — 覆盖 Q7 复杂签名业务逻辑**
- 前端 hook: `apps/front-end/src/hooks/useAgentQuote.ts` — 新建
  - Agent Owner 签名报价（EIP-712 typed data）
  - 签名包含：agentId, price, validUntil, terms
  - 签名后提交给后端存储（不上链）
- 后端接口: `apps/back-end/src/quote/` — 新增报价模块
  - `POST /quote` — 存储签名报价，后端用 ethers.verifyTypedData() 验证签名有效性
  - `GET /quote/:agentId` — 查询某 agent 的有效报价
- 前端 UI: Agent 详情页增加 "签名报价" / "查看报价" 区域
- 面试要点（Q7 签名合并场景）：
  - 多个 Agent 各自签名报价 → Employer 选择多个 → 前端收集多个签名 → 可一次性提交验证
  - 类似 OpenSea Seaport 的挂单模式：卖家签名不花 gas，买家成交时上链

**2.4 re-export wagmi 签名 hooks**
- 文件: `packages/yt-hooks/src/index.ts`
- 导出 `useSignTypedData`, `useSignMessage`

---

### Phase 3: Token 显示处理（覆盖 Q6）

**3.1 添加 Token 到钱包工具函数**
- 新文件: `apps/front-end/src/utils/addTokenToWallet.ts`
- 调用 `wallet_watchAsset` EIP-747 方法
- 参数：address, symbol, decimals, image

**3.2 Wallet 页面集成**
- 文件: `apps/front-end/src/app/wallet/page.tsx`
- CBT 余额旁添加 "添加到钱包" 按钮
- 购买 CBT 成功后自动提示添加
- 面试要点：ERC20 是合约余额，钱包需要知道合约地址才能显示；`wallet_watchAsset` 是标准方案

---

### Phase 4: 显式 Nonce 管理（覆盖 Q8）

**4.1 交易队列 hook**
- 新文件: `apps/front-end/src/hooks/useTransactionQueue.ts`
- 使用 `getTransactionCount({ blockTag: 'pending' })` 获取 pending nonce
- 实现顺序执行队列：每笔 tx 指定 nonce，等确认后发下一笔
- 处理 nonce 冲突：失败时重置 nonce 重试

**4.2 重构 approve→hire 流程**
- 文件: `apps/front-end/src/app/agent/[id]/page.tsx`
- 用交易队列替代 useEffect 链式调用
- 显式指定 nonce：approve 用 `currentNonce`，hire 用 `currentNonce + 1`
- 面试要点：同地址并发交易共享 nonce 空间、nonce 冲突只有一笔成功、gas price 影响打包顺序

---

### Phase 5: 钱包功能增强（覆盖钱包高频面试题）

Web3 前端面试中钱包相关是最高频考点。当前项目钱包实现较基础（只用了 wagmi 的 `useAccount` + `useConnect` + `useDisconnect`），以下补充覆盖常考题目：

#### 常考钱包面试题 & 对应功能

| 面试题 | 现有覆盖 | 需新增 |
|--------|---------|--------|
| W1: 钱包连接流程/EIP-1193 Provider 原理 | ⚠️ 用了wagmi但没暴露底层 | 添加原生 Provider 连接示例 |
| W2: 用户切换账户/链时如何处理 | ⚠️ wagmi自动处理,无显式监听 | 添加显式事件监听+UI提示 |
| W3: 如何添加自定义网络到钱包 | ❌ 无 | 添加 wallet_addEthereumChain |
| W4: 钱包连接状态持久化/自动重连 | ❌ 刷新后断开 | 添加 reconnect 逻辑 |
| W5: 多钱包支持(MetaMask/WalletConnect/Coinbase) | ❌ 只用第一个connector | 添加钱包选择UI |
| W6: Token 授权管理(approve/allowance) | ⚠️ 有approve但无管理UI | 添加授权查看+撤销功能 |
| W7: ENS 域名解析 | ❌ 无 | 添加 ENS 解析显示 |
| W8: 交易 Gas 估算和展示 | ❌ 用固定gas limit | 添加动态gas估算 |
| W9: 如何防范钓鱼/授权安全 | ❌ 无 | 添加授权金额上限提示 |

**5.1 EIP-1193 Provider 底层连接示例**
- 新文件: `apps/front-end/src/hooks/useNativeProvider.ts`
- 直接使用 `window.ethereum` 实现连接，不依赖 wagmi
- 实现 `eth_requestAccounts`、`eth_chainId`、`personal_sign` 三个核心调用
- 监听 `accountsChanged`、`chainChanged`、`disconnect` 事件
- 面试要点：EIP-1193 定义了 `request({ method, params })` 统一接口；wagmi/ethers.js 都是对它的封装
- 注意：此 hook 仅作面试展示用，实际业务仍用 wagmi

**5.2 账户/链切换事件处理增强**
- 文件: `packages/yt-hooks/src/hooks/wallet/useWallet.ts`
- 添加 `onAccountChanged` 和 `onChainChanged` 回调参数
- 使用 wagmi 的 `useAccountEffect` 监听账户变化
- 切换账户时：清除旧用户状态、重新加载余额、提示用户
- 切换链时：检查是否为支持的链，不支持则弹出提示切换
- 面试要点：`accountsChanged` 可能返回空数组（断开连接）；`chainChanged` 返回 hex chainId

**5.3 添加自定义网络到钱包 (wallet_addEthereumChain)**
- 新文件: `apps/front-end/src/utils/addChainToWallet.ts`
- 实现 `wallet_addEthereumChain` 调用，当 `wallet_switchEthereumChain` 返回 4902 错误时自动添加
- 定义各 L2 链的完整参数：chainId, chainName, nativeCurrency, rpcUrls, blockExplorerUrls
- 文件: `apps/front-end/src/components/Header.tsx` — 链切换失败时自动触发添加网络
- 面试要点：先 switch，catch 4902 错误再 add；添加后需要再次 switch

**5.4 钱包连接持久化与自动重连**
- 文件: `packages/yt-hooks/src/hooks/wallet/config.ts`
- wagmi config 添加 `storage: createStorage({ storage: localStorage })` 持久化连接状态
- 文件: `packages/yt-hooks/src/hooks/wallet/useWallet.ts`
- 添加 `useReconnect()` hook，组件 mount 时自动尝试重连上次的 connector
- 面试要点：wagmi 内置 `reconnect` 能力，需要配置 storage；localStorage 存储 connector ID 和 chainId

**5.5 启用 RainbowKit（替代手写钱包选择 UI）**
- 项目已安装 `@rainbow-me/rainbowkit@^2.2.0`，目前 `enableRainbowKit: false`
- 文件: `apps/front-end/src/components/Web3Provider.tsx` — 设置 `enableRainbowKit: true`
- 文件: `packages/yt-hooks/src/hooks/wallet/provider.tsx` — 确认 RainbowKitProvider 包裹正确
- 文件: `apps/front-end/src/components/Header.tsx` — 替换自定义连接按钮为 RainbowKit 的 `<ConnectButton />`
- RainbowKit 内置功能（无需手写）：多钱包选择弹窗（MetaMask/WalletConnect/Coinbase等）、ENS 名称+头像显示、链切换 UI、余额展示
- 可自定义 `<ConnectButton.Custom>` 实现项目风格的按钮外观
- 面试要点：RainbowKit 是基于 wagmi 的 UI 层；wagmi connector 抽象层统一了不同钱包接口；WalletConnect v2 使用 relay protocol；RainbowKit vs ConnectKit vs AppKit(Web3Modal) 的选型考量

**5.6 Token 授权管理（查看 + 撤销）**
- 新文件: `apps/front-end/src/hooks/useTokenAllowance.ts`
- 查询当前地址对各合约的 CBT allowance：`useReadContract` 调用 `allowance(owner, spender)`
- 批量查询对 AgentHiring、Escrow、DisputeDAO 的授权额度
- 文件: `apps/front-end/src/app/wallet/page.tsx`
- 添加 "授权管理" 区域，显示各合约的已授权额度
- "撤销授权" 按钮：调用 `approve(spender, 0)` 将授权归零
- "安全授权" 按钮：只授权本次所需金额而非 MaxUint256
- 面试要点（W9 安全）：无限授权 `approve(spender, MaxUint256)` 的风险；合约被攻击后可以转走所有已授权的 token；最佳实践是按需授权

**5.7 ENS 域名解析（RainbowKit 已内置，额外在业务页面使用）**
- RainbowKit 的 ConnectButton 已自动显示 ENS 名称和头像
- 文件: `apps/front-end/src/app/wallet/page.tsx` — 在钱包详情页也展示 ENS 信息
- 使用 wagmi 的 `useEnsName({ address })` 和 `useEnsAvatar({ name })`
- 面试要点：ENS 解析调用 mainnet 的 ENS 合约，即使当前在测试网也需要 mainnet RPC；reverse resolution 需要用户主动设置

**5.8 动态 Gas 估算**
- 新文件: `apps/front-end/src/hooks/useGasEstimate.ts`
- 使用 viem 的 `estimateContractGas` 在交易前估算 gas
- 使用 `estimateFeesPerGas` 获取当前 gas price（支持 EIP-1559 的 maxFeePerGas + maxPriorityFeePerGas）
- 计算预估手续费（ETH），在交易确认前展示给用户
- 替换 useDisputeDAO 中的固定 `gas: 500000n` 为动态估算值
- 面试要点：EIP-1559 引入 baseFee + priorityFee 模型；L2 的 gas 计算还需加上 L1 data fee

---

## 关键文件清单

| 文件 | 操作 |
|------|------|
| **Phase 1: L2 多链** | |
| `apps/contract/hardhat.config.ts` | 修改 - 添加6条L2网络 |
| `packages/yt-libs/src/contracts/addresses.ts` | 修改 - 多链地址+getContracts() |
| `packages/yt-hooks/src/hooks/wallet/config.ts` | 修改 - L2链+多connector配置 |
| `apps/front-end/src/components/Web3Provider.tsx` | 修改 - L2链 |
| `apps/front-end/src/hooks/contracts/useCBT.ts` | 修改 - 动态地址 |
| `apps/front-end/src/hooks/contracts/useAgentHiring.ts` | 修改 - 动态地址 |
| `apps/front-end/src/hooks/contracts/useDisputeDAO.ts` | 修改 - 动态地址 |
| `apps/front-end/src/hooks/useTransactionRetry.ts` | 新建 - L2交易重试 |
| **Phase 2: 签名功能（增量，不侵入现有业务）** | |
| `apps/front-end/src/hooks/useSIWE.ts` | 新建 - SIWE登录签名 |
| `apps/back-end/src/auth/` | 新建 - SIWE后端验证模块 |
| `apps/contract/contracts/SignatureVerifier.sol` | 新建 - EIP-712签名验证合约（独立） |
| `apps/front-end/src/hooks/contracts/useSignTypedDemo.ts` | 新建 - EIP-712演示hook |
| `apps/front-end/src/app/signature-demo/page.tsx` | 新建 - 签名演示页面 |
| `apps/front-end/src/hooks/useAgentQuote.ts` | 新建 - 链下报价签名 |
| `apps/back-end/src/quote/` | 新建 - 报价后端模块 |
| `packages/yt-hooks/src/index.ts` | 修改 - 导出签名hooks |
| **Phase 3: Token 显示** | |
| `apps/front-end/src/utils/addTokenToWallet.ts` | 新建 - wallet_watchAsset |
| `apps/front-end/src/app/wallet/page.tsx` | 修改 - 添加Token按钮+授权管理 |
| **Phase 4: Nonce 管理** | |
| `apps/front-end/src/hooks/useTransactionQueue.ts` | 新建 - Nonce管理队列 |
| `apps/front-end/src/app/agent/[id]/page.tsx` | 修改 - 重构approve→hire |
| **Phase 5: 钱包增强** | |
| `apps/front-end/src/hooks/useNativeProvider.ts` | 新建 - EIP-1193原生连接示例 |
| `packages/yt-hooks/src/hooks/wallet/useWallet.ts` | 修改 - 事件监听+自动重连 |
| `packages/yt-hooks/src/hooks/wallet/provider.tsx` | 修改 - 启用RainbowKit |
| `apps/front-end/src/utils/addChainToWallet.ts` | 新建 - 添加自定义网络 |
| `apps/front-end/src/components/Header.tsx` | 修改 - ENS显示+链切换增强 |
| `apps/front-end/src/hooks/useTokenAllowance.ts` | 新建 - 授权查询+撤销 |
| `apps/front-end/src/hooks/useGasEstimate.ts` | 新建 - 动态Gas估算 |

---

## 验证方式

1. **L2 支持**: Header 链切换下拉能看到所有 7 条链；切换到未添加的链时自动弹出 wallet_addEthereumChain
2. **SIWE 登录**: 连接钱包后点击"验证签名"，MetaMask 弹出 personal_sign，签名后获取 JWT
3. **EIP-712 签名**: 访问 `/signature-demo`，签名报价数据 → 显示 r,s,v → 链上验证通过
4. **链下报价**: Agent 详情页签名报价（不花 gas），报价存储在后端可查询
3. **Token 显示**: Wallet 页面点击"添加到钱包"按钮，MetaMask 弹出添加 CBT 确认
4. **Nonce 管理**: Agent 页面 hire 流程中，approve 和 hire 两笔交易顺序执行，控制台可见 nonce 分配日志
5. **合约测试**: `npx hardhat test` 通过 OrderVerifier 的签名验证测试
6. **钱包选择**: 点击 RainbowKit ConnectButton 弹出选择弹窗，列出 MetaMask/WalletConnect/Coinbase Wallet
7. **自动重连**: 刷新页面后钱包自动重连，无需手动操作
8. **ENS 显示**: Header 中已连接地址优先显示 ENS 名称
9. **授权管理**: Wallet 页面显示各合约的 CBT 授权额度，可一键撤销
10. **Gas 估算**: 交易确认前显示预估 gas 费用

---

## Solana 相关（Q2 口头准备，无需代码）

面试回答策略："项目以 EVM 链为主，未直接使用 Solana。了解 Solana 的差异：账户模型 vs EVM 的合约模型、SPL Token vs ERC20、Anchor 框架 vs Hardhat、Phantom 钱包 vs MetaMask、并行执行模型。"
