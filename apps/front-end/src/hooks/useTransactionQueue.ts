"use client";
import { usePublicClient, useWallet } from "@/hooks/web3";

/**
 * useTransactionQueue Hook - 显式 Nonce 管理的交易队列
 *
 * 面试要点 (Q8: 多笔交易并发注意事项):
 * - 同一地址的所有交易共享一个 nonce 空间 (从 0 递增)
 * - 如果两笔交易使用相同的 nonce，只有一笔能成功
 * - 后续交易必须等前面的 nonce 确认后才能被打包 (nonce gap)
 * - gas price 更高的交易更容易被矿工优先打包 (nonce 相同时替换)
 * - 解决方案: 手动指定 nonce，确保顺序执行
 *
 * 用法:
 *   const { enqueue, queue, isProcessing } = useTransactionQueue();
 *   // approve 和 hire 按顺序执行，自动分配 nonce
 *   enqueue({ description: "Approve CBT", execute: (nonce) => approve({...nonce}) });
 *   enqueue({ description: "Hire Agent", execute: (nonce) => hire({...nonce}) });
 */

import { useState, useCallback, useRef } from "react";

export type QueuedTransaction = {
	id: string;
	description: string;
	status: "pending" | "executing" | "confirmed" | "failed";
	nonce?: number;
	hash?: `0x${string}`;
	error?: string;
};

type TransactionTask = {
	description: string;
	execute: (nonce: number) => Promise<`0x${string}`>;
};

export function useTransactionQueue() {
	const { address } = useWallet();
	const publicClient = usePublicClient();
	const [queue, setQueue] = useState<QueuedTransaction[]>([]);
	const [isProcessing, setIsProcessing] = useState(false);
	const taskQueueRef = useRef<TransactionTask[]>([]);
	const idCounterRef = useRef(0);

	/**
	 * 获取当前 pending nonce
	 * blockTag: 'pending' 包含了已发送但未确认的交易
	 */
	const getPendingNonce = useCallback(async (): Promise<number> => {
		if (!publicClient || !address) {
			throw new Error("Client or address not available");
		}
		return await publicClient.getTransactionCount({
			address,
			blockTag: "pending",
		});
	}, [publicClient, address]);

	/**
	 * 处理队列中的任务
	 */
	const processQueue = useCallback(async () => {
		if (isProcessing || taskQueueRef.current.length === 0) return;

		setIsProcessing(true);
		const tasks = [...taskQueueRef.current];
		taskQueueRef.current = [];

		try {
			let currentNonce = await getPendingNonce();

			for (const task of tasks) {
				const txId = `tx-${++idCounterRef.current}`;

				// 添加到 UI 队列
				setQueue((prev) => [
					...prev,
					{
						id: txId,
						description: task.description,
						status: "executing",
						nonce: currentNonce,
					},
				]);

				try {
					// 执行交易，传入 nonce
					const hash = await task.execute(currentNonce);

					// 更新状态为等待确认
					setQueue((prev) =>
						prev.map((tx) =>
							tx.id === txId ? { ...tx, hash, status: "confirmed" } : tx,
						),
					);

					// 等待交易确认
					if (publicClient) {
						await publicClient.waitForTransactionReceipt({ hash });
					}

					// nonce 递增
					currentNonce++;
				} catch (err) {
					const errorMsg = err instanceof Error ? err.message : "交易失败";

					setQueue((prev) =>
						prev.map((tx) =>
							tx.id === txId
								? { ...tx, status: "failed", error: errorMsg }
								: tx,
						),
					);

					// 如果一笔失败，后续交易也无法执行（nonce gap）
					// 将剩余任务标记为失败
					break;
				}
			}
		} finally {
			setIsProcessing(false);
		}
	}, [isProcessing, getPendingNonce, publicClient]);

	/**
	 * 添加交易到队列
	 */
	const enqueue = useCallback(
		(task: TransactionTask) => {
			taskQueueRef.current.push(task);

			// 如果不在处理中，启动处理
			if (!isProcessing) {
				// 使用 setTimeout 让多个连续的 enqueue 调用合并
				setTimeout(() => processQueue(), 0);
			}
		},
		[isProcessing, processQueue],
	);

	/** 清除队列历史 */
	const clearQueue = useCallback(() => {
		setQueue([]);
	}, []);

	return {
		enqueue,
		queue,
		isProcessing,
		clearQueue,
		getPendingNonce,
	};
}
