"use client";

/**
 * useTransactionRetry Hook - L2 交易重试与加速
 *
 * 监控交易状态，超时后提示用户加速（提高 gas）或重新发送。
 * 针对不同 L2 链设置不同的超时阈值。
 *
 * 面试要点：
 * - Optimistic Rollup (Arbitrum/Base/OP): sequencer 排队 → batch 提交 L1，交易可能因 sequencer 拥堵延迟
 * - ZK Rollup (zkSync): ZK proof 生成耗时，但最终确认更快
 * - 侧链 (Polygon/BSC): 通常很快，但网络拥堵时可能延迟
 * - 解决方案: 轮询 receipt、提高 gas tip、使用加速 RPC
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { usePublicClient } from "@yt/hooks";
import { useChainId } from "@yt/hooks";

export type TransactionStatus =
	| "idle"
	| "pending"
	| "confirming"
	| "success"
	| "timeout"
	| "failed";

/** 各链的超时阈值 (毫秒) */
const CHAIN_TIMEOUT_MS: Record<number, number> = {
	11155111: 60_000, // Sepolia L1: 60s
	421614: 30_000, // Arbitrum Sepolia: 30s (sequencer 通常很快)
	84532: 30_000, // Base Sepolia: 30s
	11155420: 30_000, // OP Sepolia: 30s
	300: 45_000, // zkSync Sepolia: 45s (ZK proof 需要时间)
	80002: 20_000, // Polygon Amoy: 20s (出块快)
	97: 15_000, // BSC Testnet: 15s (3s 出块)
};

const DEFAULT_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 3_000;

export function useTransactionRetry() {
	const chainId = useChainId();
	const publicClient = usePublicClient();
	const [status, setStatus] = useState<TransactionStatus>("idle");
	const [hash, setHash] = useState<`0x${string}` | null>(null);
	const [elapsedMs, setElapsedMs] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const startTimeRef = useRef<number>(0);
	const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const timeoutMs = CHAIN_TIMEOUT_MS[chainId] ?? DEFAULT_TIMEOUT_MS;
	const isTimedOut = status === "timeout";

	/** 清理轮询定时器 */
	const stopPolling = useCallback(() => {
		if (pollTimerRef.current) {
			clearInterval(pollTimerRef.current);
			pollTimerRef.current = null;
		}
	}, []);

	/** 开始监控交易 */
	const watchTransaction = useCallback(
		(txHash: `0x${string}`) => {
			stopPolling();
			setHash(txHash);
			setStatus("confirming");
			setError(null);
			setElapsedMs(0);
			startTimeRef.current = Date.now();

			pollTimerRef.current = setInterval(async () => {
				const elapsed = Date.now() - startTimeRef.current;
				setElapsedMs(elapsed);

				// 超时检测
				if (elapsed > timeoutMs) {
					setStatus("timeout");
					stopPolling();
					return;
				}

				// 轮询 receipt
				try {
					if (!publicClient) return;
					const receipt = await publicClient.getTransactionReceipt({
						hash: txHash,
					});
					if (receipt) {
						stopPolling();
						if (receipt.status === "success") {
							setStatus("success");
						} else {
							setStatus("failed");
							setError("交易已回滚 (reverted)");
						}
					}
				} catch {
					// receipt 不存在，继续轮询
				}
			}, POLL_INTERVAL_MS);
		},
		[publicClient, timeoutMs, stopPolling],
	);

	/** 重置状态 */
	const reset = useCallback(() => {
		stopPolling();
		setStatus("idle");
		setHash(null);
		setElapsedMs(0);
		setError(null);
	}, [stopPolling]);

	// 组件卸载时清理
	useEffect(() => {
		return () => stopPolling();
	}, [stopPolling]);

	return {
		status,
		hash,
		elapsedMs,
		timeoutMs,
		isTimedOut,
		error,
		watchTransaction,
		reset,
	};
}
