"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Badge, Button, Card, CardContent, CardHeader, Input, Textarea } from "@yt/ui";

const CreateAgent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = searchParams.get("edit") === "true";

  return (
    <div className="max-w-3xl mx-auto pb-20 space-y-10">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="text-slate-400 hover:text-blue-400 group mb-4"
      >
        <svg
          className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        返回
      </Button>

      <div className="text-center">
        <h1 className="text-5xl font-black mb-4 tracking-tighter">
          {isEdit ? "编辑" : "上传"} <span className="text-blue-500">智能体</span>
        </h1>
        <p className="text-slate-400">配置您的 AI 代理，连接全球去中心化算力网络。</p>
      </div>

      <Card className="border-blue-500/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="size-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black">
              1
            </span>
            <h3 className="font-black text-sm uppercase tracking-widest">元数据配置</h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="代理名称"
              placeholder="例如: CyberTrade Pro"
              defaultValue={isEdit ? "CyberTrade Alpha" : ""}
            />
            <Input
              label="分类"
              placeholder="DEFI / DEV / SOCIAL"
              defaultValue={isEdit ? "DEFI" : ""}
            />
          </div>
          <Textarea
            label="核心说明"
            placeholder="描述您的 AI 代理核心逻辑与优势..."
            defaultValue={
              isEdit
                ? "高级量化交易策略，实时监控多链波动并自动执行套利操作。"
                : ""
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="size-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black">
              2
            </span>
            <h3 className="font-black text-sm uppercase tracking-widest">模型接口与安全</h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Input
            label="Endpoint URL"
            placeholder="https://api.your-model.ai/v1"
            icon={
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
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.828 14.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.101-1.101"
                />
              </svg>
            }
          />
          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold mb-1">启用 ZK 隐私保护</h4>
              <p className="text-[10px] text-slate-500 uppercase">
                所有输入数据将通过零知识证明处理
              </p>
            </div>
            <Badge variant="blue">ACTIVE</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button variant="outline" className="flex-grow py-6" onClick={() => router.back()}>
          取消
        </Button>
        <Button className="flex-grow py-6 bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/30">
          {isEdit ? "保存更改" : "发布到市场"}
        </Button>
      </div>
    </div>
  );
};

export default CreateAgent;
