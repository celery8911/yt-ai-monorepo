"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Card, CardContent, Table, TBody, TD, TH, THead, TR } from "@yt/ui";
import { usePublishedJobs } from "../../../hooks/useDashboard";
import { Pagination } from "./Pagination";

interface PublishedJobsTabProps {
  address?: string;
}

const statusVariantMap: Record<string, "blue" | "green" | "yellow" | "red" | "purple"> = {
  OPEN: "blue",
  MATCHING: "purple",
  IN_PROGRESS: "yellow",
  COMPLETED: "green",
  DISPUTED: "red",
  CANCELLED: "red"
};

const formatRange = (min?: number, max?: number, currency?: string) => {
  if (min === undefined && max === undefined) return "--";
  const parts = [min, max]
    .filter((value) => value !== undefined)
    .map((value) => value?.toLocaleString());
  const range = parts.length === 2 ? `${parts[0]} - ${parts[1]}` : `${parts[0]}`;
  return currency ? `${range} ${currency}` : range;
};

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString() : "--";

export const PublishedJobsTab = ({ address }: PublishedJobsTabProps) => {
  const [page, setPage] = useState(1);
  const { data, loading, error } = usePublishedJobs(address, page);

  useEffect(() => {
    setPage(1);
  }, [address]);

  const totalPages = useMemo(() => {
    if (!data?.pagination) return 1;
    return Math.max(1, Math.ceil(data.pagination.total / data.pagination.limit));
  }, [data]);

  return (
    <Card className="bg-slate-900/40 border-white/5">
      <CardContent className="p-6 space-y-4">
        {loading && <p className="text-xs text-slate-500">正在加载发布任务...</p>}
        {error && <p className="text-xs text-rose-400">加载失败：{error}</p>}
        {!loading && !error && data?.data.length === 0 && (
          <p className="text-xs text-slate-500">暂无已发布任务。</p>
        )}
        <Table>
          <THead>
            <TR>
              <TH>任务标题</TH>
              <TH>状态</TH>
              <TH>预算范围</TH>
              <TH>竞价数/已选Agent</TH>
              <TH>截止日期</TH>
            </TR>
          </THead>
          <TBody>
            {data?.data.map((job) => (
              <TR key={job.id}>
                <TD className="font-bold text-slate-200">{job.title}</TD>
                <TD>
                  <Badge variant={statusVariantMap[job.status] ?? "outline"}>
                    {job.status}
                  </Badge>
                </TD>
                <TD className="text-slate-400">
                  {formatRange(job.budgetMin, job.budgetMax, job.currency)}
                </TD>
                <TD className="text-slate-400">
                  {job.bidsCount} / {job.selectedAgentName ?? "未选"}
                </TD>
                <TD className="text-slate-400">{formatDate(job.deadlineAt)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
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
