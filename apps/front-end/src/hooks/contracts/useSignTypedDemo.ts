"use client";

/**
 * useSignTypedDemo Hook - EIP-712 结构化签名演示
 *
 * 面试要点 (Q5 EIP-712 + Q7 批量签名):
 * - EIP-712 定义了结构化数据的签名标准，MetaMask 会展示人类可读的签名内容
 * - domain separator 绑定了合约地址和链 ID，防止跨链/跨合约重放
 * - structHash 编码了具体的业务数据
 * - digest = keccak256(0x1901 || domainSeparator || structHash)
 */

import { useState, useCallback } from "react";
import {
	useSignTypedData,
	useChainId,
	useWallet,
	usePublicClient,
} from "@yt/hooks";

/** EIP-712 Domain 配置 */
const DOMAIN_NAME = "YT Agent Market";
const DOMAIN_VERSION = "1";

/** EIP-712 类型定义 */
const QUOTE_TYPES = {
	Quote: [
		{ name: "agentId", type: "string" },
		{ name: "owner", type: "address" },
		{ name: "price", type: "uint256" },
		{ name: "nonce", type: "uint256" },
		{ name: "deadline", type: "uint256" },
	],
} as const;

export type QuoteParams = {
	agentId: string;
	price: bigint;
	nonce: bigint;
	deadline: bigint;
};

export type SignedQuote = {
	quote: {
		agentId: string;
		owner: `0x${string}`;
		price: bigint;
		nonce: bigint;
		deadline: bigint;
	};
	signature: `0x${string}`;
	/** 签名分解 (面试展示用) */
	signatureComponents: {
		r: string;
		s: string;
		v: number;
	};
};

export function useSignTypedDemo(verifierAddress?: `0x${string}`) {
	const { address } = useWallet();
	const chainId = useChainId();
	const { signTypedDataAsync } = useSignTypedData();
	const publicClient = usePublicClient();

	const [signedQuote, setSignedQuote] = useState<SignedQuote | null>(null);
	const [isSigning, setIsSigning] = useState(false);
	const [isVerifying, setIsVerifying] = useState(false);
	const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
	const [error, setError] = useState<string | null>(null);

	/**
	 * 签名报价数据 (EIP-712 signTypedData)
	 *
	 * MetaMask 会展示结构化数据让用户确认:
	 * - Domain: YT Agent Market v1, chainId, verifyingContract
	 * - Quote: agentId, owner, price, nonce, deadline
	 */
	const signQuote = useCallback(
		async (params: QuoteParams) => {
			if (!address) {
				setError("请先连接钱包");
				return null;
			}

			setIsSigning(true);
			setError(null);
			setVerifyResult(null);

			try {
				const quote = {
					agentId: params.agentId,
					owner: address,
					price: params.price,
					nonce: params.nonce,
					deadline: params.deadline,
				};

				// 构建 EIP-712 签名请求
				const signature = await signTypedDataAsync({
					domain: {
						name: DOMAIN_NAME,
						version: DOMAIN_VERSION,
						chainId,
						verifyingContract: verifierAddress,
					},
					types: QUOTE_TYPES,
					primaryType: "Quote",
					message: quote,
				});

				// 分解签名为 r, s, v (面试展示用)
				const r = signature.slice(0, 66);
				const s = `0x${signature.slice(66, 130)}`;
				const v = Number.parseInt(signature.slice(130, 132), 16);

				const result: SignedQuote = {
					quote,
					signature,
					signatureComponents: { r, s, v },
				};

				setSignedQuote(result);
				setIsSigning(false);
				return result;
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : "签名失败";
				setError(
					errorMessage.includes("rejected")
						? "用户拒绝了签名请求"
						: errorMessage,
				);
				setIsSigning(false);
				return null;
			}
		},
		[address, chainId, signTypedDataAsync, verifierAddress],
	);

	/**
	 * 链上验证签名
	 *
	 * 调用 SignatureVerifier.verifyQuote(quote, signature) 合约方法
	 */
	const verifyOnChain = useCallback(
		async (signed: SignedQuote) => {
			if (!publicClient || !verifierAddress) {
				setError("合约地址未配置或客户端不可用");
				return false;
			}

			setIsVerifying(true);
			setError(null);

			try {
				const result = await publicClient.readContract({
					address: verifierAddress,
					abi: [
						{
							type: "function",
							name: "verifyQuote",
							inputs: [
								{
									name: "quote",
									type: "tuple",
									components: [
										{ name: "agentId", type: "string" },
										{ name: "owner", type: "address" },
										{ name: "price", type: "uint256" },
										{ name: "nonce", type: "uint256" },
										{ name: "deadline", type: "uint256" },
									],
								},
								{ name: "signature", type: "bytes" },
							],
							outputs: [{ name: "valid", type: "bool" }],
							stateMutability: "view",
						},
					],
					functionName: "verifyQuote",
					args: [signed.quote, signed.signature],
				});

				setVerifyResult(result as boolean);
				setIsVerifying(false);
				return result as boolean;
			} catch (err) {
				setError(err instanceof Error ? err.message : "链上验证失败");
				setIsVerifying(false);
				return false;
			}
		},
		[publicClient, verifierAddress],
	);

	/** 重置状态 */
	const reset = useCallback(() => {
		setSignedQuote(null);
		setVerifyResult(null);
		setError(null);
	}, []);

	return {
		signQuote,
		verifyOnChain,
		reset,
		signedQuote,
		isSigning,
		isVerifying,
		verifyResult,
		error,
		/** 导出类型定义和 domain 信息 (面试展示用) */
		eip712Info: {
			domainName: DOMAIN_NAME,
			domainVersion: DOMAIN_VERSION,
			types: QUOTE_TYPES,
		},
	};
}
