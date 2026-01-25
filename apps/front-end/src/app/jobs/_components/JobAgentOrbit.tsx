"use client";

import * as d3 from "d3";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Card, CardContent, CardHeader } from "@yt/ui";
import { invokeAgentProxy } from "@/apis/agentProxy";
import type { Job, MatchedAgent } from "@/apis/jobs";

type AgentRunState = {
	status: "idle" | "running" | "done" | "error";
	result?: string;
	durationMs?: number;
};

type JobAgentOrbitProps = {
	job: Job;
	matches: MatchedAgent[];
	startSignal: number;
	onComplete?: () => void;
	onSubscribe?: (agent: MatchedAgent) => void;
	subscribingAgentId?: string | null;
};

const MAX_CANDIDATES = 8;
const MIN_CANDIDATES = 5;
const SELECT_COUNT = 3;

const shuffleList = <T,>(items: T[]): T[] => {
	const list = [...items];
	for (let index = list.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1));
		[list[index], list[swapIndex]] = [list[swapIndex], list[index]];
	}
	return list;
};

const statusBadgeVariant = (status?: AgentRunState["status"]) => {
	switch (status) {
		case "idle":
			return "outline";
		case "done":
			return "green";
		case "error":
			return "red";
		default:
			return "blue";
	}
};

const statusLabel = (status?: AgentRunState["status"]) => {
	switch (status) {
		case "idle":
			return "待输入";
		case "done":
			return "已返回";
		case "error":
			return "失败";
		default:
			return "处理中";
	}
};

const truncateText = (value: string, limit = 240): string => {
	if (value.length <= limit) return value;
	return `${value.slice(0, Math.max(0, limit - 1))}…`;
};

const formatProxyResult = (payload: unknown): string => {
	if (!payload) return "无返回结果";
	if (typeof payload === "string") return truncateText(payload);
	if (typeof payload === "object") {
		const record = payload as Record<string, unknown>;
		if (typeof record.result === "string") {
			return truncateText(record.result);
		}
		if (typeof record.message === "string") {
			return truncateText(record.message);
		}
		if (typeof record.data === "string") {
			return truncateText(record.data);
		}
		try {
			return truncateText(JSON.stringify(payload, null, 2), 420);
		} catch {
			return "返回内容解析失败";
		}
	}
	return truncateText(String(payload));
};

