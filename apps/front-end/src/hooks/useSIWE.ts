"use client";
import { useChainId, useSignMessage, useWallet } from "@/hooks/web3";
import { API_BASE_PATH } from "@/apis/client";

/**
 * useSIWE Hook - Sign-In with Ethereum (EIP-4361)
 *
 * 使用 personal_sign 签名实现钱包身份验证。
 *
 * 面试要点 (Q5 个人签名全流程)：
 * 1. 前端请求 nonce → 2. 构建 EIP-4361 SIWE 消息
 * 3. 调用 personal_sign → 4. MetaMask 弹窗展示消息 → 5. 用户确认
 * 6. 私钥对 "\x19Ethereum Signed Message:\n" + message 做 keccak256
 * 7. ECDSA 签名得到 (r, s, v) → 8. 发送到后端
 * 9. 后端 ecrecover 恢复地址 → 10. 比对验证，发放 JWT
 */

import { useState, useCallback } from "react";

type SIWEState = {
	isSigningIn: boolean;
	isVerified: boolean;
	token: string | null;
	error: string | null;
};

/** 构建 EIP-4361 SIWE 消息 */
function buildSIWEMessage(params: {
	domain: string;
	address: string;
	statement: string;
	uri: string;
	nonce: string;
	chainId: number;
	issuedAt: string;
}): string {
	return [
		`${params.domain} wants you to sign in with your Ethereum account:`,
		params.address,
		"",
		params.statement,
		"",
		`URI: ${params.uri}`,
		`Version: 1`,
		`Chain ID: ${params.chainId}`,
		`Nonce: ${params.nonce}`,
		`Issued At: ${params.issuedAt}`,
	].join("\n");
}

export function useSIWE() {
	const { address } = useWallet();
	const chainId = useChainId();
	const { signMessageAsync } = useSignMessage();

	const [state, setState] = useState<SIWEState>({
		isSigningIn: false,
		isVerified: false,
		token: null,
		error: null,
	});

	/**
	 * 执行 SIWE 签名登录
	 *
	 * 流程: 获取 nonce → 构建 SIWE 消息 → personal_sign → 发送到后端验证
	 */
	const signIn = useCallback(async () => {
		if (!address) {
			setState((prev) => ({ ...prev, error: "请先连接钱包" }));
			return;
		}

		setState({
			isSigningIn: true,
			isVerified: false,
			token: null,
			error: null,
		});

		try {
			// Step 1: Get nonce from backend
			const nonceRes = await fetch(
				`${API_BASE_PATH}/auth/nonce?address=${address}`,
			);
			if (!nonceRes.ok) throw new Error("获取 nonce 失败");
			const { nonce } = await nonceRes.json();

			// Step 2: Build EIP-4361 SIWE message
			const domain =
				typeof window !== "undefined" ? window.location.host : "localhost";
			const uri =
				typeof window !== "undefined"
					? window.location.origin
					: "http://localhost:3000";
			const issuedAt = new Date().toISOString();

			const message = buildSIWEMessage({
				domain,
				address,
				statement:
					"Sign in to YT Agent Market to verify your wallet ownership.",
				uri,
				nonce,
				chainId,
				issuedAt,
			});

			// Step 3: personal_sign (MetaMask)
			const signature = await signMessageAsync({ message });

			// Step 4: Verify on backend
			const verifyRes = await fetch(`${API_BASE_PATH}/auth/siwe`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message, signature, address }),
			});

			if (!verifyRes.ok) throw new Error("签名验证失败");

			const data = await verifyRes.json();
			setState({
				isSigningIn: false,
				isVerified: true,
				token: data.token || null,
				error: null,
			});
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "登录失败";
			setState({
				isSigningIn: false,
				isVerified: false,
				token: null,
				error: errorMessage.includes("rejected")
					? "用户拒绝了签名请求"
					: errorMessage,
			});
		}
	}, [address, chainId, signMessageAsync]);

	/** 退出登录 */
	const signOut = useCallback(() => {
		setState({
			isSigningIn: false,
			isVerified: false,
			token: null,
			error: null,
		});
	}, []);

	return {
		...state,
		signIn,
		signOut,
		/** 导出构建消息函数，面试时可以展示消息结构 */
		buildSIWEMessage,
	};
}
