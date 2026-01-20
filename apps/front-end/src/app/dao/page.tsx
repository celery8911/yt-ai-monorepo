"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Card, CardContent, CardHeader } from "@yt/ui";
import { useWallet } from "@yt/hooks";
import { fetchDisputeList } from "@/apis/dao";

const formatAmount = (amount?: number, currency?: string) => {
  if (amount === undefined) return "--";
  const value = amount.toLocaleString();
  return currency ? `${value} ${currency}` : value;
};

const formatDate = (value?: string) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("zh-CN");
};

const resolveStatusVariant = (status?: string) => {
  if (status === "OPEN" || status === "VOTING") return "yellow";
  if (status === "RESOLVED") return "green";
  return "outline";
};

const DAO = () => {
  const [page] = useState(1);
  const { address, isConnected } = useWallet();
  const { data, isLoading, error } = useQuery({
    queryKey: ["dao-disputes", address, page],
    queryFn: () => fetchDisputeList({ address: address ?? "", page, limit: 6 }),
    enabled: Boolean(address)
  });

  const disputes = useMemo(() => data?.data ?? [], [data]);

  return (
    <div className="max-w-6xl pb-20 mx-auto space-y-10">
      <div className="flex flex-col items-end justify-between gap-6 md:flex-row">
        <div>
          <h1 className="text-4xl font-black neon-text">治理与仲裁</h1>
          <p className="text-slate-400">去中心化的公正核心。持有 CYBER 代币即可参与裁决。</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline">提案指南</Button>
          <Link href="/dao/create">
            <Button className="neon-glow">创建新提案</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="bg-blue-600/5">
          <CardHeader>
            <h4 className="text-xs font-black uppercase">金库状态</h4>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">1,402,000 CYBER</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">
              由所有社区成员共同管理
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h4 className="text-xs font-black uppercase">您的权重</h4>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">4,500 VP</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">
              Voting Power 基于质押量
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h4 className="text-xs font-black uppercase">仲裁成功率</h4>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-emerald-400">98.2%</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">
              全网争议已得到妥善解决
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-black">活跃争议仲裁</h2>
        {error ? (
          <Card className="border-rose-500/20 bg-rose-500/5">
            <CardContent className="p-6 text-sm text-rose-400">争议列表加载失败。</CardContent>
          </Card>
        ) : null}
        {!isConnected ? (
          <Card className="border-white/5 bg-slate-900/30">
            <CardContent className="p-6 text-sm text-slate-500">请先连接钱包查看争议列表。</CardContent>
          </Card>
        ) : null}
        {!isLoading && !error && disputes.length === 0 ? (
          <Card className="border-white/5 bg-slate-900/30">
            <CardContent className="p-6 text-sm text-slate-500">暂无争议记录。</CardContent>
          </Card>
        ) : null}
        {(isLoading ? Array.from({ length: 3 }) : disputes).map((item, index) => {
          const title = isLoading ? "加载中..." : item.jobTitle ?? `争议 #${item.id}`;
          const status = isLoading ? "OPEN" : item.status;
          const amount = isLoading ? undefined : item.escrowAmount;
          const currency = isLoading ? undefined : item.currency;
          const votesFor = isLoading ? 0 : item.votesFor;
          const votesAgainst = isLoading ? 0 : item.votesAgainst;
          const createdAt = isLoading ? undefined : item.createdAt;
          return (
            <Card key={isLoading ? `skeleton-${index}` : item.id} glow className="hover:border-purple-500/30">
              <CardContent className="flex flex-col items-center justify-between gap-6 p-6 md:flex-row">
                <div className="flex-grow space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={resolveStatusVariant(status)}>{status}</Badge>
                    <span className="font-mono text-xs text-slate-500">
                      CASE: #{isLoading ? "----" : item.id.slice(-6)}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold">{title}</h3>
                  <p className="text-xs text-slate-400">
                    托管金额:{" "}
                    <span className="font-black text-blue-400">
                      {formatAmount(amount, currency)}
                    </span>
                    <span className="ml-3 text-slate-500">
                      投票 {votesFor} / {votesAgainst}
                    </span>
                  </p>
                </div>
                <div className="text-right space-y-3 min-w-[150px]">
                  <p className="text-xs font-black tracking-widest uppercase text-rose-500">
                    {status === "RESOLVED" ? "已结束" : `发起于 ${formatDate(createdAt)}`}
                  </p>
                  <Link href={isLoading ? "/dao" : `/dao/${item.id}`}>
                    <Button className="w-full" disabled={isLoading}>
                      参与投票
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DAO;
