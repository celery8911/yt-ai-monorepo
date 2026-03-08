"use client";

/**
 * useAgentQuote Hook - 链下 Agent 报价签名
 *
 * 类似 OpenSea Seaport 的挂单模式:
 * - Agent Owner 签名报价（不花 gas）
 * - 签名后存储在后端
 * - Employer 可以查看报价，接受时再上链
 *
 * 面试要点 (Q7 签名合并/复杂签名逻辑):
 * - 多个 Agent 各自签名报价 → Employer 选择多个 → 批量验证
 * - 签名是链下行为，不消耗 gas，降低用户门槛
 * - 后端用 ethers.verifyTypedData() 验证签名有效性
 */

import { useState, useCallback } from "react";
import { useSignTypedData, useChainId, useWallet } from "@yt/hooks";

export type AgentQuote = {
	agentId: string;
	price: bigint;
	validUntil: bigint;
	terms: string;
};

export type SignedAgentQuote = {
	quote: AgentQuote & { owner: `0x${string}`; chainId: number };
	signature: `0x${string}`;
	signedAt: string;
};

const QUOTE_TYPES = {
	AgentQuote: [
		{ name: "agentId", type: "string" },
		{ name: "owner", type: "address" },
		{ name: "price", type: "uint256" },
		{ name: "validUntil", type: "uint256" },
		{ name: "terms", type: "string" },
	],
} as const;

export function useAgentQuote() {
	const { address } = useWallet();
	const chainId = useChainId();
	const { signTypedDataAsync } = useSignTypedData();

	const [quotes, setQuotes] = useState<SignedAgentQuote[]>([]);
	const [isSigning, setIsSigning] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/**
	 * Agent Owner 签名报价 (不花 gas)
	 */
	const signQuote = useCallback(
		async (params: AgentQuote) => {
			if (!address) {
				setError("请先连接钱包");
				return null;
			}

			setIsSigning(true);
			setError(null);

			try {
				const signature = await signTypedDataAsync({
					domain: {
						name: "YT Agent Quote",
						version: "1",
						chainId,
					},
					types: QUOTE_TYPES,
					primaryType: "AgentQuote",
					message: {
						agentId: params.agentId,
						owner: address,
						price: params.price,
						validUntil: params.validUntil,
						terms: params.terms,
					},
				});

				const signedQuote: SignedAgentQuote = {
					quote: {
						...params,
						owner: address,
						chainId,
					},
					signature,
					signedAt: new Date().toISOString(),
				};

				setQuotes((prev) => [...prev, signedQuote]);
				setIsSigning(false);
				return signedQuote;
			} catch (err) {
				const msg = err instanceof Error ? err.message : "签名失败";
				setError(msg.includes("rejected") ? "用户拒绝了签名" : msg);
				setIsSigning(false);
				return null;
			}
		},
		[address, chainId, signTypedDataAsync],
	);

	/**
	 * 提交签名报价到后端存储
	 */
	const submitQuote = useCallback(async (signedQuote: SignedAgentQuote) => {
		setIsSubmitting(true);
		setError(null);

		try {
			const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
			const res = await fetch(`${apiBase}/quote`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...signedQuote,
					quote: {
						...signedQuote.quote,
						price: signedQuote.quote.price.toString(),
						validUntil: signedQuote.quote.validUntil.toString(),
					},
				}),
			});

			if (!res.ok) {
				throw new Error(`提交失败: ${res.status}`);
			}

			setIsSubmitting(false);
			return true;
		} catch (err) {
			// 后端不可用时，仍然保留本地签名记录
			setError(err instanceof Error ? err.message : "提交失败");
			setIsSubmitting(false);
			return false;
		}
	}, []);

	/** 清除本地报价记录 */
	const clearQuotes = useCallback(() => {
		setQuotes([]);
		setError(null);
	}, []);

	return {
		signQuote,
		submitQuote,
		clearQuotes,
		quotes,
		isSigning,
		isSubmitting,
		error,
	};
}
