"use client";

import Link from "next/link";
import { Badge, Button, Card, CardContent, CardHeader } from "@yt/ui";
import type { MatchedAgent, Job } from "@/apis/jobs";

type JobMatchSectionProps = {
	isOwner: boolean;
	showMatchError: boolean;
	matchError?: string;
	matches: MatchedAgent[];
	selectedAgent: MatchedAgent | null;
	showSelectedAgent: boolean;
	showMatches: boolean;
	jobPaymentMethod: Job["paymentMethod"];
	onSubscribe: (agent: MatchedAgent) => void;
	subscribingAgentId: string | null;
	isSwitching: boolean;
	isApprovePending: boolean;
	isApproveConfirming: boolean;
	isEscrowPending: boolean;
	isEscrowConfirming: boolean;
	renderScore: (value?: number) => string;
	formatAgentPrice: (
		agent: MatchedAgent,
		paymentMethod?: Job["paymentMethod"],
	) => string;
};

const JobMatchSection = ({
	isOwner,
	showMatchError,
	matchError,
	matches,
	selectedAgent,
	showSelectedAgent,
	showMatches,
	jobPaymentMethod,
	onSubscribe,
	subscribingAgentId,
	isSwitching,
	isApprovePending,
	isApproveConfirming,
	isEscrowPending,
	isEscrowConfirming,
	renderScore,
	formatAgentPrice,
}: JobMatchSectionProps) => {
	return (
		<>
			{isOwner && showMatchError ? (
				<Card className="border-rose-500/20 bg-rose-500/10">
					<CardHeader>
						<h4 className="font-black text-xs uppercase tracking-[0.2em] text-rose-300">
							匹配失败原因
						</h4>
					</CardHeader>
					<CardContent className="text-rose-200 text-sm">
						{matchError ?? "暂未匹配到合适的智能体"}
					</CardContent>
				</Card>
			) : null}

			{isOwner && showMatches ? (
				<Card className="bg-gradient-to-br from-cyan-500/10 via-slate-900/50 to-blue-500/10 border-cyan-400/20">
					<CardHeader>
						<h4 className="font-black text-xs uppercase tracking-[0.2em] text-cyan-300">
							匹配到的智能体
						</h4>
					</CardHeader>
					<CardContent className="space-y-4 text-sm">
						{matches.length ? (
							matches.map((agent) => (
								<div
									key={agent.id}
									className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 space-y-2"
								>
									<div className="flex items-center justify-between">
										<Link
											href={`/agent/${agent.id}`}
											target="_blank"
											rel="noreferrer"
											className="text-white font-semibold hover:text-cyan-200 transition-colors inline-flex items-center gap-1"
										>
											{agent.name}
											<span className="text-xs text-cyan-300">↗</span>
										</Link>
										<span className="text-cyan-300 font-mono text-xs">
											评分: {renderScore(agent.score)}
										</span>
									</div>
									<div className="flex items-center justify-between text-xs text-slate-400">
										<span>评级: {agent.rating ?? "—"}</span>
										<span>成功率: {agent.successRate ?? "—"}</span>
										<span>响应: {agent.avgResponseTimeMs ?? "—"}ms</span>
									</div>
									<div className="text-xs text-slate-400">
										费用: {formatAgentPrice(agent, jobPaymentMethod)}
									</div>
									<div className="flex items-center justify-between">
										<span className="text-xs text-slate-500">
											可跳转查看智能体详情
										</span>
										<Button
											size="sm"
											variant="outline"
											className="border-cyan-500/30"
											disabled={
												isSwitching ||
												isApprovePending ||
												isApproveConfirming ||
												isEscrowPending ||
												isEscrowConfirming ||
												subscribingAgentId === agent.id
											}
											onClick={() => onSubscribe(agent)}
										>
											{subscribingAgentId === agent.id
												? "订阅中..."
												: "立即订阅"}
										</Button>
									</div>
									{agent.tags?.length ? (
										<div className="flex flex-wrap gap-2">
											{agent.tags.slice(0, 3).map((tag) => (
												<Badge
													key={tag}
													variant="outline"
													className="border-cyan-500/20 text-cyan-100"
												>
													{tag}
												</Badge>
											))}
										</div>
									) : null}
								</div>
							))
						) : (
							<p className="text-slate-500 text-sm">暂无匹配结果</p>
						)}
					</CardContent>
				</Card>
			) : null}

			{showSelectedAgent ? (
				<Card className="bg-gradient-to-br from-emerald-500/10 via-slate-900/50 to-cyan-500/10 border-emerald-400/20">
					<CardHeader>
						<h4 className="font-black text-xs uppercase tracking-[0.2em] text-emerald-300">
							已选中智能体
						</h4>
					</CardHeader>
					<CardContent className="space-y-4 text-sm">
						{selectedAgent ? (
							<div className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 space-y-2">
								<div className="flex items-center justify-between">
									<Link
										href={`/agent/${selectedAgent.id}`}
										target="_blank"
										rel="noreferrer"
										className="text-white font-semibold hover:text-emerald-200 transition-colors inline-flex items-center gap-1"
									>
										{selectedAgent.name}
										<span className="text-xs text-emerald-300">↗</span>
									</Link>
									<span className="text-emerald-300 font-mono text-xs">
										评分: {renderScore(selectedAgent.score)}
									</span>
								</div>
								<div className="flex items-center justify-between text-xs text-slate-400">
									<span>评级: {selectedAgent.rating ?? "—"}</span>
									<span>成功率: {selectedAgent.successRate ?? "—"}</span>
									<span>响应: {selectedAgent.avgResponseTimeMs ?? "—"}ms</span>
								</div>
								<div className="flex items-center justify-between text-xs text-slate-400">
									<span>
										费用: {formatAgentPrice(selectedAgent, jobPaymentMethod)}
									</span>
									<Link
										href={`/agent/${selectedAgent.id}`}
										target="_blank"
										rel="noreferrer"
									>
										<Button
											size="sm"
											variant="outline"
											className="border-emerald-500/30"
										>
											查看智能体
										</Button>
									</Link>
								</div>
							</div>
						) : (
							<p className="text-slate-500 text-sm">暂无已选中智能体信息</p>
						)}
					</CardContent>
				</Card>
			) : null}
		</>
	);
};

export default JobMatchSection;
