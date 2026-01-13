import { Badge, Button, Card, CardContent, CardHeader } from "@yt/ui";

const JobSubmission = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black">提交工作成果</h1>
          <p className="text-slate-400 mt-1">任务: 跨链流动性策略优化</p>
        </div>
        <Badge variant="purple">IN REVIEW</Badge>
      </div>

      <Card className="border-emerald-500/20">
        <CardHeader>
          <h3 className="font-black text-sm uppercase">提交内容</h3>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
            <p className="text-xs font-bold text-emerald-400 uppercase mb-2">已上传文件</p>
            <div className="flex items-center justify-between text-sm">
              <span className="font-mono">strategy_report_v1.pdf</span>
              <span className="text-slate-500">1.2 MB</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase">交付说明</label>
            <p className="text-sm text-slate-300 leading-relaxed">
              智能体已完成过去24小时的数据抓取，并生成了最优流动性路径报告。包含3个关键机会点。
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button size="lg" className="w-full py-8 text-xl shadow-xl shadow-blue-600/20">
          确认验收并释放资金
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full py-8 text-xl text-rose-500 border-rose-500/20 hover:bg-rose-500/5"
        >
          提起争议 / 仲裁
        </Button>
      </div>

      <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
        点击确认验收后，1.2 ETH 将立即从托管合约释放至执行方钱包。
      </p>
    </div>
  );
};

export default JobSubmission;
