"use client";
import { usePublicClient } from "@/hooks/web3";

/**
 * useGasEstimate Hook - 动态 Gas 估算
 *
 * 面试要点 (W8: Gas 估算和展示):
 * - EIP-1559 引入 baseFee + priorityFee (tip) 模型
 *   - baseFee: 由协议根据区块使用率自动调整
 *   - maxPriorityFeePerGas (tip): 给矿工的小费，越高越快被打包
 *   - maxFeePerGas: 用户愿意支付的最大费用 = baseFee + tip
 *   - 实际花费: min(baseFee + tip, maxFeePerGas) × gasUsed
 * - L2 的 gas 计算不同:
 *   - Optimistic Rollup: L2 execution fee + L1 data fee (calldata 成本)
 *   - zkSync: 类似但 proof 验证有额外开销
 *   - BSC/Polygon: 传统 gasPrice 模型 (非 EIP-1559)
 */

import { useState, useCallback } from "react";
import { formatEther, type Abi } from "viem";

type GasEstimateResult = {
	gasLimit: bigint;
	maxFeePerGas: bigint;
	maxPriorityFeePerGas: bigint;
	estimatedCostWei: bigint;
	estimatedCostEth: string;
};

export function useGasEstimate() {
	const publicClient = usePublicClient();
	const [estimate, setEstimate] = useState<GasEstimateResult | null>(null);
	const [isEstimating, setIsEstimating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/**
	 * 估算合约调用的 gas 费用
	 */
	const estimateContractGas = useCallback(
		async (params: {
			address: `0x${string}`;
			abi: Abi;
			functionName: string;
			args?: readonly unknown[];
			value?: bigint;
			account?: `0x${string}`;
		}): Promise<GasEstimateResult | null> => {
			if (!publicClient) {
				setError("客户端不可用");
				return null;
			}

			setIsEstimating(true);
			setError(null);

			try {
				// 并行获取 gas limit 和 gas price
				const [gasLimit, feeData] = await Promise.all([
					publicClient.estimateContractGas({
						address: params.address,
						abi: params.abi,
						functionName: params.functionName,
						args: params.args,
						value: params.value,
						account: params.account,
					} as Parameters<typeof publicClient.estimateContractGas>[0]),
					publicClient.estimateFeesPerGas(),
				]);

				const maxFeePerGas = feeData.maxFeePerGas ?? 0n;
				const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? 0n;

				// 添加 10% buffer 到 gas limit
				const bufferedGasLimit = (gasLimit * 110n) / 100n;
				const estimatedCostWei = bufferedGasLimit * maxFeePerGas;

				const result: GasEstimateResult = {
					gasLimit: bufferedGasLimit,
					maxFeePerGas,
					maxPriorityFeePerGas,
					estimatedCostWei,
					estimatedCostEth: formatEther(estimatedCostWei),
				};

				setEstimate(result);
				setIsEstimating(false);
				return result;
			} catch (err) {
				const msg = err instanceof Error ? err.message : "Gas 估算失败";
				setError(msg);
				setIsEstimating(false);
				return null;
			}
		},
		[publicClient],
	);

	return {
		estimate,
		isEstimating,
		error,
		estimateContractGas,
	};
}
