"use client";

import { useImmer } from "@yt/hooks";
import { Badge, Button, Card, CardContent, CardHeader, Switch } from "@yt/ui";

const Profile = () => {
  const [security, setSecurity] = useImmer({ notifications: true, auditLog: true });

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row gap-10 items-center border-b border-white/5 pb-10">
        <div className="relative group">
          <div className="absolute inset-0 bg-blue-600 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="size-32 rounded-3xl bg-slate-800 border border-white/10 flex items-center justify-center relative z-10 overflow-hidden">
            <img
              src="https://api.dicebear.com/7.x/pixel-art/svg?seed=0x4f"
              className="w-full h-full scale-110"
              alt="Avatar"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-emerald-500 size-6 rounded-full border-4 border-slate-950 z-20" />
        </div>

        <div className="flex-grow text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
            <h1 className="text-3xl font-black">Agent_Master_2077</h1>
            <Badge variant="purple">Elite Developer</Badge>
          </div>
          <p className="text-slate-500 font-mono text-sm mb-4">0x4F92...B92D1</p>
          <div className="flex gap-4 justify-center md:justify-start">
            <Button variant="outline" size="sm">
              编辑个人资料
            </Button>
            <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-400">
              断开连接
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="font-black text-sm uppercase tracking-widest">安全设置</h3>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold">2FA 身份验证</h4>
                <p className="text-[10px] text-slate-500 uppercase">保护您的账户资产安全</p>
              </div>
              <Switch
                checked={security.notifications}
                onChange={(value) =>
                  setSecurity((draft) => {
                    draft.notifications = value;
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold">操作日志上链</h4>
                <p className="text-[10px] text-slate-500 uppercase">审计所有 API 调用行为</p>
              </div>
              <Switch
                checked={security.auditLog}
                onChange={(value) =>
                  setSecurity((draft) => {
                    draft.auditLog = value;
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-600/5">
          <CardHeader>
            <h3 className="font-black text-sm uppercase tracking-widest">资产分析</h3>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between mb-8">
              <h4 className="text-2xl font-black neon-text">$12,402.10</h4>
              <span className="text-xs text-emerald-500 font-bold">+2.4% (24H)</span>
            </div>
            <div className="space-y-4">
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
                <div className="h-full bg-blue-500 w-[60%]" />
                <div className="h-full bg-purple-500 w-[25%]" />
                <div className="h-full bg-slate-600 w-[15%]" />
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter text-slate-500">
                <span className="flex items-center gap-1">
                  <div className="size-2 rounded-full bg-blue-500" /> ETH
                </span>
                <span className="flex items-center gap-1">
                  <div className="size-2 rounded-full bg-purple-500" /> USDT
                </span>
                <span className="flex items-center gap-1">
                  <div className="size-2 rounded-full bg-slate-600" /> OTHER
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
