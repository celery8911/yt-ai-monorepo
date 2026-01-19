"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleGenAI } from "@google/genai";
import { Badge, Button, Card, CardContent, CardHeader } from "@yt/ui";

const prompts = [
  "Minimalist futuristic logo for 'CyberAgent', a tech company. The icon is an abstract 'A' combined with a lightning bolt and a neural node. Neon blue and electric purple colors, dark luxury background, vector flat style, 8k, cyberpunk aesthetic.",
  "A high-tech logo featuring a sleek robotic falcon head stylized with geometric lines. Symbolizing agility and AI intelligence. Color palette: Cyber blue and cyber magenta. Glowing elements, professional gaming/tech brand style.",
  "Abstract futuristic cube logo. The cube is made of glowing glass shards and internal glowing circuitry. Represents blockchain and AI processing. Tech blue and deep indigo. Sharp 3D isometric view, clean background.",
  "Cybernetic brain icon logo for 'CyberAgent'. The brain is half human-neural and half silicon-wafer. Glowing blue connections. Modern, sophisticated, minimalist Web3 brand identity."
];

const LogoLabPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [logos, setLogos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? "";

  const handleDownload = (url: string, index: number) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `cyberagent-logo-${index + 1}.png`;
    link.click();
  };

  const generateLogos = async () => {
    if (!apiKey) {
      setError("请先在环境变量中配置 NEXT_PUBLIC_GEMINI_API_KEY。");
      return;
    }

    setError(null);
    setLoading(true);
    setLogos([]);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const generatedImages: string[] = [];

      for (const prompt of prompts) {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: { parts: [{ text: prompt }] },
          config: {
            imageConfig: { aspectRatio: "1:1" }
          }
        });

        const parts = response.candidates?.[0]?.content?.parts ?? [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            generatedImages.push(`data:image/png;base64,${part.inlineData.data}`);
          }
        }
      }

      setLogos(generatedImages);
    } catch (err) {
      console.error("Logo generation failed:", err);
      setError("生成失败，请检查 API Key 和网络环境后重试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col items-center text-center space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="self-start text-slate-500 hover:text-blue-400"
        >
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          返回首页
        </Button>

        <Badge variant="purple" className="px-4 py-1">
          AI 视觉生成系统
        </Badge>
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter neon-text">
          <span className="text-white">CYBER</span>AGENT <br /> LOGO 实验室
        </h1>
        <p className="max-w-2xl text-slate-400 text-lg">
          正在为您的 Web3 AI 市场定制专属视觉标识。点击下方按钮，由 Gemini AI
          生成多款基于“赛博、节点、闪电”元素的酷炫 Logo 方案。
        </p>

        <Button
          size="lg"
          onClick={generateLogos}
          disabled={loading}
          className="px-12 py-8 text-xl bg-blue-600 hover:bg-blue-500 shadow-2xl shadow-blue-600/40 neon-glow"
        >
          {loading ? (
            <span className="flex items-center gap-3">
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              正在构思视觉方案...
            </span>
          ) : (
            "生成酷炫 Logo 方案"
          )}
        </Button>

        {error ? (
          <div className="w-full max-w-2xl rounded-2xl border border-rose-500/20 bg-rose-500/10 px-6 py-4 text-rose-200 text-sm">
            {error}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-square glass rounded-3xl border border-white/5 bg-slate-900/50 flex flex-col items-center justify-center space-y-4"
            >
              <div className="size-12 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin" />
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                渲染层 {i} 初始化中
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && logos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {logos.map((url, idx) => (
            <Card
              key={url}
              className="group relative border-white/5 hover:border-blue-500/50 overflow-hidden"
              glow
            >
              <CardHeader className="flex justify-between items-center py-3">
                <span className="text-[10px] font-black text-slate-500 uppercase">
                  提案 #{idx + 1}
                </span>
                <Badge variant="blue">READY</Badge>
              </CardHeader>
              <div className="aspect-square relative overflow-hidden bg-black">
                <img
                  src={url}
                  alt={`Logo ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                  <Button className="w-full" onClick={() => handleDownload(url, idx)}>
                    下载 4K 原始素材
                  </Button>
                </div>
              </div>
              <CardContent className="bg-slate-900/80 backdrop-blur-md">
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  方案 {idx + 1}：融合了去中心化节点与高速计算的意象，采用极简几何线条，
                  彰显专业与未来感。
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {!loading && logos.length === 0 ? (
        <div className="py-20 flex flex-col items-center opacity-30 grayscale">
          <svg className="w-20 h-20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="font-black text-xs uppercase tracking-widest">等待创意触发器信号...</p>
        </div>
      ) : null}
    </div>
  );
};

export default LogoLabPage;
