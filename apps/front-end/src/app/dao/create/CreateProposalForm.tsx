"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWallet } from "@yt/hooks";
import { Button, Card, CardContent, CardHeader, Input, Textarea } from "@yt/ui";
import { initiateDispute } from "@/apis/dao";

const MAX_REASON_LENGTH = 500;

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

const CreateProposalForm = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { address, isConnected } = useWallet();
	const [jobId, setJobId] = useState(searchParams.get("jobId") ?? "");
	const [escrowId, setEscrowId] = useState(searchParams.get("escrowId") ?? "");
	const [reason, setReason] = useState("");
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const reasonCount = useMemo(() => reason.length, [reason]);

	const handleSubmit = async () => {
		setError("");
		if (!jobId.trim()) {
			setError("请填写关联任务 ID。");
			return;
		}
		if (!reason.trim()) {
			setError("请填写争议原因。");
			return;
		}
		if (!isConnected || !address) {
			setError("请先连接钱包。");
			return;
		}
		if (reason.length > MAX_REASON_LENGTH) {
			setError(`争议原因不能超过 ${MAX_REASON_LENGTH} 字。`);
			return;
		}
		setSubmitting(true);
		try {
			const dispute = await initiateDispute({
				jobId: jobId.trim(),
				escrowId: escrowId.trim() || undefined,
				initiator: address,
				reason: reason.trim(),
			});
			router.push(`/dao/${dispute.id}`);
		} catch (submitError) {
			setError(resolveSubmitError(submitError));
		} finally {
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
					请提交争议原因与相关任务信息，进入 DAO 仲裁流程。
				</p>
			</div>

			<Card className="border-purple-500/20">
				<CardHeader>
					<div className="flex items-center gap-3">
						<span className="size-6 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-black text-white">
							1
						</span>
						<h3 className="font-black text-sm uppercase tracking-widest text-slate-300">
							争议基本信息
						</h3>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					<Input
						label="关联任务 ID"
						placeholder="例如: job_123 或 #JB-204"
						value={jobId}
						onChange={(event) => setJobId(event.target.value)}
					/>
					<Input
						label="托管 ID (可选)"
						placeholder="例如: escrow_001"
						value={escrowId}
						onChange={(event) => setEscrowId(event.target.value)}
					/>
					<Textarea
						label="争议原因"
						placeholder="请说明争议点与补充说明..."
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
				>
					取消
				</Button>
				<Button
					className="flex-grow py-6 bg-purple-600 hover:bg-purple-500 shadow-xl shadow-purple-600/30"
					onClick={handleSubmit}
					disabled={submitting}
				>
					{submitting ? "提交中..." : "提交争议"}
				</Button>
			</div>

			<p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
				争议提交后将进入 DAO 投票期，请等待社区裁决。
			</p>
		</div>
	);
};

export default CreateProposalForm;
