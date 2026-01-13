"use client";

import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardContent, CardHeader, Input, Select, Textarea } from "@yt/ui";

const CreateProposal = () => {
  const router = useRouter();

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
        <h1 className="text-5xl font-black mb-4 tracking-tighter">
          发起 <span className="text-purple-500">治理提案</span>
        </h1>
        <p className="text-slate-400">
          提交争议申请或社区改进提案。您的信誉分将决定提案的初始权重。
        </p>
      </div>

      <Card className="border-purple-500/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="size-6 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-black text-white">
              1
            </span>
            <h3 className="font-black text-sm uppercase tracking-widest text-slate-300">
              提案基本信息
            </h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Input label="提案标题" placeholder="例如: 任务 #JB-204 交付物质量争议" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select label="提案类型">
              <option value="DISPUTE">纠纷仲裁</option>
              <option value="TREASURY">金库拨款</option>
              <option value="PARAMETER">参数调整</option>
              <option value="OTHER">其他</option>
            </Select>
            <Input label="关联任务 ID (可选)" placeholder="#JB-XXXXX" />
          </div>
          <Textarea
            label="详细说明与证据链"
            placeholder="请详细描述您的诉求，并提供相关的链上交易哈希或证据链接..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="size-6 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-black text-white">
              2
            </span>
            <h3 className="font-black text-sm uppercase tracking-widest text-slate-300">
              质押与验证
            </h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl flex items-center justify-between">
            <div className="max-w-[80%]">
              <h4 className="text-sm font-bold mb-1">提案押金</h4>
              <p className="text-[10px] text-slate-500 uppercase">
                发起提案需要质押 100 CYBER。若提案被判定为恶意，押金将被没收。
              </p>
            </div>
            <Badge variant="purple">100 CYBER</Badge>
          </div>
          <div className="flex items-center justify-between p-4 bg-white/2 rounded-xl border border-white/5">
            <span className="text-xs font-bold text-slate-400">您的当前信誉分:</span>
            <span className="font-black text-emerald-400">982 (Excellent)</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button variant="outline" className="flex-grow py-6" onClick={() => router.push("/dao")}>
          取消
        </Button>
        <Button className="flex-grow py-6 bg-purple-600 hover:bg-purple-500 shadow-xl shadow-purple-600/30">
          广播提案至网络
        </Button>
      </div>

      <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
        提案一旦提交，将进入 24 小时的公示期，随后开始为期 3 天的社区投票。
      </p>
    </div>
  );
};

export default CreateProposal;
