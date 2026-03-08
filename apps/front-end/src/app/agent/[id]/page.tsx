"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge, Button, Card, CardContent, CardHeader, Tabs } from "@yt/ui";
import { fetchAgentDetail, type AgentListItem } from "@/apis/agent";
import { CBT_ABI, CHAIN_IDS, getContracts, AgentHiring_ABI } from "@yt/libs";
import type { Abi } from "viem";
import {
	useChainId,
	useReadContract,
	useReadContracts,
	useSwitchChain,
	useWaitForTransactionReceipt,
	useWallet,
	useWriteContract,
} from "@yt/hooks";
import { formatUnits, parseUnits } from "viem";

const AgentDetail = () => {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const [activeTab, setActiveTab] = useState("overview");
	const [agent, setAgent] = useState<AgentListItem | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [subscribeError, setSubscribeError] = useState<string | null>(null);
	const [hasSubscribed, setHasSubscribed] = useState(false);
	const [hireRequest, setHireRequest] = useState<{
		agentId: string;
		agentOwner: `0x${string}`;
		price: bigint;
	} | null>(null);

	const { address, isConnected, connect } = useWallet();
	const chainId = useChainId();
	const contracts = getContracts(chainId);
	const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
	const {
		writeContract: approve,
		data: approveHash,
		isPending: isApprovePending,
		error: approveError,
	} = useWriteContract();
	const {
		writeContract: hire,
		data: hireHash,
		isPending: isHirePending,
		error: hireError,
	} = useWriteContract({
		mutation: {
			onError: (error) => {
				console.error("Hire transaction error:", error);
			},
		},
	});
	const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
		useWaitForTransactionReceipt({ hash: approveHash });
	const { isLoading: isHireConfirming, isSuccess: isHireSuccess } =
		useWaitForTransactionReceipt({ hash: hireHash });
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

	useEffect(() => {
		if (isHireSuccess) {
			setHasSubscribed(true);
		}
	}, [isHireSuccess]);
	useEffect(() => {
		if (!address || !engagementResults) {
			setHasSubscribed(false);
			return;
		}
		const lowerAddress = address.toLowerCase();
		const subscribed = engagementResults.some((engagement) => {
			const result = engagement.result as
				| {
						user?: string;
						status?: bigint | number;
				  }
				| readonly unknown[]
				| undefined;
			if (!result) return false;
			const user =
				"user" in (result as object) && (result as { user?: string }).user
					? (result as { user?: string }).user
					: (result as readonly unknown[])[1];
			const status =
				"status" in (result as object) &&
				(result as { status?: unknown }).status
					? (result as { status?: unknown }).status
					: (result as readonly unknown[])[9];
			const normalizedUser = typeof user === "string" ? user.toLowerCase() : "";
			const normalizedStatus =
				typeof status === "bigint" ? Number(status) : Number(status);
			return (
				normalizedUser === lowerAddress &&
				(normalizedStatus !== 3 || Number.isNaN(normalizedStatus))
			);
		});
		setHasSubscribed(subscribed);
	}, [address, engagementResults]);

	useEffect(() => {
		if (!hireRequest || !isApproveSuccess) return;

		hire({
			address: contracts.AgentHiring,
			abi: AgentHiring_ABI.abi,
			functionName: "hire",
			args: [
				hireRequest.agentId,
				hireRequest.agentOwner,
				"", // jobId - empty for direct purchase
				hireRequest.price,
				0, // purchaseType: 0 = DIRECT
			],
		});
		setHireRequest(null);
	}, [hire, hireRequest, isApproveSuccess, contracts.AgentHiring]);

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

		if (!agent) return;
		if (serviceFeeBps === undefined || serviceFeeBps === null) {
			setSubscribeError("正在读取服务费，请稍后重试。");
			return;
		}
		if (!agent.owner) {
			setSubscribeError("Agent 地址缺失，无法雇佣。");
			return;
		}
		if (!agent.id) {
			setSubscribeError("Agent ID 缺失，无法雇佣。");
			return;
		}

		const price = parsePriceToCbt(agent.price);
		if (!price) {
			setSubscribeError("订阅费用非 CBT 计价或格式不正确。");
			return;
		}

		try {
			if (!isConnected) {
				await connect();
			}

			if (chainId !== CHAIN_IDS.sepolia) {
				await switchChainAsync({ chainId: CHAIN_IDS.sepolia });
			}

			const feeBps = BigInt((serviceFeeBps as bigint) ?? 0n);
			const fee = (price * feeBps) / 10_000n;
			const approveAmount = price + fee;
			if (typeof cbtBalance === "bigint" && cbtBalance < approveAmount) {
				const needed = formatUnits(approveAmount, 18);
				const current = formatUnits(cbtBalance, 18);
				setSubscribeError(
					`CBT 余额不足，需要 ${needed} CBT，当前余额 ${current} CBT。`,
				);
				return;
			}

			setHireRequest({
				agentId: agent.id,
				agentOwner: agent.owner as `0x${string}`,
				price,
			});

			approve({
				address: contracts.CBT,
				abi: CBT_ABI.abi,
				functionName: "approve",
				args: [contracts.AgentHiring, approveAmount],
			});
		} catch (err) {
			setSubscribeError(
				err instanceof Error ? err.message : "订阅失败，请稍后再试。",
			);
			setHireRequest(null);
		}
	};

	if (loading) {
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
				<div className="flex flex-col items-center justify-center py-20">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
					<p className="mt-4 text-slate-400">加载中...</p>
				</div>
			</div>
		);
	}

	if (error || !agent) {
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
				<div className="flex flex-col items-center justify-center py-20">
					<div className="size-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-slate-600">
						<svg
							className="w-8 h-8"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<h3 className="text-xl font-bold mb-2">未找到该智能体</h3>
					<p className="text-slate-500">
						{error || "该智能体不存在或已被删除"}
					</p>
				</div>
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
					<div className="aspect-video glass rounded-3xl overflow-hidden relative border border-white/10 group">
						<img
							src={`https://picsum.photos/seed/${agent.id}/1200/800`}
							className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-all duration-700"
							alt={agent.name}
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
						<div className="absolute bottom-8 left-8 flex items-end gap-6">
							<div className="size-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/50">
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
								{agent.category && (
									<Badge variant="red" className="mb-2">
										{agent.category}
									</Badge>
								)}
								<h1 className="text-3xl font-black tracking-tighter neon-text">
									{agent.name}
								</h1>
							</div>
						</div>
					</div>

					<div className="space-y-6">
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
								<div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
									{agent.desc && (
										<p className="text-slate-400 text-lg leading-relaxed">
											{agent.desc}
										</p>
									)}

									{agent.tags && agent.tags.length > 0 && (
										<div>
											<h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">
												特性标签
											</h3>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												{agent.tags.map((tag) => (
													<div
														key={tag}
														className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5"
													>
														<div className="size-2 rounded-full bg-blue-500" />
														<span className="text-sm font-bold">#{tag}</span>
													</div>
												))}
											</div>
										</div>
									)}
								</div>
							)}
							{activeTab === "metrics" && (
								<div className="p-8 bg-black/40 rounded-3xl border border-white/5 font-mono text-sm space-y-4">
									<p className="text-emerald-500">&gt;&gt; 性能数据概览...</p>
									{agent.successRate !== undefined && (
										<p className="text-slate-500">
											&gt; 成功率:{" "}
											<span className="text-white">
												{(agent.successRate * 100).toFixed(1)}%
											</span>
										</p>
									)}
									{agent.skillLevel && (
										<p className="text-slate-500">
											&gt; 技能等级:{" "}
											<span className="text-white">{agent.skillLevel}</span>
										</p>
									)}
									{agent.isActive !== undefined && (
										<p className="text-slate-500">
											&gt; 状态:{" "}
											<span
												className={
													agent.isActive
														? "text-emerald-400"
														: "text-yellow-400"
												}
											>
												{agent.isActive ? "活跃" : "暂停"}
											</span>
										</p>
									)}
									{agent.visibility && (
										<p className="text-slate-500">
											&gt; 可见性:{" "}
											<span className="text-white">{agent.visibility}</span>
										</p>
									)}
								</div>
							)}
						</div>
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
							<div className="space-y-2">
								<div className="flex items-end justify-between">
									<span className="text-sm text-slate-400">授权费用</span>
									<span className="text-3xl font-black text-blue-400">
										{priceBreakdown
											? `${formatUnits(priceBreakdown.total, 18)} CBT`
											: agent.price || "面议"}
									</span>
								</div>
								{priceBreakdown && (
									<div className="text-xs text-slate-500 space-y-1">
										<p>
											价格:{" "}
											<span className="text-slate-300">
												{formatUnits(priceBreakdown.amount, 18)} CBT
											</span>
										</p>
										<p>
											服务费:{" "}
											<span className="text-slate-300">
												{formatUnits(priceBreakdown.fee, 18)} CBT
											</span>
										</p>
										<p>
											合计:{" "}
											<span className="text-slate-200">
												{formatUnits(priceBreakdown.total, 18)} CBT
											</span>
										</p>
									</div>
								)}
							</div>

							<div className="space-y-3 py-6 border-y border-white/5">
								{agent.rating !== undefined && (
									<div className="flex justify-between text-sm">
										<span className="text-slate-400">评分</span>
										<span className="font-bold text-yellow-400">
											⭐ {agent.rating.toFixed(2)}
										</span>
									</div>
								)}
								{agent.category && (
									<div className="flex justify-between text-sm">
										<span className="text-slate-400">分类</span>
										<span className="font-bold text-blue-400">
											{agent.category}
										</span>
									</div>
								)}
							</div>

							<div className="space-y-3">
								<Button
									className="w-full bg-blue-600 hover:bg-blue-500 py-6 text-lg"
									onClick={() => {
										void handleSubscribe();
									}}
									disabled={
										hasSubscribed ||
										isSwitching ||
										isApprovePending ||
										isApproveConfirming ||
										isHirePending ||
										isHireConfirming
									}
								>
									{hasSubscribed
										? "已订阅"
										: isApprovePending || isApproveConfirming
											? "授权中..."
											: isHirePending || isHireConfirming
												? "雇佣中..."
												: "立即订阅"}
								</Button>
								<Button variant="outline" className="w-full">
									免费试用
								</Button>
							</div>
							{(subscribeError || approveError || hireError) && (
								<p className="text-xs text-rose-400">
									{subscribeError ||
										approveError?.message ||
										hireError?.message}
								</p>
							)}
							{isHireSuccess && (
								<p className="text-xs text-emerald-400">
									订阅成功，Agent已雇佣。
								</p>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
};

export default AgentDetail;
