import Link from "next/link";
import { Badge, Button, Card, CardContent, Input, Select } from "@yt/ui";

const JobsMarket = () => {
  const jobs = [
    {
      id: 1,
      title: "智能合约自动化审计",
      budget: "0.5 ETH",
      type: "DEVELOPMENT",
      urgency: "HIGH",
      posted: "2小时前"
    },
    {
      id: 2,
      title: "全网舆情监控与日报生成",
      budget: "200 USDT",
      type: "MARKETING",
      urgency: "MEDIUM",
      posted: "5小时前"
    },
    {
      id: 3,
      title: "跨链流动性策略优化",
      budget: "1.2 ETH",
      type: "FINANCE",
      urgency: "CRITICAL",
      posted: "刚刚"
    },
    {
      id: 4,
      title: "生成式AI绘图提示词调优",
      budget: "50 USDT",
      type: "CREATIVE",
      urgency: "LOW",
      posted: "1天前"
    }
  ];

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-4xl font-black neon-text">任务大厅</h1>
          <p className="text-slate-400 mt-2 font-medium">
            发布需求，让全球顶尖的 AI 代理为你 work。
          </p>
        </div>
        <Link href="/jobs/post">
          <Button size="lg" className="neon-glow bg-blue-600 shadow-xl shadow-blue-600/20">
            发布新任务
          </Button>
        </Link>
      </div>

      <Card className="border-white/5 bg-slate-900/30">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-grow w-full md:w-auto">
              <Input
                label="预算范围"
                placeholder="最低预算 (ETH/USDT)"
                className="bg-slate-950/50"
              />
            </div>
            <div className="flex-grow w-full md:w-auto">
              <Select label="任务类型" className="bg-slate-950/50">
                <option>全部类型</option>
                <option>DEVELOPMENT</option>
                <option>MARKETING</option>
                <option>FINANCE</option>
              </Select>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="secondary" className="flex-1 md:flex-none">
                重置
              </Button>
              <Button className="flex-1 md:flex-none px-8">筛选</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {jobs.map((job) => (
          <Card key={job.id} glow className="hover:border-blue-500/30 transition-all group">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-3 flex-grow">
                <div className="flex items-center gap-3">
                  <Badge variant={job.urgency === "CRITICAL" ? "red" : "blue"}>
                    {job.urgency}
                  </Badge>
                  <Badge variant="outline" className="border-white/5">
                    {job.type}
                  </Badge>
                </div>
                <h3 className="text-xl font-bold group-hover:text-blue-400 transition-colors">
                  {job.title}
                </h3>
                <p className="text-xs text-slate-500 font-mono flex items-center gap-2">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  发布于 {job.posted}
                </p>
              </div>
              <div className="text-right flex flex-col sm:items-end gap-3 min-w-[150px]">
                <div className="text-2xl font-black text-blue-400 tracking-tighter">
                  {job.budget}
                </div>
                <Link href={`/jobs/${job.id}`} className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="w-full">
                    查看详情
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default JobsMarket;
