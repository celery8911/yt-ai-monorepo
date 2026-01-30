"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@yt/hooks";
import { Button, Card, CardContent, CardHeader, Textarea } from "@yt/ui";
import { useQuery } from "@tanstack/react-query";
import {
	fetchEngagementsByUser,
	fetchEscrowsByPayer,
	type EscrowRecord,
} from "@/apis/chain-status";
import { fetchAgentDetail } from "@/apis/agent";
import { ethers } from "ethers";
import { initiateDispute } from "@/apis/dao";
import { useDisputeDAO } from "@/hooks/contracts/useDisputeDAO";
import { formatUnits } from "viem";

const MAX_REASON_LENGTH = 500;

const normalizeEscrowId = (value: string) => value.toLowerCase();

const resolveSubmitError = (submitError: unknown): string => {
	if (submitError && typeof submitError === "object") {
		const response = (
			submitError as { response?: { data?: { message?: unknown } } }
		).response;
		const message = response?.data?.message;
		if (typeof message === "string" && message.trim()) return message;
		if (Array.isArray(message) && message.length > 0) {
			return message.filter((item) => typeof item === "string").join("、");
		}
	}
	return submitError instanceof Error ? submitError.message : "提交失败";
};

const CreateProposal = () => {
	const router = useRouter();
	const { address, isConnected } = useWallet();
	const [selectedEscrow, setSelectedEscrow] = useState<EscrowRecord | null>(
		null,
	);
	const [reason, setReason] = useState("");
	const [reasonCode, setReasonCode] = useState<number>(0);
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const { openDispute, isOpenDisputePending, isOpenDisputeSuccess } =
		useDisputeDAO();

	// 获取用户的 Escrow 列表
	const {
		data: escrowsData,
		isLoading: isLoadingEscrows,
		error: escrowsError,
	} = useQuery({
		queryKey: ["escrows-by-user", address],
		queryFn: async () => {
			const escrowsResponse = await fetchEscrowsByPayer(address ?? "", true);
			const escrows = escrowsResponse.escrows ?? [];
			if (!escrows.length) {
				return {
					escrows: [] as EscrowRecord[],
					agentNameByEscrowId: {} as Record<string, string>,
				};
			}

			const { engagements } = await fetchEngagementsByUser(address ?? "", {
				first: 50,
				skip: 0,
			});
			if (!engagements.length) {
				return {
					escrows,
					agentNameByEscrowId: {} as Record<string, string>,
				};
			}

			const escrowIdSet = new Set(
				escrows.map((escrow) => normalizeEscrowId(escrow.id)),
			);
			const agentIdByEscrowId = new Map<string, string>();
			for (const engagement of engagements) {
				const escrowId =
					engagement.escrowId ??
					ethers.solidityPackedKeccak256(
						["string", "uint256"],
						["engagement", BigInt(engagement.engagementId)],
					);
				const normalizedEscrowId = normalizeEscrowId(escrowId);
				if (!escrowIdSet.has(normalizedEscrowId)) {
					continue;
				}
				if (engagement.agentId) {
					agentIdByEscrowId.set(normalizedEscrowId, engagement.agentId);
				}
			}

			const agentIds = Array.from(new Set(agentIdByEscrowId.values()));
			const agentNameById = new Map<string, string>();
			const agentResults = await Promise.allSettled(
				agentIds.map(async (agentId) => {
					const agent = await fetchAgentDetail(agentId);
					return { agentId, agent };
				}),
			);
			for (const result of agentResults) {
				if (result.status === "fulfilled" && result.value.agent?.name) {
					agentNameById.set(result.value.agentId, result.value.agent.name);
				}
			}
			const agentNameByEscrowId: Record<string, string> = {};
			agentIdByEscrowId.forEach((agentId, escrowId) => {
				const agentName = agentNameById.get(agentId);
				if (agentName) {
					agentNameByEscrowId[escrowId] = agentName;
				}
			});

			return {
				escrows,
				agentNameByEscrowId,
			};
		},
		enabled: Boolean(address),
	});

	const escrows = useMemo(
		() =>
			escrowsData?.escrows.filter(
				(escrow) => escrow.status === "LOCKED" && !escrow.frozen,
			) ?? [],
		[escrowsData],
	);
	const agentNameByEscrowId = escrowsData?.agentNameByEscrowId ?? {};

	const reasonCount = useMemo(() => reason.length, [reason]);

	// 当交易成功时，提交到后端
	useEffect(() => {
		if (isOpenDisputeSuccess && selectedEscrow && address) {
			initiateDispute({
				jobId: selectedEscrow.jobId,
				escrowId: selectedEscrow.id,
				initiator: address,
				reason: reason.trim(),
			})
				.then(() => {
					router.push(`/dao/${selectedEscrow.id}`);
				})
				.catch((err) => {
					setError(`链上交易成功，但后端记录失败: ${resolveSubmitError(err)}`);
					setSubmitting(false);
				});
		}
	}, [isOpenDisputeSuccess, selectedEscrow, address, reason, router]);

	const handleSubmit = async () => {
		setError("");

		if (!isConnected || !address) {
			setError("请先连接钱包。");
			return;
		}

		if (!selectedEscrow) {
			setError("请选择一个托管记录。");
			return;
		}

		if (!reason.trim()) {
			setError("请填写争议原因。");
			return;
		}

		if (reason.length > MAX_REASON_LENGTH) {
			setError(`争议原因不能超过 ${MAX_REASON_LENGTH} 字。`);
			return;
		}

		setSubmitting(true);

		try {
			// 使用 escrowId (selectedEscrow.id) 而不是 jobId
			await openDispute(selectedEscrow.id, reasonCode);

			// 等待交易确认后，在 useEffect 中处理后端提交
		} catch (submitError) {
			setError(resolveSubmitError(submitError));
			setSubmitting(false);
		}
	};

	return (
		<div className="max-w-3xl mx-auto pb-20 space-y-10">
			<Button
				variant="ghost"
				onClick={() => router.push("/dao")}
				className="text-slate-400 hover:text-blue-400 group mb-4"
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
				返回治理列表
			</Button>

			<div className="text-center">
				<h1 className="text-5xl font-black mb-4 tracking-tighter">发起争议</h1>
				<p className="text-slate-400">
					选择需要仲裁的订阅智能体，并提交争议原因进入 DAO 投票流程。
				</p>
			</div>

			{!isConnected ? (
				<Card className="border-yellow-500/20 bg-yellow-500/5">
					<CardContent className="p-6 text-center">
						<p className="text-yellow-400 mb-4">请先连接钱包以继续</p>
					</CardContent>
				</Card>
			) : null}

			{isConnected && escrowsError ? (
				<Card className="border-rose-500/20 bg-rose-500/5">
					<CardContent className="p-6">
						<p className="text-sm text-rose-400">
							加载托管记录失败: {escrowsError.message}
						</p>
					</CardContent>
				</Card>
			) : null}

			{isConnected && escrows.length === 0 && !isLoadingEscrows ? (
				<Card className="border-slate-500/20">
					<CardContent className="p-6 text-center">
						<p className="text-slate-400">
							您当前没有可争议的托管记录。
							<br />
							只有状态为 LOCKED 且未冻结的托管记录才能发起争议。
						</p>
					</CardContent>
				</Card>
			) : null}

			{isConnected && (escrows.length > 0 || isLoadingEscrows) ? (
				<>
					<Card className="border-purple-500/20">
						<CardHeader>
							<div className="flex items-center gap-3">
								<span className="size-6 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-black text-white">
									1
								</span>
								<h3 className="font-black text-sm uppercase tracking-widest text-slate-300">
									选择托管记录
								</h3>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							{isLoadingEscrows ? (
								<div className="text-sm text-slate-400">加载托管记录...</div>
							) : (
								<div className="space-y-3">
									{escrows.map((escrow) => {
										const isSelected = selectedEscrow?.id === escrow.id;
										const amount = formatUnits(BigInt(escrow.amount), 18);
										const createdDate = new Date(
											Number(escrow.createdAt) * 1000,
										).toLocaleDateString("zh-CN");
										const agentName =
											agentNameByEscrowId[normalizeEscrowId(escrow.id)] ??
											"未知 Agent";

										return (
											<div
												key={escrow.id}
												onClick={() => setSelectedEscrow(escrow)}
												className={`p-4 rounded-lg border cursor-pointer transition-all ${
													isSelected
														? "border-purple-500 bg-purple-500/10"
														: "border-slate-700 hover:border-slate-600"
												}`}
											>
												<div className="flex items-center justify-between">
													<div className="flex-grow">
														<div className="flex items-center gap-2 mb-2">
															<span className="text-sm font-bold text-slate-200">
																{agentName}
															</span>
															<span className="text-xs font-mono text-slate-500">
																#{escrow.id.slice(-8)}
															</span>
														</div>
														<div className="flex items-center gap-4 text-xs">
															<span className="text-slate-400">
																托管金额:{" "}
																<span className="font-black text-blue-400">
																	{amount} {escrow.currency}
																</span>
															</span>
															<span className="text-slate-500">
																创建于: {createdDate}
															</span>
														</div>
														<div className="mt-2 text-xs text-slate-500">
															代理地址: {escrow.agent.slice(0, 10)}...
														</div>
													</div>
													<div className="ml-4">
														{isSelected ? (
															<div className="size-6 rounded-full bg-purple-600 flex items-center justify-center">
																<svg
																	className="size-4 text-white"
																	fill="none"
																	viewBox="0 0 24 24"
																	stroke="currentColor"
																>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth={2}
																		d="M5 13l4 4L19 7"
																	/>
																</svg>
															</div>
														) : (
															<div className="size-6 rounded-full border-2 border-slate-600" />
														)}
													</div>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</CardContent>
					</Card>

					<Card className="border-purple-500/20">
						<CardHeader>
							<div className="flex items-center gap-3">
								<span className="size-6 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-black text-white">
									2
								</span>
								<h3 className="font-black text-sm uppercase tracking-widest text-slate-300">
									争议原因
								</h3>
							</div>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-2">
								<label className="text-sm font-bold text-slate-300">
									争议类型
								</label>
								<select
									value={reasonCode}
									onChange={(e) => setReasonCode(Number(e.target.value))}
									className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
								>
									<option value={0}>服务质量问题</option>
									<option value={1}>未按要求完成</option>
									<option value={2}>沟通问题</option>
									<option value={3}>其他</option>
								</select>
							</div>

							<Textarea
								label="详细说明"
								placeholder="请详细说明争议的具体情况..."
								value={reason}
								onChange={(event) => setReason(event.target.value)}
							/>
							<div className="flex items-center justify-between text-xs text-slate-500">
								<span>必填，最多 {MAX_REASON_LENGTH} 字。</span>
								<span>
									{reasonCount}/{MAX_REASON_LENGTH}
								</span>
							</div>
						</CardContent>
					</Card>

					{error ? <p className="text-sm text-rose-400">{error}</p> : null}

					<div className="flex gap-4">
						<Button
							variant="outline"
							className="flex-grow py-6"
							onClick={() => router.push("/dao")}
							disabled={submitting || isOpenDisputePending}
						>
							取消
						</Button>
						<Button
							className="flex-grow py-6 bg-purple-600 hover:bg-purple-500 shadow-xl shadow-purple-600/30"
							onClick={handleSubmit}
							disabled={submitting || isOpenDisputePending || !selectedEscrow}
						>
							{isOpenDisputePending
								? "链上交易确认中..."
								: submitting
									? "提交中..."
									: "发起争议"}
						</Button>
					</div>

					<p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
						争议将通过智能合约发起，并进入 DAO 投票期，请等待社区裁决。
					</p>
				</>
			) : null}
		</div>
	);
};

export default CreateProposal;
