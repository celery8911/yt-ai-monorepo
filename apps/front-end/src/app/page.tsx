"use client";

import { useRouter } from "next/navigation";
import { Button, Card, CardContent } from "@yt/ui";

const Home = () => {
  const router = useRouter();

  return (
    <div className="space-y-24 pb-20">
      <section className="relative pt-12 text-center flex flex-col items-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-8 neon-glow">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
          WEB3 AI GENERATION V2.0 IS LIVE
        </div>

        <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-none mb-6">
          构建、交易 <br />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-500 bg-clip-text text-transparent neon-text">
            去中心化 AI
          </span>
        </h1>

        <p className="max-w-2xl text-slate-400 text-lg md:text-xl font-medium leading-relaxed mb-10">
          CyberAgent 是全球首个基于 Web3 构建的高性能 AI 智能体市场。
          在这里，智能不再受限，算力服务于每一个灵魂。
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" className="px-10" onClick={() => router.push("/market")}
          >
            立即探索市场
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="px-10"
            onClick={() => router.push("/create")}
          >
            发布智能体
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "活跃智能代理", value: "1,420+", icon: "🤖" },
          { label: "累计交易额", value: "$12.5M", icon: "💎" },
          { label: "节点网络状态", value: "99.9%", icon: "🌐" }
        ].map((stat) => (
          <Card key={stat.label} className="text-center group" glow>
            <CardContent className="py-10">
              <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all">
                {stat.icon}
              </div>
              <p className="text-3xl font-black mb-1 neon-text">{stat.value}</p>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
                {stat.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section>
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl font-black mb-2">热门智能代理</h2>
            <p className="text-slate-400">当前市场上表现最出色的 AI 智能体。</p>
          </div>
          <Button
            variant="ghost"
            className="text-blue-400 hover:text-blue-300"
            onClick={() => router.push("/market")}
          >
            查看更多
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              id: 1,
              name: "CyberTrade Alpha",
              type: "DEFI",
              price: "0.5 ETH",
              desc: "高级量化交易策略，实时监控多链波动并自动执行套利操作。"
            },
            {
              id: 2,
              name: "CodeAssist Pro",
              type: "DEV",
              price: "0.1 ETH/月",
              desc: "基于深度学习的自动化代码审计，支持 Rust, Solidity 等多语言。"
            },
            {
              id: 3,
              name: "Nova Marketing",
              type: "SOCIAL",
              price: "免费试用",
              desc: "全自动社交媒体运营专家，自动生成高转化内容。"
            }
          ].map((agent) => (
            <Card
              key={agent.id}
              glow
              className="flex flex-col h-full border border-white/5 bg-slate-900/40 cursor-pointer"
              onClick={() => router.push(`/agent/${agent.id}`)}
            >
              <div className="h-48 bg-slate-800 relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                <img
                  src={`https://picsum.photos/seed/${agent.name}/800/600`}
                  alt={agent.name}
                  className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 right-4 bg-blue-600 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">
                  {agent.type}
                </span>
              </div>
              <CardContent className="flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold">{agent.name}</h3>
                  <span className="text-blue-400 font-black">{agent.price}</span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-grow">
                  {agent.desc}
                </p>
                <Button
                  className="w-full"
                  onClick={(event) => {
                    event.stopPropagation();
                    router.push(`/agent/${agent.id}`);
                  }}
                >
                  查看详情
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] overflow-hidden relative">
        <div className="absolute inset-0 bg-blue-600 neon-glow opacity-90" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="relative p-12 md:p-24 text-center">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
            准备好迎接 AI 革命了吗？
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
            立即加入 CyberAgent DAO，体验去中心化智能带来的无限可能。连接钱包，开启你的 Web3 旅程。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-slate-100 shadow-xl"
            >
              立即连接钱包
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10"
              onClick={() => router.push("/dao")}
            >
              了解治理详情
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
