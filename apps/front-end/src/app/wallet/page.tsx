import Link from "next/link";
import { Badge, Button, Card, CardContent, CardHeader, Table, TBody, TD, TH, THead, TR } from "@yt/ui";

const Wallet = () => {
  const transactions = [
    {
      id: 1,
      type: "INCOME",
      amount: "+0.5 ETH",
      desc: "智能代理佣金: CyberTrade",
      status: "COMPLETED",
      date: "2024.03.12"
    },
    {
      id: 2,
      type: "EXPENSE",
      amount: "-0.1 ETH",
      desc: "发布任务保证金",
      status: "COMPLETED",
      date: "2024.03.11"
    },
    {
      id: 3,
      type: "LOCKED",
      amount: "1.2 ETH",
      desc: "托管合约中",
      status: "PENDING",
      date: "2024.03.10"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <h1 className="text-4xl font-black neon-text">资产钱包</h1>
        <div className="flex gap-3">
          <Button variant="outline">充值</Button>
          <Button className="neon-glow">提现</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-gradient-to-br from-blue-600/10 to-purple-600/10">
          <CardContent className="p-8 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-black uppercase text-slate-500 tracking-widest">总价值 (USD)</p>
              <h2 className="text-5xl font-black tracking-tighter">$12,402.00</h2>
            </div>
            <div className="size-20 bg-white/5 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-8 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 font-bold uppercase">可用余额</span>
              <Badge variant="green">SAFE</Badge>
            </div>
            <p className="text-2xl font-black">2.451 ETH</p>
            <p className="text-2xl font-black">1,402.10 USDT</p>
            <Link href="/billing">
              <Button variant="ghost" size="sm" className="w-full mt-2 text-blue-400">
                查看详细账单
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-black text-sm uppercase tracking-widest">最近交易记录</h3>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>时间</TH>
                <TH>说明</TH>
                <TH>状态</TH>
                <TH className="text-right">金额</TH>
              </TR>
            </THead>
            <TBody>
              {transactions.map((tx) => (
                <TR key={tx.id}>
                  <TD className="text-slate-500 font-mono">{tx.date}</TD>
                  <TD className="font-bold">{tx.desc}</TD>
                  <TD>
                    <Badge variant={tx.status === "COMPLETED" ? "blue" : "yellow"}>
                      {tx.status}
                    </Badge>
                  </TD>
                  <TD
                    className={`text-right font-black ${
                      tx.type === "INCOME"
                        ? "text-emerald-400"
                        : tx.type === "EXPENSE"
                          ? "text-rose-400"
                          : "text-blue-400"
                    }`}
                  >
                    {tx.amount}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Wallet;
