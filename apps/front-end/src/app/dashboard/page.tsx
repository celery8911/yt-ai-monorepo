"use client";

import { useState } from "react";
import { useWallet } from "@yt/hooks";
import { Tabs } from "@yt/ui";
import { DashboardStats } from "./components/DashboardStats";
import { DisputesTab } from "./components/DisputesTab";
import { PublishedAgentsTab } from "./components/PublishedAgentsTab";
import { PublishedJobsTab } from "./components/PublishedJobsTab";
import { SignedAgentsTab } from "./components/SignedAgentsTab";

const Dashboard = () => {
  const { address, isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState("published-jobs");

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>

          <h1 className="text-4xl md:text-5xl font-black mb-2 neon-text tracking-tighter">
            控制台
          </h1>
          <p className="text-slate-400 font-medium">
            欢迎回来，查看你的任务、智能体与争议状态
          </p>
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
