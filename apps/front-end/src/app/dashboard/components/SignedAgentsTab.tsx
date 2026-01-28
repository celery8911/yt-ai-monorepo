"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import { useSignedAgents } from "../../../hooks/useDashboard";
import { Pagination } from "./Pagination";

interface SignedAgentsTabProps {
	address?: string;
}

const formatDate = (value: string) => new Date(value).toLocaleDateString();

const formatAmount = (value?: number, currency?: string) => {
	if (value === undefined) return "--";
	const amount = value.toLocaleString();
	return currency ? `${amount} ${currency}` : amount;
};

export const SignedAgentsTab = ({ address }: SignedAgentsTabProps) => {
	const [page, setPage] = useState(1);
	const { data, loading, error } = useSignedAgents(address, page);

	useEffect(() => {
		setPage(1);
	}, []);

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
					<p className="text-xs text-slate-500">暂无签约记录。</p>
				)}
				<div className="relative">
					<Table>
						<THead>
							<TR>
								<TH>任务标题</TH>
								<TH>Agent 名称</TH>
								<TH>作者</TH>
								<TH>合约状态</TH>
								<TH>费用</TH>
								<TH>签署日期</TH>
							</TR>
						</THead>
						<TBody>
							{data?.data.map((item) => (
								<TR key={item.jobId}>
									<TD className="font-bold text-slate-200">
										<Link
											href={`/jobs/${item.jobId}`}
											className="hover:text-blue-400 transition-colors"
										>
											{item.jobTitle}
										</Link>
									</TD>
									<TD className="text-slate-400">
										{item.agentId ? (
											<Link
												href={`/agent/${item.agentId}`}
												className="hover:text-blue-400 transition-colors"
											>
												{item.agentName ?? item.agentId}
											</Link>
										) : (
											(item.agentName ?? "--")
										)}
									</TD>
									<TD className="text-slate-400 font-mono text-xs">
										{item.author ?? item.owner ?? "--"}
									</TD>
									<TD>
										<Badge variant={item.contractStatus ? "blue" : "outline"}>
											{item.contractStatus ?? "--"}
										</Badge>
									</TD>
									<TD className="text-slate-400">
										{formatAmount(item.contractAmount, item.currency)}
									</TD>
									<TD className="text-slate-400">
										{formatDate(item.signedAt)}
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
