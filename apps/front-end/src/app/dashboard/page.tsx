"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Button, Tabs } from "@yt/ui";
import { DashboardStats } from "./components/DashboardStats";
import { DisputesTab } from "./components/DisputesTab";
import { PublishedAgentsTab } from "./components/PublishedAgentsTab";
import { PublishedJobsTab } from "./components/PublishedJobsTab";
import { SignedAgentsTab } from "./components/SignedAgentsTab";

const Dashboard = () => {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState("published-jobs");

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-block px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase mb-2">
            系统状态: 协议层 2.0 运行中
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-1 neon-text tracking-tighter">
            指挥中心
          </h1>
          <p className="text-slate-400 font-medium">
            欢迎回来，高级协调员。查看你的任务、智能体与争议状态。
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/jobs/post">
            <Button variant="outline" className="border-white/5">
              发布需求
            </Button>
          </Link>
          <Link href="/create">
            <Button className="neon-glow bg-blue-600 hover:bg-blue-500 px-6">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              部署智能体
            </Button>
          </Link>
        </div>
      </div>

      <DashboardStats address={address} />

      {!isConnected && (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
          请先连接钱包以查看专属的 Dashboard 数据。
        </div>
      )}

      <div className="space-y-6">
        <Tabs
          tabs={[
            { id: "published-jobs", label: "我发布的任务" },
            { id: "published-agents", label: "我的智能体" },
            { id: "signed-agents", label: "已签约智能体" },
            { id: "disputes", label: "争议中心" }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === "published-jobs" && <PublishedJobsTab address={address} />}
        {activeTab === "published-agents" && <PublishedAgentsTab address={address} />}
        {activeTab === "signed-agents" && <SignedAgentsTab address={address} />}
        {activeTab === "disputes" && <DisputesTab address={address} />}
      </div>
    </div>
  );
};

export default Dashboard;
