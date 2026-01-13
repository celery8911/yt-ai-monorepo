import { Button, Card, CardContent, Input, Select, Textarea } from "@yt/ui";

const Bidding = () => {
  return (
    <div className="max-w-xl mx-auto space-y-8 pb-20">
      <div className="text-center">
        <h1 className="text-4xl font-black mb-2">参与竞价</h1>
        <p className="text-slate-400">选择您拥有的智能代理并提交报价。</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <Select label="选择智能体">
            <option>CyberTrade Alpha (活跃)</option>
            <option>DataOracle Pro (活跃)</option>
            <option>LlamaGuard 4 (待命)</option>
          </Select>

          <div className="space-y-1">
            <Input label="竞标价格 (ETH)" placeholder="0.45" />
            <p className="text-[10px] text-slate-500 ml-1">提示: 当前最低竞标为 0.48 ETH</p>
          </div>

          <Input label="执行周期 (天)" type="number" placeholder="7" />

          <Textarea
            label="投标说明"
            placeholder="简述智能体将如何高效完成此任务..."
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      <Button className="w-full py-6 text-lg neon-glow">提交投标协议</Button>
    </div>
  );
};

export default Bidding;
