"use client";
import { useAccount } from "@/hooks/web3";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader } from "@yt/ui";
import { useSignTypedDemo } from "@/hooks/contracts/useSignTypedDemo";
import { useSIWE } from "@/hooks/useSIWE";
import { parseEther } from "viem";

const SignatureDemoContent = () => {
	const { address, isConnected } = useAccount();

	// SIWE 登录签名
	const siwe = useSIWE();

	// EIP-712 签名
	const signTyped = useSignTypedDemo();

	// 表单状态
	const [agentId, setAgentId] = useState("agent-001");
	const [priceEth, setPriceEth] = useState("0.1");

	const [quotesList, setQuotesList] = useState<any[]>([]);

	const handleSignQuote = async () => {
		const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1小时后过期
		const signed = await signTyped.signQuote({
			agentId,
			price: parseEther(priceEth),
			nonce: BigInt(quotesList.length),
			deadline,
		});
		if (signed) {
			setQuotesList((prev) => [...prev, signed]);
		}
	};

	const handleVerifyBatch = async () => {
		if (quotesList.length > 0) {
			await signTyped.verifyBatchOnChain(quotesList);
		}
	};

	const handleVerifyOnChain = async () => {
		if (signTyped.signedQuote) {
			await signTyped.verifyOnChain(signTyped.signedQuote);
		}
	};

	const handleReset = () => {
		signTyped.reset();
		setQuotesList([]);
	};

	if (!isConnected) {
		return (
			<div className="container mx-auto max-w-4xl py-10">
				<h1 className="mb-6 text-2xl font-bold">签名演示</h1>
				<Card>
					<CardContent className="py-10 text-center text-gray-400">
						请先连接钱包
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto max-w-4xl space-y-6 py-10">
			<h1 className="text-2xl font-bold">签名演示 (面试准备)</h1>
			<p className="text-sm text-gray-400">当前地址: {address}</p>

			{/* Section 1: SIWE 登录签名 (personal_sign) */}
			<Card>
				<CardHeader>
					<h2 className="text-lg font-semibold">
						1. SIWE 登录签名 (EIP-4361 / personal_sign)
					</h2>
					<p className="text-sm text-gray-400">
						使用 personal_sign 签名一段消息，证明地址所有权。用于登录验证。
					</p>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center gap-4">
						<Button
							onClick={siwe.signIn}
							disabled={siwe.isSigningIn || siwe.isVerified}
						>
							{siwe.isSigningIn
								? "签名中..."
								: siwe.isVerified
									? "已验证"
									: "签名登录"}
						</Button>
						{siwe.isVerified && (
							<Button variant="outline" onClick={siwe.signOut}>
								退出
							</Button>
						)}
					</div>

					{siwe.isVerified && (
						<div className="rounded-lg border border-green-800 bg-green-950/30 p-4">
							<p className="text-sm text-green-400">
								签名验证成功 — 已证明你是 {address?.slice(0, 10)}... 的持有者
							</p>
						</div>
					)}
					{siwe.error && <p className="text-sm text-red-400">{siwe.error}</p>}

					<details className="text-xs text-gray-500">
						<summary className="cursor-pointer">
							面试要点: personal_sign 流程
						</summary>
						<pre className="mt-2 overflow-x-auto rounded bg-gray-900 p-3">
							{`1. 前端构建 EIP-4361 消息 (含 domain, address, nonce, chainId)
2. 调用 personal_sign(message, address)
3. MetaMask 弹窗展示消息文本
4. 用户确认后，钱包计算:
   hash = keccak256("\\x19Ethereum Signed Message:\\n" + len + message)
5. 用私钥 ECDSA 签名 hash → (r, s, v) = 65 bytes
6. 后端用 ecrecover(hash, v, r, s) 恢复地址
7. 比对恢复的地址 == 声称的地址 → 验证通过`}
						</pre>
					</details>
				</CardContent>
			</Card>

			{/* Section 2: EIP-712 结构化签名 (signTypedData) */}
			<Card>
				<CardHeader>
					<h2 className="text-lg font-semibold">
						2. EIP-712 结构化签名 (signTypedData_v4)
					</h2>
					<p className="text-sm text-gray-400">
						使用 EIP-712 签名结构化数据。MetaMask 会展示可读的数据结构。
					</p>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* 输入表单 */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="mb-1 block text-sm text-gray-400">
								Agent ID
							</label>
							<input
								type="text"
								value={agentId}
								onChange={(e) => setAgentId(e.target.value)}
								className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
							/>
						</div>
						<div>
							<label className="mb-1 block text-sm text-gray-400">
								价格 (ETH)
							</label>
							<input
								type="text"
								value={priceEth}
								onChange={(e) => setPriceEth(e.target.value)}
								className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
							/>
						</div>
					</div>

					<div className="flex gap-4">
						<Button onClick={handleSignQuote} disabled={signTyped.isSigning}>
							{signTyped.isSigning ? "签名中..." : "签名报价"}
						</Button>
						{signTyped.signedQuote && (
							<Button
								variant="outline"
								onClick={handleVerifyOnChain}
								disabled={signTyped.isVerifying}
							>
								{signTyped.isVerifying ? "验证中..." : "链上验证"}
							</Button>
						)}
						{quotesList.length > 1 && (
							<Button
								variant="secondary"
								onClick={handleVerifyBatch}
								disabled={signTyped.isVerifying}
							>
								{signTyped.isVerifying
									? "批量验证中..."
									: `批量验证 (${quotesList.length})`}
							</Button>
						)}
						{quotesList.length > 0 && (
							<Button variant="outline" onClick={handleReset}>
								重置
							</Button>
						)}
					</div>

					{signTyped.error && (
						<p className="text-sm text-red-400">{signTyped.error}</p>
					)}

					{/* 批量签名列表 */}
					{quotesList.length > 0 && (
						<div className="mt-4 space-y-2">
							<h3 className="text-sm font-medium">
								待验证签名列表 ({quotesList.length})
							</h3>
							<div className="max-h-40 overflow-y-auto space-y-2 rounded bg-gray-900 p-2">
								{quotesList.map((q, i) => (
									<div
										key={q.signature}
										className="flex items-center justify-between text-xs border-b border-gray-800 pb-1"
									>
										<span className="text-gray-400">
											#{i} {q.quote.agentId} - {q.quote.price.toString()} wei
										</span>
										{signTyped.batchResults &&
											signTyped.batchResults[i] !== undefined && (
												<span
													className={
														signTyped.batchResults[i]
															? "text-green-400"
															: "text-red-400"
													}
												>
													{signTyped.batchResults[i] ? "有效" : "无效"}
												</span>
											)}
									</div>
								))}
							</div>
						</div>
					)}

					{/* 签名结果展示 */}
					{signTyped.signedQuote && (
						<div className="space-y-3 rounded-lg border border-gray-700 p-4">
							<h3 className="text-sm font-medium">签名结果</h3>

							<div>
								<p className="text-xs text-gray-400">
									完整签名 (65 bytes hex):
								</p>
								<p className="mt-1 break-all rounded bg-gray-900 p-2 font-mono text-xs">
									{signTyped.signedQuote.signature}
								</p>
							</div>

							<div className="grid grid-cols-3 gap-3">
								<div>
									<p className="text-xs text-gray-400">r (32 bytes):</p>
									<p className="mt-1 break-all rounded bg-gray-900 p-2 font-mono text-xs">
										{signTyped.signedQuote.signatureComponents.r}
									</p>
								</div>
								<div>
									<p className="text-xs text-gray-400">s (32 bytes):</p>
									<p className="mt-1 break-all rounded bg-gray-900 p-2 font-mono text-xs">
										{signTyped.signedQuote.signatureComponents.s}
									</p>
								</div>
								<div>
									<p className="text-xs text-gray-400">v (1 byte):</p>
									<p className="mt-1 rounded bg-gray-900 p-2 font-mono text-xs">
										{signTyped.signedQuote.signatureComponents.v}
									</p>
								</div>
							</div>

							{signTyped.verifyResult !== null && (
								<div
									className={`rounded p-3 text-sm ${
										signTyped.verifyResult
											? "border border-green-800 bg-green-950/30 text-green-400"
											: "border border-red-800 bg-red-950/30 text-red-400"
									}`}
								>
									链上验证结果: {signTyped.verifyResult ? "有效" : "无效"}
								</div>
							)}
						</div>
					)}

					<details className="text-xs text-gray-500">
						<summary className="cursor-pointer">
							面试要点: EIP-712 签名流程
						</summary>
						<pre className="mt-2 overflow-x-auto rounded bg-gray-900 p-3">
							{`EIP-712 签名计算过程:

1. Domain Separator (绑定合约和链):
   domainSeparator = keccak256(encode(
     typeHash("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
     keccak256("${signTyped.eip712Info.domainName}"),
     keccak256("${signTyped.eip712Info.domainVersion}"),
     chainId,
     verifyingContract
   ))

2. Struct Hash (编码业务数据):
   structHash = keccak256(encode(
     typeHash("Quote(string agentId,address owner,uint256 price,uint256 nonce,uint256 deadline)"),
     keccak256(agentId),
     owner,
     price,
     nonce,
     deadline
   ))

3. Final Digest:
   digest = keccak256("\\x19\\x01" || domainSeparator || structHash)

4. 签名: ECDSA.sign(digest, privateKey) → (r, s, v)

5. 验证: ECDSA.recover(digest, r, s, v) → address == expected`}
						</pre>
					</details>
				</CardContent>
			</Card>
		</div>
	);
};

export default SignatureDemoContent;
