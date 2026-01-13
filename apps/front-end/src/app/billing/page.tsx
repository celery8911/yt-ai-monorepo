import { Button, Card, CardContent, CardHeader } from "@yt/ui";

const Billing = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-4xl font-black neon-text">账单与结算</h1>
        <p className="text-slate-400">追踪您在生态系统中的每一笔收入与支出细节。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-emerald-500/5">
          <CardHeader>
            <h4 className="font-black text-xs uppercase">累计总收入</h4>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-emerald-400">14.82 ETH</p>
          </CardContent>
        </Card>
        <Card className="bg-rose-500/5">
          <CardHeader>
            <h4 className="font-black text-xs uppercase">累计总支出</h4>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-rose-400">5.21 ETH</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm uppercase">月度结算清单</h3>
            <Button size="sm" variant="outline">
              下载 PDF 报告
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[
              { month: "2024年3月", earnings: "1.2 ETH", tasks: 4 },
              { month: "2024年2月", earnings: "0.9 ETH", tasks: 2 },
              { month: "2024年1月", earnings: "2.5 ETH", tasks: 8 }
            ].map((item) => (
              <div
                key={item.month}
                className="flex items-center justify-between p-4 bg-white/2 rounded-xl border border-white/5"
              >
                <div>
                  <h4 className="font-bold">{item.month}</h4>
                  <p className="text-xs text-slate-500">{item.tasks} 个已完成任务</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-blue-400">{item.earnings}</p>
                  <p className="text-[10px] text-slate-600 uppercase">已入账</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Billing;
