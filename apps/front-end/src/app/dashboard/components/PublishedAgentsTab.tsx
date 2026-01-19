"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Card, CardContent, Table, TBody, TD, TH, THead, TR } from "@yt/ui";
import { usePublishedAgents } from "../../../hooks/useDashboard";
import { Pagination } from "./Pagination";

interface PublishedAgentsTabProps {
  address?: string;
}

const formatPrice = (value?: number, currency?: string) => {
  if (value === undefined) return "--";
  const amount = value.toLocaleString();
  return currency ? `${amount} ${currency}` : amount;
};

export const PublishedAgentsTab = ({ address }: PublishedAgentsTabProps) => {
  const [page, setPage] = useState(1);
  const { data, loading, error } = usePublishedAgents(address, page);

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
        {loading && <p className="text-xs text-slate-500">正在加载我的智能体...</p>}
        {error && <p className="text-xs text-rose-400">加载失败：{error}</p>}
        {!loading && !error && data?.data.length === 0 && (
          <p className="text-xs text-slate-500">暂无已发布智能体。</p>
        )}
        <Table>
          <THead>
            <TR>
              <TH>Agent 名称</TH>
              <TH>状态</TH>
              <TH>技能等级</TH>
              <TH>定价</TH>
              <TH>评分</TH>
              <TH>任务数</TH>
              <TH>收益</TH>
            </TR>
          </THead>
          <TBody>
            {data?.data.map((agent) => (
              <TR key={agent.id}>
                <TD className="font-bold text-slate-200">{agent.name}</TD>
                <TD>
                  <Badge variant={agent.isActive ? "green" : "outline"}>
                    {agent.isActive ? "在线" : "离线"}
                  </Badge>
                </TD>
                <TD className="text-slate-400">{agent.skillLevel ?? "--"}</TD>
                <TD className="text-slate-400">
                  {formatPrice(agent.pricePerTask, agent.currency)}
                </TD>
                <TD className="text-slate-400">
                  {agent.rating ? agent.rating.toFixed(2) : "--"}
                </TD>
                <TD className="text-slate-400">
                  {agent.activeJobsCount}/{agent.completedJobsCount}
                </TD>
                <TD className="text-slate-400">
                  {agent.totalEarnings.toLocaleString()}
                </TD>
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
