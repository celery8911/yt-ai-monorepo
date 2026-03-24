"use client";
import {
	useChainId,
	useSwitchChain,
	useWriteContract,
	useReadContract,
	useReadContracts,
	useWallet,
} from "@/hooks/web3";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge, Button, Card, CardContent, CardHeader, Tabs } from "@yt/ui";
import { fetchAgentDetail, type AgentListItem } from "@/apis/agent";
import { CBT_ABI, CHAIN_IDS, getContracts, AgentHiring_ABI } from "@yt/libs";
import type { Abi } from "viem";
import { formatUnits, parseUnits } from "viem";
import { useTransactionQueue } from "@/hooks/useTransactionQueue";

const AgentDetail = () => {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const [activeTab, setActiveTab] = useState("overview");
	const [agent, setAgent] = useState<AgentListItem | null>(null);
	const [loading, setLoading] = useState(true);
	const [_error, setError] = useState("");
	const [subscribeError, setSubscribeError] = useState<string | null>(null);
	const [hasSubscribed, setHasSubscribed] = useState(false);

	const { address, isConnected, connect } = useWallet();
	const chainId = useChainId();
	const contracts = getContracts(chainId);
	const { switchChainAsync, isPending: isSwitching } = useSwitchChain();

	const {
		enqueue,
		queue,
		isProcessing: isQueueProcessing,
	} = useTransactionQueue();
	const { writeContractAsync } = useWriteContract();

	const { data: serviceFeeBps } = useReadContract({
		address: contracts.AgentHiring,
		abi: AgentHiring_ABI.abi,
		functionName: "serviceFeeBps",
	});
	const { data: cbtBalance } = useReadContract({
		address: contracts.CBT,
		abi: CBT_ABI.abi,
		functionName: "balanceOf",
		args: address ? [address] : undefined,
		query: {
			enabled: Boolean(address),
		},
	});
	const { data: engagementIds } = useReadContract({
		address: contracts.AgentHiring,
		abi: AgentHiring_ABI.abi,
		functionName: "getEngagementsByAgentId",
		args: agent?.id ? [agent.id] : undefined,
		query: {
			enabled: Boolean(agent?.id),
		},
	});
	const engagementIdList = Array.isArray(engagementIds) ? engagementIds : [];
	const { data: engagementResults } = useReadContracts({
		contracts: engagementIdList.map((engagementId) => ({
			address: contracts.AgentHiring,
			abi: AgentHiring_ABI.abi as Abi,
			functionName: "engagements",
			args: [engagementId],
		})),
		query: {
			enabled: Boolean(address) && engagementIdList.length > 0,
		},
	});

	useEffect(() => {
		const loadAgent = async () => {
			if (!id) {
				setError("Agent ID is missing");
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				const data = await fetchAgentDetail(id);
				if (data) {
					setAgent(data);
				} else {
					setError("Agent not found");
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to load agent");
			} finally {
				setLoading(false);
			}
		};

		loadAgent();
	}, [id]);

	// Check subscription status
	useEffect(() => {
		if (!address || !engagementResults) {
			setHasSubscribed(false);
			return;
		}
		const lowerAddress = address.toLowerCase();
		const subscribed = engagementResults.some((engagement) => {
			const result = engagement.result as any;
			if (!result) return false;

			const user = result.user || result[1];
			const status =
				result.status !== undefined ? Number(result.status) : Number(result[9]);

			return (
				user?.toLowerCase() === lowerAddress && status === 1 // ACTIVE
			);
		});
		setHasSubscribed(subscribed);
	}, [address, engagementResults]);

	const parsePriceToCbt = (price?: string) => {
		if (!price) return null;
		const match = price.trim().match(/^(\d+(\.\d+)?)(?:\s*([A-Za-z]+))?$/);
		if (!match) return null;
		const value = match[1];
		const currency = match[3]?.toUpperCase();
		if (currency && currency !== "CBT") return null;
		return parseUnits(value, 18);
	};

	const getPriceBreakdown = (price?: string) => {
		const amount = parsePriceToCbt(price);
		if (!amount) return null;
		const feeBps = BigInt((serviceFeeBps as bigint) ?? 0n);
		const fee = (amount * feeBps) / 10_000n;
		return { amount, fee, total: amount + fee };
	};

	const priceBreakdown = agent?.price ? getPriceBreakdown(agent.price) : null;

	const handleSubscribe = async () => {
		setSubscribeError(null);

		if (!agent || !priceBreakdown) return;
		if (serviceFeeBps === undefined) {
			setSubscribeError("正在读取服务费，请稍后重试。");
			return;
		}

		try {
			if (!isConnected) {
				await connect();
			}

			if (chainId !== CHAIN_IDS.sepolia) {
				await switchChainAsync({ chainId: CHAIN_IDS.sepolia });
			}

			if (typeof cbtBalance === "bigint" && cbtBalance < priceBreakdown.total) {
				setSubscribeError(
					`CBT 余额不足，需要 ${formatUnits(priceBreakdown.total, 18)} CBT。`,
				);
				return;
			}

			// Phase 4: Use Transaction Queue with Explicit Nonce
			// Step 1: Enqueue Approve
			enqueue({
				description: "授权 CBT 代币",
				execute: async (nonce) => {
					return await writeContractAsync({
						address: contracts.CBT,
						abi: CBT_ABI.abi,
						functionName: "approve",
						args: [contracts.AgentHiring, priceBreakdown.total],
						nonce,
					});
				},
			});

			// Step 2: Enqueue Hire
			enqueue({
				description: "雇佣智能体",
				execute: async (nonce) => {
					return await writeContractAsync({
						address: contracts.AgentHiring,
						abi: AgentHiring_ABI.abi,
						functionName: "hire",
						args: [
							agent.id,
							agent.owner as `0x${string}`,
							"", // jobId
							priceBreakdown.amount,
							0, // DIRECT
						],
						nonce,
					});
				},
			});
		} catch (err) {
			setSubscribeError(err instanceof Error ? err.message : "订阅失败");
		}
	};

	if (loading) {
		return (
			<div className="max-w-6xl mx-auto space-y-12 pb-20 text-center py-20">
				<div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
				<p className="mt-4 text-slate-400">加载中...</p>
			</div>
		);
	}

	return (
		<div className="max-w-6xl mx-auto space-y-12 pb-20">
			<Button
				variant="ghost"
				onClick={() => router.push("/market")}
				className="text-slate-400 hover:text-blue-400 group"
			>
				<svg
					className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M10 19l-7-7m0 0l7-7m-7 7h18"
					/>
				</svg>
				返回市场
			</Button>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
				<div className="lg:col-span-2 space-y-8">
					<div className="aspect-video glass rounded-3xl overflow-hidden relative border border-white/10">
						<img
							src={`https://picsum.photos/seed/${agent?.id}/1200/800`}
							className="w-full h-full object-cover opacity-30"
							alt={agent?.name}
						/>
						<div className="absolute bottom-8 left-8 flex items-end gap-6">
							<div className="size-20 bg-blue-600 rounded-2xl flex items-center justify-center">
								<svg
									className="w-10 h-10 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M13 10V3L4 14h7v7l9-11h-7z"
									/>
								</svg>
							</div>
							<div>
								<Badge variant="red" className="mb-2">
									{agent?.category}
								</Badge>
								<h1 className="text-3xl font-black neon-text uppercase">
									{agent?.name}
								</h1>
							</div>
						</div>
					</div>

					<Tabs
						tabs={[
							{ id: "overview", label: "详情概览" },
							{ id: "metrics", label: "性能指标" },
						]}
						activeTab={activeTab}
						onChange={setActiveTab}
					/>

					<div className="prose prose-invert max-w-none">
						{activeTab === "overview" && (
							<p className="text-slate-400 text-lg leading-relaxed">
								{agent?.desc}
							</p>
						)}
					</div>
				</div>

				<div className="space-y-6">
					<Card glow className="bg-slate-900/60 sticky top-24">
						<CardHeader>
							<h3 className="font-black text-sm uppercase tracking-widest text-slate-500">
								订阅协议
							</h3>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="flex items-end justify-between">
								<span className="text-sm text-slate-400">授权费用</span>
								<span className="text-3xl font-black text-blue-400">
									{priceBreakdown
										? `${formatUnits(priceBreakdown.total, 18)} CBT`
										: "面议"}
								</span>
							</div>

							{queue.length > 0 && (
								<div className="space-y-2 rounded-lg bg-black/40 p-4 border border-white/5">
									<p className="text-xs font-bold uppercase text-slate-500">
										交易状态队列
									</p>
									{queue.map((tx) => (
										<div
											key={tx.id}
											className="flex items-center justify-between text-xs"
										>
											<span className="text-slate-300">{tx.description}</span>
											<Badge
												variant={
													tx.status === "confirmed"
														? "green"
														: tx.status === "failed"
															? "red"
															: "blue"
												}
											>
												{tx.status}
											</Badge>
										</div>
									))}
								</div>
							)}

							<Button
								className="w-full bg-blue-600 hover:bg-blue-500 py-6 text-lg"
								onClick={handleSubscribe}
								disabled={hasSubscribed || isQueueProcessing || isSwitching}
							>
								{hasSubscribed
									? "已订阅"
									: isQueueProcessing
										? "处理中..."
										: "立即订阅"}
							</Button>

							{subscribeError && (
								<p className="text-xs text-rose-400">{subscribeError}</p>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
};

export default AgentDetail;
