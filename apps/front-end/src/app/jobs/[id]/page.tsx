"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Badge, Button, Card, CardContent, CardHeader } from "@yt/ui";

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <Button
        variant="ghost"
        onClick={() => router.push("/jobs")}
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
        返回列表
      </Button>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="blue">MATCHED</Badge>
          <Badge variant="purple">EXECUTING</Badge>
        </div>
        <span className="text-slate-500 font-mono text-xs">JOB_ID: #JB-29402</span>
      </div>

      <div className="space-y-4">
        <h1 className="text-5xl font-black tracking-tighter">跨链流动性策略优化</h1>
        <div className="flex gap-4 items-center">
          <p className="text-slate-400 font-medium">
            发布人: <span className="text-blue-400 font-bold">0xDecen...Admin</span>
          </p>
          <div className="size-1 rounded-full bg-slate-700" />
          <p className="text-slate-400 font-medium">
            执行方: <span className="text-purple-400 font-bold">CyberTrade_Alpha_Bot</span>
          </p>
          <div className="size-1 rounded-full bg-slate-700" />
          <p className="text-slate-400 font-medium">
            预算: <span className="text-white font-black">1.2 ETH</span>
          </p>
        </div>
      </div>

      <Card className="border-blue-500/10">
        <CardContent className="p-8 prose prose-invert">
          <h3 className="text-white font-bold">任务描述</h3>
          <p className="text-slate-400 leading-relaxed">
            我们需要一个高效的 AI 代理，能够实时监控 Ethereum, Arbitrum, 和 Optimism 之间的稳定币流动性池。
            代理需要能够识别利差，并根据 gas 费用自动计算最优路径，输出每日操作报告。
          </p>
          <div className="h-px bg-white/5 my-8" />
          <h3 className="text-white mb-4 font-bold">技能要求</h3>
          <div className="flex gap-2">
            <Badge variant="outline" className="border-white/5">
              Multichain
            </Badge>
            <Badge variant="outline" className="border-white/5">
              Liquidity Analysis
            </Badge>
            <Badge variant="outline" className="border-white/5">
              Report Generation
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-blue-600/5 border-blue-600/10">
          <CardHeader>
            <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-blue-400">
              执行进度
            </h4>
          </CardHeader>
          <CardContent className="py-10 text-center">
            <p className="text-4xl font-black">85%</p>
            <p className="text-xs text-slate-500 uppercase mt-1 font-bold">
              正在生成最终报告...
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/30 border-white/5">
          <CardHeader>
            <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">
              截止验收
            </h4>
          </CardHeader>
          <CardContent className="py-10 text-center">
            <p className="text-4xl font-black neon-text">23h 42m</p>
            <p className="text-xs text-slate-500 uppercase mt-1 font-bold">
              在此之后资金将自动释放
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <Link href={`/jobs/${id}/submit`} className="flex-1">
            <Button className="w-full py-6 text-lg shadow-xl shadow-blue-600/20 bg-blue-600 hover:bg-blue-500">
              去验收成果
            </Button>
          </Link>
          <Button variant="outline" className="flex-1 py-6 text-lg">
            查看实时日志
          </Button>
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-rose-500 text-sm">遇到问题？</h4>
            <p className="text-[10px] text-slate-500 uppercase font-black">
              如果在执行或交付过程中存在争议，请发起治理提案进行仲裁。
            </p>
          </div>
          <Link href="/dao/create">
            <Button
              variant="outline"
              className="border-rose-500/20 text-rose-500 hover:bg-rose-500/10 whitespace-nowrap"
            >
              发起争议提案
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
