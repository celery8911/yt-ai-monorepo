"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge, Button, Card, CardContent, CardHeader, Tabs } from "@yt/ui";

const AgentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const agent = {
    name: "CyberTrade Alpha v3.0",
    developer: "QuantLabs DAO",
    category: "DEFI",
    price: "0.45 ETH",
    rating: 4.95,
    users: "2,401",
    description:
      "CyberTrade Alpha 是市场上最先进的去中心化量化代理，支持多达 14 条公链。它利用实时深度学习模型预测市场剧烈波动，并在亚毫秒级内执行复杂的套利策略。",
    features: [
      "毫秒级跨链套利",
      "风险自动对冲协议",
      "自定义止盈止损策略",
      "24/7 实时数据流支持"
    ]
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <Button
        variant="ghost"
        onClick={() => router.push("/market")}
        className="text-slate-400 hover:text-blue-400 group"
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
        返回市场
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="aspect-video glass rounded-3xl overflow-hidden relative border border-white/10 group">
            <img
              src={`https://picsum.photos/seed/${id ?? "cybertrade"}/1200/800`}
              className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-all duration-700"
              alt="Agent Preview"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8 flex items-end gap-6">
              <div className="size-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/50">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <Badge variant="red" className="mb-2">
                  Verified Enterprise
                </Badge>
                <h1 className="text-3xl font-black tracking-tighter neon-text">
                  {agent.name}
                </h1>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Tabs
              tabs={[
                { id: "overview", label: "详情概览" },
                { id: "metrics", label: "性能指标" },
                { id: "reviews", label: "用户评价" }
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />

            <div className="prose prose-invert max-w-none">
              {activeTab === "overview" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <p className="text-slate-400 text-lg leading-relaxed">
                    {agent.description}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {agent.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5"
                      >
                        <div className="size-2 rounded-full bg-blue-500" />
                        <span className="text-sm font-bold">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === "metrics" && (
                <div className="p-8 bg-black/40 rounded-3xl border border-white/5 font-mono text-sm space-y-4">
                  <p className="text-emerald-500">&gt;&gt; 初始化性能审计模块...</p>
                  <p className="text-slate-500">
                    &gt; 平均响应时间: <span className="text-white">12.4ms</span>
                  </p>
                  <p className="text-slate-500">
                    &gt; 预测准确率: <span className="text-white">94.2%</span>
                  </p>
                  <p className="text-slate-500">
                    &gt; Uptime: <span className="text-white">99.998%</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card glow className="bg-slate-900/60 sticky top-24">
            <CardHeader>
              <h3 className="font-black text-sm uppercase tracking-widest text-slate-500">
                订阅协议
              </h3>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-end justify-between">
                <span className="text-sm text-slate-400">授权费用</span>
                <span className="text-3xl font-black text-blue-400">
                  {agent.price}
                </span>
              </div>

              <div className="space-y-3 py-6 border-y border-white/5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">评分</span>
                  <span className="font-bold text-yellow-400">⭐ {agent.rating}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">开发者</span>
                  <span className="font-bold text-blue-400 underline">
                    {agent.developer}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full bg-blue-600 hover:bg-blue-500 py-6 text-lg">
                  立即订阅
                </Button>
                <Button variant="outline" className="w-full">
                  免费试用
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgentDetail;
