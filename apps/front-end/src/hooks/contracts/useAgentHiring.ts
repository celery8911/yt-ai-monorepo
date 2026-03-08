"use client";

/**
 * useAgentHiring Hook - Agent雇佣合约交互
 *
 * 功能：
 * - 雇佣 Agent (直接购买或Job匹配)
 * - 批准完成支付
 * - 请求退款
 * - 查询 Engagement 信息
 */

import {
	useChainId,
	useReadContract,
	useSwitchChain,
	useWriteContract,
	useWaitForTransactionReceipt,
} from "@yt/hooks";
import { getContracts, AgentHiring_ABI, CHAIN_IDS } from "@yt/libs";
import { useWallet } from "@yt/hooks";

export const useAgentHiring = () => {
	const { address } = useWallet();
	const chainId = useChainId();
	const { switchChainAsync } = useSwitchChain();
	const contracts = getContracts(chainId);

	// 雇佣 Agent
	const {
		writeContract: hire,
		data: hireHash,
		isPending: isHirePending,
		error: hireError,
	} = useWriteContract();

	// 等待雇佣交易确认
	const { isLoading: isHireConfirming, isSuccess: isHireSuccess } =
		useWaitForTransactionReceipt({
			hash: hireHash,
		});

	// 批准完成
	const {
		writeContract: approveCompletion,
		data: approveHash,
		isPending: isApprovePending,
		error: approveError,
	} = useWriteContract();

	// 等待批准交易确认
	const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
		useWaitForTransactionReceipt({
			hash: approveHash,
		});

	// 退款
	const {
		writeContract: refund,
		data: refundHash,
		isPending: isRefundPending,
		error: refundError,
	} = useWriteContract();

	// 等待退款交易确认
	const { isLoading: isRefundConfirming, isSuccess: isRefundSuccess } =
		useWaitForTransactionReceipt({
			hash: refundHash,
		});

	/**
	 * 雇佣 Agent
	 * @param agentId Agent ID (数据库中的 CUID)
	 * @param agentOwner Agent 所有者地址
	 * @param price 价格 (bigint)
	 * @param jobId Job ID (可选，Job匹配时需要)
	 * @param purchaseType 购买类型: 0 = DIRECT, 1 = JOB_BASED
	 */
	const handleHire = async (params: {
		agentId: string;
		agentOwner: string;
		price: bigint;
		jobId?: string;
		purchaseType: 0 | 1;
	}) => {
		if (!address) {
			throw new Error("请先连接钱包");
		}

		try {
			if (chainId !== CHAIN_IDS.sepolia) {
				await switchChainAsync({ chainId: CHAIN_IDS.sepolia });
			}

			hire({
				address: contracts.AgentHiring,
				abi: AgentHiring_ABI.abi,
				functionName: "hire",
				args: [
					params.agentId,
					params.agentOwner as `0x${string}`,
					params.jobId || "",
					params.price,
					params.purchaseType,
				],
			});
		} catch (error) {
			console.error("雇佣 Agent 失败:", error);
			throw error;
		}
	};

	/**
	 * 批准完成并释放支付
	 * @param engagementId Engagement ID
	 */
	const handleApproveCompletion = async (engagementId: bigint) => {
		if (!address) {
			throw new Error("请先连接钱包");
		}

		try {
			if (chainId !== CHAIN_IDS.sepolia) {
				await switchChainAsync({ chainId: CHAIN_IDS.sepolia });
			}

			approveCompletion({
				address: contracts.AgentHiring,
				abi: AgentHiring_ABI.abi,
				functionName: "approveCompletion",
				args: [engagementId],
			});
		} catch (error) {
			console.error("批准完成失败:", error);
			throw error;
		}
	};

	/**
	 * 请求退款
	 * @param engagementId Engagement ID
	 */
	const handleRefund = async (engagementId: bigint) => {
		if (!address) {
			throw new Error("请先连接钱包");
		}

		try {
			if (chainId !== CHAIN_IDS.sepolia) {
				await switchChainAsync({ chainId: CHAIN_IDS.sepolia });
			}

			refund({
				address: contracts.AgentHiring,
				abi: AgentHiring_ABI.abi,
				functionName: "refund",
				args: [engagementId],
			});
		} catch (error) {
			console.error("退款失败:", error);
			throw error;
		}
	};

	/**
	 * 读取 Engagement 信息
	 * @param engagementId Engagement ID
	 */
	const useEngagement = (engagementId: bigint | undefined) => {
		return useReadContract({
			address: contracts.AgentHiring,
			abi: AgentHiring_ABI.abi,
			functionName: "engagements",
			args: engagementId !== undefined ? [engagementId] : undefined,
			query: {
				enabled: engagementId !== undefined,
			},
		});
	};

	return {
		// 状态
		address,

		// 雇佣相关
		hire: handleHire,
		hireHash,
		isHirePending,
		isHireConfirming,
		isHireSuccess,
		hireError,

		// 批准相关
		approveCompletion: handleApproveCompletion,
		approveHash,
		isApprovePending,
		isApproveConfirming,
		isApproveSuccess,
		approveError,

		// 退款相关
		refund: handleRefund,
		refundHash,
		isRefundPending,
		isRefundConfirming,
		isRefundSuccess,
		refundError,

		// 工具函数
		useEngagement,
	};
};
