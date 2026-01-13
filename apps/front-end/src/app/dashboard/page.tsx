import Link from "next/link";
import { Badge, Button, Card, CardContent, CardHeader, Table, TBody, TD, TH, THead, TR } from "@yt/ui";

const Dashboard = () => {
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
            欢迎回来，高级协调员。您有 3 个待验收的任务，2 个新的竞价提醒。
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "可用资产", value: "2.45 ETH", change: "≈ $8,420", color: "blue" },
          { label: "待收收益", value: "1.20 ETH", change: "3 个进行中", color: "purple" },
          { label: "节点信任分", value: "998", change: "顶级权重", color: "green" },
          { label: "提案投票权", value: "4.5k", change: "DAO 治理", color: "yellow" }
        ].map((stat) => (
          <Card
            key={stat.label}
            className="bg-slate-900/40 border-white/5 overflow-hidden group hover:scale-[1.02] transition-transform"
          >
            <CardContent className="p-6 relative">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">
                {stat.label}
              </p>
              <h3 className="text-2xl font-black mb-2 tracking-tight group-hover:text-blue-400 transition-colors">
                {stat.value}
              </h3>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black uppercase text-blue-400/70">
                  {stat.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm uppercase tracking-widest">
                智能体状态监控
              </h3>
              <Link href="/market" className="text-[10px] font-bold text-blue-400 hover:underline">
                查看全部市场
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <TR>
                  <TH>标识</TH>
                  <TH>运行任务</TH>
                  <TH>负载</TH>
                  <TH>状态</TH>
                  <TH className="text-right">管理</TH>
                </TR>
              </THead>
              <TBody>
                {[
                  { id: "T-Alpha", task: "Sentiment Tracking", load: "42%", status: "ONLINE" },
                  { id: "Q-Sniper", task: "Arbitrage Cycle #9", load: "88%", status: "BUSY" },
                  { id: "D-Guard", task: "Contract Audit", load: "12%", status: "ONLINE" }
                ].map((item) => (
                  <TR key={item.id}>
                    <TD className="font-bold text-blue-400">{item.id}</TD>
                    <TD className="font-bold text-slate-300">{item.task}</TD>
                    <TD className="font-mono text-slate-500">{item.load}</TD>
                    <TD>
                      <Badge variant={item.status === "ONLINE" ? "green" : "yellow"}>
                        {item.status}
                      </Badge>
                    </TD>
                    <TD className="text-right">
                      <Link href="/create?edit=true">
                        <button
                          type="button"
                          className="text-slate-500 hover:text-white transition-colors"
                          aria-label="编辑智能体"
                        >
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                      </Link>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-slate-900/60">
            <CardHeader>
              <h3 className="font-black text-sm uppercase tracking-widest">快捷任务流</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/jobs/post" className="block">
                <div className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
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
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold">发布新需求</p>
                    <p className="text-[10px] text-slate-500">寻找合适的 AI 代理</p>
                  </div>
                </div>
              </Link>
              <Link href="/dao" className="block">
                <div className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
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
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold">治理仲裁</p>
                    <p className="text-[10px] text-slate-500">处理争议案件</p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
