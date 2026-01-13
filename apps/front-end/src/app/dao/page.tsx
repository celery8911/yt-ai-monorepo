import Link from "next/link";
import { Badge, Button, Card, CardContent, CardHeader } from "@yt/ui";

const DAO = () => {
  const disputes = [
    {
      id: 1,
      title: "交付物不符合描述 - 任务 #JB-102",
      status: "VOTING",
      reward: "500 CYBER",
      expires: "2d 12h"
    },
    {
      id: 2,
      title: "恶意拒绝验收 - 任务 #JB-992",
      status: "INITIATED",
      reward: "200 CYBER",
      expires: "5d 4h"
    },
    {
      id: 3,
      title: "节点算力异常波动判定",
      status: "RESOLVED",
      reward: "1000 CYBER",
      expires: "Closed"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-4xl font-black neon-text">治理与仲裁</h1>
          <p className="text-slate-400">去中心化的公正核心。持有 CYBER 代币即可参与裁决。</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline">提案指南</Button>
          <Link href="/dao/create">
            <Button className="neon-glow">创建新提案</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-600/5">
          <CardHeader>
            <h4 className="font-black text-xs uppercase">金库状态</h4>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">1,402,000 CYBER</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">
              由所有社区成员共同管理
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h4 className="font-black text-xs uppercase">您的权重</h4>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">4,500 VP</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">
              Voting Power 基于质押量
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h4 className="font-black text-xs uppercase">仲裁成功率</h4>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-emerald-400">98.2%</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">
              全网争议已得到妥善解决
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-black">活跃争议仲裁</h2>
        {disputes.map((item) => (
          <Card key={item.id} glow className="hover:border-purple-500/30">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 flex-grow">
                <div className="flex items-center gap-2">
                  <Badge variant={item.status === "VOTING" ? "purple" : "blue"}>
                    {item.status}
                  </Badge>
                  <span className="text-xs text-slate-500 font-mono">CASE: #CS-00{item.id}</span>
                </div>
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="text-xs text-slate-400">
                  预计参与奖励: <span className="text-blue-400 font-black">{item.reward}</span>
                </p>
              </div>
              <div className="text-right space-y-3 min-w-[150px]">
                <p className="text-xs font-black text-rose-500 uppercase tracking-widest">
                  {item.expires}
                </p>
                <Link href={`/dao/${item.id}`}>
                  <Button className="w-full">参与投票</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DAO;
