"use client";

import { Card, CardContent, LoadingOverlay } from "@yt/ui";
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
      label: "发布智能体",
      value: formatNumber(data?.publishedAgentsCount),
      hint: "平台累计"
    },
    {
      label: "活跃合约",
      value: formatNumber(data?.signedAgentsCount),
      hint: "运行中"
    },
    {
      label: "已完成任务",
      value: formatNumber(data?.completedJobsCount),
      hint: "累计完成"
    },
    {
      label: "累计成交额",
      value: formatNumber(data?.totalEarnings),
      hint: "累计成交"
    },
    {
      label: "进行中任务",
      value: formatNumber(data?.activeJobsCount),
      hint: "进行中"
    },
    {
      label: "争议案件",
      value: formatNumber(data?.openDisputesCount),
      hint: "累计争议"
    }
  ];

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-xs text-rose-400">统计数据加载失败：{error}</p>
      )}
      {!address && (
        <p className="text-xs text-slate-500">连接钱包后可查看统计数据。</p>
      )}
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        {loading && <LoadingOverlay />}
      </div>
    </div>
  );
};
