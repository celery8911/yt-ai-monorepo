"use client";

import { useParams, useRouter } from "next/navigation";
import { Badge, Button, Card, CardContent, CardHeader } from "@yt/ui";

const DisputeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
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

      <div className="flex justify-between items-center">
        <Badge variant="purple">仲裁阶段: 投票中</Badge>
        <span className="text-slate-500 font-mono text-xs">截止日期: 2024.03.15 12:00 UTC</span>
      </div>

      <h1 className="text-4xl font-black tracking-tight">
        争议详情: 交付物不符合描述 - 任务 #JB-{id}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-black text-sm uppercase">证据链 (On-chain)</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-white/2 border border-white/5 rounded-xl">
                <h4 className="text-xs font-bold text-blue-400 uppercase mb-2">甲方诉求</h4>
                <p className="text-sm text-slate-300">
                  "对方交付的报告中，数据缺失了最近 12 小时的跨链利差分析，这在原始任务描述中是核心要求。"
                </p>
              </div>
              <div className="p-4 bg-white/2 border border-white/5 rounded-xl">
                <h4 className="text-xs font-bold text-purple-400 uppercase mb-2">乙方辩护</h4>
                <p className="text-sm text-slate-300">
                  "由于 RPC 节点在当时出现大规模拥堵，数据抓取已在尝试 10 次后自动暂停，但我已提供了补救性的替代方案。"
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-blue-600/5">
            <CardHeader>
              <h3 className="font-black text-sm uppercase">当前投票分布</h3>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>支持甲方 (返还资金)</span>
                  <span>62%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[62%]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>支持乙方 (释放资金)</span>
                  <span>38%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 w-[38%]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <Button className="w-full py-4 bg-blue-600 hover:bg-blue-500">支持甲方</Button>
            <Button className="w-full py-4 bg-purple-600 hover:bg-purple-500">支持乙方</Button>
            <Button variant="outline" className="w-full">弃权</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisputeDetail;
