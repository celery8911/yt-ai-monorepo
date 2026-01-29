"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
	Badge,
	Card,
	CardContent,
	LoadingOverlay,
	Table,
	TBody,
	TD,
	TH,
	THead,
	TR,
} from "@yt/ui";
import { useDisputes } from "../../../hooks/useDashboard";
import { Pagination } from "./Pagination";
import { formatUnits } from "viem";

interface DisputesTabProps {
	address?: string;
}

const formatAmount = (value?: number | string, currency?: string) => {
	if (value === undefined) return "--";
	try {
		const amount =
			typeof value === "number"
				? formatUnits(BigInt(Math.trunc(value)), 18)
				: formatUnits(BigInt(value), 18);
		return currency ? `${amount} ${currency}` : amount;
	} catch {
		return currency ? `-- ${currency}` : "--";
	}
};

const formatDate = (value: string) => new Date(value).toLocaleDateString();

const resolveStatusVariant = (status: string) => {
	if (status === "OPEN" || status === "VOTING") return "yellow";
	if (status === "RESOLVED") return "green";
	return "outline";
};

export const DisputesTab = ({ address }: DisputesTabProps) => {
	const [page, setPage] = useState(1);
	const { data, loading, error } = useDisputes(address, page);

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset page on address change.
	useEffect(() => {
		setPage(1);
	}, [address]);

	const totalPages = useMemo(() => {
		if (!data?.pagination) return 1;
		return Math.max(
			1,
			Math.ceil(data.pagination.total / data.pagination.limit),
		);
	}, [data]);

	return (
		<Card className="bg-slate-900/40 border-white/5">
			<CardContent className="p-6 space-y-4">
				{error && <p className="text-xs text-rose-400">加载失败：{error}</p>}
				{!loading && !error && data?.data.length === 0 && (
					<p className="text-xs text-slate-500">暂无争议记录。</p>
				)}
				<div className="relative">
					<Table>
						<THead>
							<TR>
								<TH>Agent 名称</TH>
								<TH>争议状态</TH>
								<TH>发起人</TH>
								<TH>金额</TH>
								<TH>投票进度</TH>
								<TH>创建日期</TH>
							</TR>
						</THead>
						<TBody>
							{data?.data.map((dispute) => (
								<TR key={dispute.id}>
									<TD className="font-bold text-slate-200">
										<Link
											href={`/dao/${dispute.id}`}
											className="hover:text-blue-400 transition-colors"
										>
											{dispute.agentName ?? dispute.jobTitle ?? "--"}
										</Link>
									</TD>
									<TD>
										<Badge variant={resolveStatusVariant(dispute.status)}>
											{dispute.status}
										</Badge>
									</TD>
									<TD className="text-slate-400">
										{dispute.initiator}
										{(dispute.isMyInitiated ||
											dispute.role === "INITIATOR") && (
											<Badge variant="blue" className="ml-2">
												我发起
											</Badge>
										)}
									</TD>
									<TD className="text-slate-400">
										{formatAmount(dispute.escrowAmount, dispute.currency)}
									</TD>
									<TD className="text-slate-400">
										{dispute.votesFor} / {dispute.votesAgainst}
									</TD>
									<TD className="text-slate-400">
										{formatDate(dispute.createdAt)}
									</TD>
								</TR>
							))}
						</TBody>
					</Table>
					{loading && <LoadingOverlay />}
				</div>
				{data?.pagination && (
					<Pagination
						page={data.pagination.page}
						totalPages={totalPages}
						onChange={setPage}
					/>
				)}
			</CardContent>
		</Card>
	);
};
