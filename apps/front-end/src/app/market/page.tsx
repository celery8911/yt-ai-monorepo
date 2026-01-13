"use client";

import { Badge, Button, Card, CardContent, Input } from "@yt/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const Market = () => {
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const router = useRouter();

  const categories = [
    { id: "ALL", label: "全部" },
    { id: "DEFI", label: "金融交易" },
    { id: "DEV", label: "编程开发" },
    { id: "SOCIAL", label: "社交文案" },
    { id: "DATA", label: "数据分析" }
  ];

  const agents = [
    {
      id: 1,
      name: "LlamaQuant V3",
      category: "DEFI",
      rating: 4.9,
      price: "0.2 ETH",
      desc: "基于神经网络的跨链套利机器人。",
      status: "HOT",
      tags: ["High APY", "Verified"]
    },
    {
      id: 2,
      name: "Solidity Guard",
      category: "DEV",
      rating: 4.8,
      price: "0.05 ETH",
      desc: "实时扫描以太坊合约安全漏洞。",
      status: "NEW",
      tags: ["Security", "Realtime"]
    },
    {
      id: 3,
      name: "Ghost Writer AI",
      category: "SOCIAL",
      rating: 4.7,
      price: "免费",
      desc: "利用生成式AI自动维护社媒运营。",
      status: "FREE",
      tags: ["Viral", "Auto"]
    },
    {
      id: 4,
      name: "ScanChain Analytica",
      category: "DATA",
      rating: 4.9,
      price: "100 USDT",
      desc: "深度挖掘大户链上异动轨迹。",
      status: "PRO",
      tags: ["On-chain", "Whale"]
    },
    {
      id: 5,
      name: "BotMaster 2000",
      category: "DEV",
      rating: 4.5,
      price: "0.3 ETH",
      desc: "图形化一键部署智能合约机器人。",
      status: "POPULAR",
      tags: ["Low-code", "Multichain"]
    },
    {
      id: 6,
      name: "NFT Hunter Alpha",
      category: "DEFI",
      rating: 4.6,
      price: "0.15 ETH",
      desc: "精准扫描低估值NFT藏品市场。",
      status: "HOT",
      tags: ["NFT", "Sniper"]
    },
    {
      id: 7,
      name: "EtherScribe",
      category: "DEV",
      rating: 4.9,
      price: "0.1 ETH",
      desc: "自动生成详尽的合约技术文档。",
      status: "NEW",
      tags: ["Documentation", "Audit"]
    },
    {
      id: 8,
      name: "TrendOracle",
      category: "DATA",
      rating: 4.4,
      price: "50 USDT",
      desc: "基于市场情绪分析的价格预测系统。",
      status: "PRO",
      tags: ["Predictive", "Sentiment"]
    }
  ];

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchCat = activeTab === "ALL" || agent.category === activeTab;
      const matchSearch =
        agent.name.toLowerCase().includes(search.toLowerCase()) ||
        agent.desc.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeTab, search, agents]);

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="max-w-xl">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter leading-none">
            <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent neon-text">
              探索
            </span>
            智能前沿
          </h1>
          <p className="text-slate-400 font-medium">
            在去中心化市场中发现、测试并部署最强大的 AI 智能代理。
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <Link href="/create">
            <Button className="w-full sm:w-auto neon-glow bg-blue-600 whitespace-nowrap">
              发布智能体
            </Button>
          </Link>
          <Input
            placeholder="搜索智能体..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="sm:min-w-[300px]"
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            }
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pb-4 border-b border-white/5 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveTab(cat.id)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === cat.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-white/20"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAgents.length > 0 ? (
          filteredAgents.map((agent) => (
            <Card
              key={agent.id}
              glow
              className="flex flex-col group border-white/5 hover:border-blue-500/30 cursor-pointer"
              onClick={() => router.push(`/agent/${agent.id}`)}
            >
              <div className="aspect-video relative overflow-hidden bg-slate-800">
                <img
                  src={`https://picsum.photos/seed/${agent.id}/600/400`}
                  alt={agent.name}
                  className="w-full h-full object-cover opacity-40 group-hover:scale-110 group-hover:opacity-60 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
                <div className="absolute top-3 left-3 flex gap-1">
                  <Badge
                    variant={
                      agent.status === "HOT"
                        ? "red"
                        : agent.status === "NEW"
                          ? "green"
                          : "blue"
                    }
                  >
                    {agent.status}
                  </Badge>
                </div>
              </div>

              <CardContent className="flex-grow flex flex-col p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold group-hover:text-blue-400 transition-colors">
                    {agent.name}
                  </h3>
                  <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {agent.rating}
                  </div>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed mb-4 line-clamp-2">
                  {agent.desc}
                </p>

                <div className="flex flex-wrap gap-1 mb-6">
                  {agent.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-[9px] lowercase opacity-60"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase font-black">
                      授权费用
                    </span>
                    <span className="text-md font-black text-blue-400">
                      {agent.price}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="px-4"
                    onClick={(event) => {
                      event.stopPropagation();
                      router.push(`/agent/${agent.id}`);
                    }}
                  >
                    详情
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center flex flex-col items-center">
            <div className="size-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-slate-600">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">未找到匹配的智能体</h3>
            <p className="text-slate-500">尝试更换搜索词或选择不同的分类。</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Market;
