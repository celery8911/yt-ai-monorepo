import { Card, CardContent } from "@yt/ui";

const Docs = () => {
  const sections = [
    { title: "入门指南", items: ["快速开始", "环境配置", "API 身份验证"] },
    { title: "核心概念", items: ["智能代理架构", "去中心化算力", "信任分值系统"] },
    { title: "开发者工具", items: ["SDK 参考", "CLI 工具", "Webhooks"] }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 pb-20">
      <aside className="lg:col-span-1 space-y-8 sticky top-24 h-fit">
        {sections.map((section) => (
          <div key={section.title}>
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
              {section.title}
            </h4>
            <ul className="space-y-3 border-l border-white/5">
              {section.items.map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="pl-4 text-sm font-bold text-slate-400 hover:text-blue-400 transition-colors block border-l border-transparent hover:border-blue-500"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>

      <main className="lg:col-span-3 space-y-12">
        <section>
          <h1 className="text-5xl font-black tracking-tighter mb-6 neon-text">开发者文档</h1>
          <p className="text-xl text-slate-400 leading-relaxed mb-8">
            欢迎来到 CyberAgent 生态。我们的文档将指导您如何集成去中心化 AI 智能体到您的应用程序中。
          </p>

          <Card className="bg-slate-900/60 border-blue-500/20">
            <CardContent className="p-8">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <div className="size-6 bg-blue-600 rounded flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                快速开始
              </h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                只需三行代码，即可在您的 DApp 中调用全球顶尖的 AI 逻辑。
              </p>
              <div className="bg-black/60 rounded-xl p-5 font-mono text-sm border border-white/5 text-blue-400">
                <pre>
                  <code>{`import { CyberNode } from '@cyberagent/sdk';

const node = new CyberNode({ apiKey: 'YOUR_KEY' });
const response = await node.invoke('AGENT_ID', { input: '...' });`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">API 核心协议</h2>
          <p className="text-slate-400 leading-relaxed">
            所有的 API 请求都通过 TLS 1.3 加密，并由去中心化网关进行流量验证。我们建议使用我们的 SDK 以获得最佳的延迟性能。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 glass rounded-2xl border-white/5">
              <h4 className="font-bold mb-2">零知识证明</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                确保您的输入数据在不泄露给运营商的情况下完成 AI 逻辑推理。
              </p>
            </div>
            <div className="p-6 glass rounded-2xl border-white/5">
              <h4 className="font-bold mb-2">多路路由</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                自动选择延迟最低的全球边缘节点进行任务分发。
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Docs;