const JobAgentOrbit = ({
	matches,
	startSignal,
	onComplete,
	onSubscribe,
	subscribingAgentId,
}: JobAgentOrbitProps) => {
	const [candidates, setCandidates] = useState<MatchedAgent[]>([]);
	const [selectedAgents, setSelectedAgents] = useState<MatchedAgent[]>([]);
	const [agentStates, setAgentStates] = useState<Record<string, AgentRunState>>(
		{},
	);
	const [completedOrder, setCompletedOrder] = useState<string[]>([]);
	const [phase, setPhase] = useState<
		"idle" | "shuffling" | "ready" | "orbiting" | "completed"
	>("idle");
	const [invokeInput, setInvokeInput] = useState("");
	const [invokeError, setInvokeError] = useState("");
	const [invokeSignal, setInvokeSignal] = useState(0);
	const svgRef = useRef<SVGSVGElement | null>(null);
	const timerRef = useRef<d3.Timer | null>(null);
	const timeoutsRef = useRef<number[]>([]);
	const stateRef = useRef<Record<string, AgentRunState>>({});
	const baseAnglesRef = useRef<Record<string, number>>({});
	const invokeInputRef = useRef("");
	const invokeRunIdRef = useRef(0);

	useEffect(() => {
		stateRef.current = agentStates;
	}, [agentStates]);

	useEffect(() => {
		const candidateCount =
			matches.length >= MIN_CANDIDATES
				? Math.min(matches.length, MAX_CANDIDATES)
				: matches.length;
		const pickedCandidates = shuffleList(matches).slice(0, candidateCount);
		setCandidates(pickedCandidates);

		if (startSignal === 0) {
			setSelectedAgents([]);
			setAgentStates({});
			setCompletedOrder([]);
			setPhase("idle");
			setInvokeInput("");
			setInvokeError("");
			setInvokeSignal(0);
			invokeInputRef.current = "";
			invokeRunIdRef.current = 0;
			return;
		}
		if (matches.length < MIN_CANDIDATES) {
			setSelectedAgents([]);
			setAgentStates({});
			setCompletedOrder([]);
			setPhase("idle");
			return;
		}
		if (pickedCandidates.length < SELECT_COUNT) {
			setSelectedAgents([]);
			setAgentStates({});
			setCompletedOrder([]);
			setPhase("idle");
			return;
		}

		const picked = shuffleList(pickedCandidates).slice(0, SELECT_COUNT);
		setSelectedAgents(picked);
		setAgentStates(
			Object.fromEntries(picked.map((agent) => [agent.id, { status: "idle" }])),
		);
		setCompletedOrder([]);
		setPhase("shuffling");
	}, [matches, startSignal]);

	useEffect(() => {
		if (!selectedAgents.length || startSignal === 0 || invokeSignal === 0)
			return;

		const runId = invokeSignal;
		const input = invokeInputRef.current;

		setAgentStates((prev) => {
			const next: Record<string, AgentRunState> = { ...prev };
			selectedAgents.forEach((agent) => {
				next[agent.id] = { status: "running" };
			});
			return next;
		});

		selectedAgents.forEach((agent) => {
			(async () => {
				const startedAt = performance.now();
				try {
					const response = await invokeAgentProxy(agent.id, input);
					if (invokeRunIdRef.current !== runId) return;
					const durationMs = Math.round(performance.now() - startedAt);
					setAgentStates((prev) => ({
						...prev,
						[agent.id]: {
							status: "done",
							result: formatProxyResult(response),
							durationMs,
						},
					}));
					setCompletedOrder((prev) =>
						prev.includes(agent.id) ? prev : [...prev, agent.id],
					);
				} catch (error) {
					if (invokeRunIdRef.current !== runId) return;
					const durationMs = Math.round(performance.now() - startedAt);
					const message =
						error instanceof Error ? error.message : "调用外部智能体失败";
					setAgentStates((prev) => ({
						...prev,
						[agent.id]: {
							status: "error",
							result: message,
							durationMs,
						},
					}));
					setCompletedOrder((prev) =>
						prev.includes(agent.id) ? prev : [...prev, agent.id],
					);
				}
			})();
		});
	}, [invokeSignal, selectedAgents, startSignal]);

	useEffect(() => {
		if (!selectedAgents.length) return;
		if (completedOrder.length === selectedAgents.length) {
			timerRef.current?.stop();
			setPhase("completed");
			onComplete?.();
		}
	}, [completedOrder, onComplete, selectedAgents]);

	useEffect(() => {
		timeoutsRef.current.forEach((timeoutId) => {
			window.clearTimeout(timeoutId);
		});
		timeoutsRef.current = [];
		timerRef.current?.stop();
		timerRef.current = null;

		if (
			startSignal === 0 ||
			!svgRef.current ||
			!candidates.length ||
			!selectedAgents.length
		) {
			return undefined;
		}

		const layout = {
			width: 520,
			height: 280,
			centerX: 260,
			centerY: 120,
			radius: 78,
			rackY: 40,
			rackSpacing: 90,
			resultY: 228,
			resultSpacing: 90,
		};

		const svg = d3.select(svgRef.current);
		svg.selectAll("*").remove();
		svg.attr("viewBox", `0 0 ${layout.width} ${layout.height}`);

		svg
			.append("circle")
			.attr("cx", layout.centerX)
			.attr("cy", layout.centerY)
			.attr("r", layout.radius)
			.attr("fill", "none")
			.attr("stroke", "rgba(56,189,248,0.35)")
			.attr("strokeDasharray", "6 6");

		svg
			.append("circle")
			.attr("cx", layout.centerX)
			.attr("cy", layout.centerY)
			.attr("r", 22)
			.attr("fill", "rgba(15,23,42,0.9)")
			.attr("stroke", "rgba(56,189,248,0.8)")
			.attr("strokeWidth", 2);

		svg
			.append("text")
			.attr("x", layout.centerX)
			.attr("y", layout.centerY + 4)
			.attr("textAnchor", "middle")
			.attr("fill", "#e2e8f0")
			.attr("fontSize", "10px")
			.attr("fontWeight", "700")
			.text("JOB");

		const nodesGroup = svg.append("g").attr("class", "agent-nodes");
		const nodes = nodesGroup
			.selectAll<SVGGElement, MatchedAgent>("g.agent-node")
			.data(candidates, (datum: MatchedAgent) => datum.id)
			.enter()
			.append("g")
			.attr("class", "agent-node")
			.style("opacity", 1);

		nodes
			.append("circle")
			.attr("r", 14)
			.attr("fill", "rgba(56,189,248,0.9)")
			.attr("stroke", "rgba(14,116,144,0.8)")
			.attr("strokeWidth", 2);

		nodes
			.append("text")
			.attr("textAnchor", "middle")
			.attr("dy", 4)
			.attr("fill", "#0f172a")
			.attr("fontSize", "9px")
			.attr("fontWeight", "700")
			.text((datum: MatchedAgent) => datum.name.slice(0, 2));

		const rackWidth = (candidates.length - 1) * layout.rackSpacing;
		const rackStartX = layout.centerX - rackWidth / 2;
		const getRackPosition = (index: number) => ({
			x: rackStartX + index * layout.rackSpacing,
			y: layout.rackY,
		});

		nodes.attr("transform", (_datum: MatchedAgent, index: number) => {
			const position = getRackPosition(index);
			return `translate(${position.x},${position.y})`;
		});

		const shuffleSteps = 6;
		const shuffleStepMs = 120;
		const candidateIds = candidates.map((agent) => agent.id);

		for (let step = 0; step < shuffleSteps; step += 1) {
			const timeoutId = window.setTimeout(() => {
				const order = shuffleList(candidateIds);
				nodes
					.transition()
					.duration(shuffleStepMs - 10)
					.attr("transform", (datum: MatchedAgent) => {
						const idx = order.indexOf(datum.id);
						const position = getRackPosition(idx);
						return `translate(${position.x},${position.y})`;
					});
			}, step * shuffleStepMs);
			timeoutsRef.current.push(timeoutId);
		}

		const selectedIds = new Set(selectedAgents.map((agent) => agent.id));
		const selectionDelay = shuffleSteps * shuffleStepMs + 160;
		const selectionTimeout = window.setTimeout(() => {
			const baseAngles = selectedAgents.map(
				(_, index) => (index * 2 * Math.PI) / selectedAgents.length,
			);
			baseAnglesRef.current = Object.fromEntries(
				selectedAgents.map((agent, index) => [agent.id, baseAngles[index]]),
			);

			nodes
				.filter((datum: MatchedAgent) => !selectedIds.has(datum.id))
				.transition()
				.duration(260)
				.style("opacity", 0)
				.remove();

			nodes
				.filter((datum: MatchedAgent) => selectedIds.has(datum.id))
				.transition()
				.duration(400)
				.attr("transform", (datum: MatchedAgent) => {
					const baseAngle = baseAnglesRef.current[datum.id] ?? 0;
					const x = layout.centerX + Math.cos(baseAngle) * layout.radius;
					const y = layout.centerY + Math.sin(baseAngle) * layout.radius;
					return `translate(${x},${y})`;
				});
		}, selectionDelay);
		timeoutsRef.current.push(selectionTimeout);

		const orbitStartTimeout = window.setTimeout(() => {
			setPhase("ready");
			if (invokeSignal === 0) return;
			setPhase("orbiting");
			const orbitNodes = nodesGroup
				.selectAll<SVGGElement, MatchedAgent>("g.agent-node")
				.filter((datum: MatchedAgent) => selectedIds.has(datum.id));

			timerRef.current = d3.timer((elapsed: number) => {
				orbitNodes.each(function (this: SVGGElement, datum: MatchedAgent) {
					const currentState = stateRef.current[datum.id];
					if (currentState?.status !== "running") return;
					const baseAngle = baseAnglesRef.current[datum.id] ?? 0;
					const angle = baseAngle + elapsed * 0.002;
					const x = layout.centerX + Math.cos(angle) * layout.radius;
					const y = layout.centerY + Math.sin(angle) * layout.radius;
					d3.select(this).attr("transform", `translate(${x},${y})`);
				});
			});
		}, selectionDelay + 460);
		timeoutsRef.current.push(orbitStartTimeout);

		return () => {
			timeoutsRef.current.forEach((timeoutId) => {
				window.clearTimeout(timeoutId);
			});
			timeoutsRef.current = [];
			timerRef.current?.stop();
			timerRef.current = null;
		};
	}, [candidates, invokeSignal, selectedAgents, startSignal]);

	useEffect(() => {
		if (!svgRef.current) return;
		const svg = d3.select(svgRef.current);
		svg
			.selectAll<SVGGElement, MatchedAgent>("g.agent-node")
			.select("circle")
			.attr("fill", (datum: MatchedAgent) => {
				const status = agentStates[datum.id]?.status;
				if (status === "idle") return "rgba(148,163,184,0.9)";
				if (status === "done") return "rgba(34,197,94,0.9)";
				if (status === "error") return "rgba(248,113,113,0.9)";
				return "rgba(56,189,248,0.9)";
			});
	}, [agentStates]);

	useEffect(() => {
		if (!svgRef.current || !selectedAgents.length) return;

		const layout = {
			centerX: 260,
			resultY: 228,
			resultSpacing: 90,
		};
		const resultWidth = (selectedAgents.length - 1) * layout.resultSpacing;
		const resultStartX = layout.centerX - resultWidth / 2;
		const selectedIds = new Set(selectedAgents.map((agent) => agent.id));
		const svg = d3.select(svgRef.current);

		svg
			.selectAll<SVGGElement, MatchedAgent>("g.agent-node")
			.filter((datum: MatchedAgent) => selectedIds.has(datum.id))
			.each(function (this: SVGGElement, datum: MatchedAgent) {
				const state = agentStates[datum.id];
				if (!state || state.status === "running") return;
				const index = completedOrder.indexOf(datum.id);
				if (index < 0) return;
				const targetX = resultStartX + index * layout.resultSpacing;
				d3.select(this)
					.transition()
					.duration(500)
					.attr("transform", `translate(${targetX},${layout.resultY})`);
			});
	}, [agentStates, completedOrder, selectedAgents]);

	useMemo(() => {
		const selectedIds = selectedAgents.map((agent) => agent.id);
		const orderedIds = [
			...completedOrder,
			...selectedIds.filter((id) => !completedOrder.includes(id)),
		];
		return orderedIds
			.map((id) => selectedAgents.find((agent) => agent.id === id))
			.filter((agent): agent is MatchedAgent => Boolean(agent));
	}, [completedOrder, selectedAgents]);

	const isActive = startSignal > 0;
	const isReadyForInput = phase === "ready" && invokeSignal === 0;
	const selectedIds = useMemo(
		() => new Set(selectedAgents.map((agent) => agent.id)),
		[selectedAgents],
	);

	const handleInvoke = () => {
		const trimmed = invokeInput.trim();
		if (!trimmed) {
			setInvokeError("请先输入一段文本");
			return;
		}
		setInvokeError("");
		invokeInputRef.current = trimmed;
		const nextRunId = invokeRunIdRef.current + 1;
		invokeRunIdRef.current = nextRunId;
		setInvokeSignal(nextRunId);
		setPhase("orbiting");
	};

	if (isActive && matches.length < MIN_CANDIDATES) {
		return (
			<Card className="border-amber-400/20 bg-amber-500/10">
				<CardHeader>
					<h4 className="font-black text-xs uppercase tracking-[0.2em] text-amber-300">
						智能体候选不足
					</h4>
				</CardHeader>
				<CardContent className="text-amber-100 text-sm">
					候选智能体不足 {MIN_CANDIDATES} 个，暂无法进入洗牌与并行调用流程。
				</CardContent>
			</Card>
		);
	}

	if (isActive && candidates.length < SELECT_COUNT) {
		return (
			<Card className="border-amber-400/20 bg-amber-500/10">
				<CardHeader>
					<h4 className="font-black text-xs uppercase tracking-[0.2em] text-amber-300">
						智能体随机选择
					</h4>
				</CardHeader>
				<CardContent className="text-amber-100 text-sm">
					匹配到的智能体不足 3 个，暂无法执行随机抽取与并行调用。
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="border-cyan-400/20 bg-gradient-to-br from-slate-950/70 via-slate-950/60 to-cyan-950/40">
			<CardHeader>
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h4 className="font-black text-xs uppercase tracking-[0.2em] text-cyan-300">
							随机挑选智能体
						</h4>
						<p className="text-xs text-slate-400 mt-1">
							从 5-8 个候选智能体洗牌抽取 3 个，并行请求结果。
						</p>
					</div>
					<Badge variant={phase === "completed" ? "green" : "blue"}>
						{phase === "completed" ? "全部返回" : "进行中"}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
					<span>候选数: {candidates.length}</span>
					<span>已选中: {selectedAgents.length}</span>
					<span>已返回: {completedOrder.length}</span>
				</div>
				{!isActive ? (
					<div className="rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-xs text-slate-400">
						点击上方按钮开始洗牌与智能体调用。
					</div>
				) : null}
				<div className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3">
					<p className="text-xs uppercase tracking-[0.2em] text-slate-500">
						洗牌候选智能体（{candidates.length} 个）
					</p>
					<div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
						{candidates.map((agent) => (
							<div
								key={agent.id}
								className={`rounded-lg border px-3 py-2 transition-colors ${
									selectedIds.has(agent.id)
										? "border-emerald-400/60 bg-emerald-500/10"
										: "border-white/10 bg-slate-950/60"
								}`}
							>
								<div className="flex items-center justify-between">
									<span className="text-sm font-semibold text-white">
										{agent.name}
									</span>
									<span className="text-[10px] text-cyan-300 font-mono">
										{agent.score !== undefined ? agent.score.toFixed(2) : "—"}
									</span>
								</div>
								<div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
									<span>评级: {agent.rating ?? "—"}</span>
									<span>响应: {agent.avgResponseTimeMs ?? "—"}ms</span>
								</div>
							</div>
						))}
					</div>
				</div>
				{isReadyForInput ? (
					<div className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 space-y-3">
						<p className="text-xs uppercase tracking-[0.2em] text-slate-500">
							输入指令后启动智能体
						</p>
						<textarea
							value={invokeInput}
							onChange={(event) => setInvokeInput(event.target.value)}
							placeholder="输入你希望智能体执行的内容..."
							className="w-full min-h-[96px] rounded-lg bg-slate-950/60 border border-white/10 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
						/>
						{invokeError ? (
							<p className="text-xs text-rose-400">{invokeError}</p>
						) : null}
						<button
							type="button"
							onClick={handleInvoke}
							className="inline-flex items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20 transition-colors"
						>
							开始调用智能体
						</button>
					</div>
				) : null}
				<div className="rounded-2xl border border-cyan-500/10 bg-slate-950/50 p-3">
					<svg ref={svgRef} className="w-full h-[280px]" />
				</div>
				<div className="space-y-3">
					{candidates.map((agent) => {
						const state = agentStates[agent.id];
						const isSelected = selectedIds.has(agent.id);
						const statusText = isSelected
							? statusLabel(state?.status)
							: "未入选";
						const statusVariant = isSelected
							? statusBadgeVariant(state?.status)
							: "outline";
						const canSubscribe = isSelected && state?.status === "done";
						return (
							<div
								key={`matched-${agent.id}`}
								className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3"
							>
								<div className="flex items-center justify-between">
									<span className="text-sm font-semibold text-white">
										{agent.name}
									</span>
									<div className="flex items-center gap-2">
										<Badge variant={isSelected ? "green" : "outline"}>
											{isSelected ? "已选中" : "候选"}
										</Badge>
										<Badge variant={statusVariant}>{statusText}</Badge>
									</div>
								</div>
								<p className="mt-2 text-xs text-slate-400">
									{state?.result ?? "等待智能体返回结果..."}
								</p>
								<div className="mt-3 flex items-center justify-between text-xs text-slate-500">
									<span>
										评分:{" "}
										{agent.score !== undefined ? agent.score.toFixed(2) : "—"}
									</span>
									{onSubscribe ? (
										<Button
											size="sm"
											variant="outline"
											disabled={
												!canSubscribe || subscribingAgentId === agent.id
											}
											onClick={() => onSubscribe(agent)}
										>
											{subscribingAgentId === agent.id
												? "订阅中..."
												: "立即订阅"}
										</Button>
									) : null}
								</div>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
};

export default JobAgentOrbit;
