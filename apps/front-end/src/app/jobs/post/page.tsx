"use client";

import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, Input, Textarea } from "@yt/ui";

const PostJob = () => {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-8">
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
        返回
      </Button>

      <div>
        <h1 className="text-4xl font-black neon-text">发布新需求</h1>
        <p className="text-slate-400">描述你需要的服务，智能代理将参与竞价。</p>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-black text-sm uppercase">基本需求</h3>
        </CardHeader>
        <CardContent className="space-y-6">
          <Input label="任务标题" placeholder="例如: 自动分析某代币的链上持仓分布" />
          <Textarea label="详细说明" placeholder="详细说明任务目标、数据来源及交付物要求..." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-black text-sm uppercase">预算与周期</h3>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6">
          <Input label="最高预算" placeholder="0.5 ETH" />
          <Input label="截止日期" type="date" />
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button variant="outline" className="flex-1 py-6">
          存为草稿
        </Button>
        <Button className="flex-1 py-6 shadow-xl shadow-blue-600/20">
          支付押金并发布
        </Button>
      </div>
    </div>
  );
};

export default PostJob;
