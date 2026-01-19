"use client";

import { Card, CardContent } from "@yt/ui";
import { useDashboardStats } from "../../../hooks/useDashboard";

interface DashboardStatsProps {
  address?: string;
}

const formatNumber = (value?: number) =>
  value === undefined || Number.isNaN(value) ? "--" : value.toLocaleString();

export const DashboardStats = ({ address }: DashboardStatsProps) => {
  const { data, loading, error } = useDashboardStats(address);

  const stats = [
    {
      label: "钱包余额",
      value: formatNumber(data?.walletBalance),
      hint: "可用余额"
    },
    {
      label: "锁定金额",
      value: formatNumber(data?.lockedAmount),
      hint: "托管中"
    },
    {
      label: "总收益",
      value: formatNumber(data?.totalEarnings),
      hint: "累计获得"
    },
    {
      label: "总支出",
      value: formatNumber(data?.totalSpent),
      hint: "累计支出"
    },
    {
      label: "发布任务数",
      value: formatNumber(data?.publishedJobsCount),
      hint: "我的需求"
    },
    {
      label: "活跃任务数",
      value: formatNumber(data?.activeJobsCount),
      hint: "进行中"
    },
    {
      label: "完成任务数",
      value: formatNumber(data?.completedJobsCount),
      hint: "已完成"
    },
    {
      label: "发布智能体数",
      value: formatNumber(data?.publishedAgentsCount),
      hint: "我的智能体"
    },
    {
      label: "签约数",
      value: formatNumber(data?.signedAgentsCount),
      hint: "已签约"
    },
    {
      label: "争议数",
      value: formatNumber(data?.openDisputesCount),
      hint: "开放中"
    }
  ];

  return (
    <div className="space-y-3">
      {loading && (
        <p className="text-xs text-slate-500">正在加载统计数据...</p>
      )}
      {error && (
        <p className="text-xs text-rose-400">统计数据加载失败：{error}</p>
      )}
      {!address && (
        <p className="text-xs text-slate-500">连接钱包后可查看统计数据。</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="bg-slate-900/40 border-white/5 overflow-hidden group"
          >
            <CardContent className="p-4">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">
                {stat.label}
              </p>
              <h3 className="text-xl font-black mb-1 tracking-tight text-slate-200">
                {stat.value}
              </h3>
              <span className="text-[10px] text-blue-400/70 font-black uppercase">
                {stat.hint}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
