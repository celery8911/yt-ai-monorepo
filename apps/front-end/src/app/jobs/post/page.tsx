"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, CardContent, CardHeader, Input, Textarea } from "@yt/ui";
import { createJob, type CreateJobPayload } from "@/apis/jobs";

const PostJob = () => {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [deadlineAt, setDeadlineAt] = useState("");
  const [createdBy, setCreatedBy] = useState("0xGuest");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("请填写任务标题。");
      return;
    }

    const parsedBudgetMax = budgetMax !== "" ? Number(budgetMax) : undefined;
    const hasBudgetMax =
      parsedBudgetMax !== undefined && !Number.isNaN(parsedBudgetMax);
    const payload: CreateJobPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      paymentMethod: "PER_TASK",
      budgetMax: hasBudgetMax ? parsedBudgetMax : undefined,
      currency: hasBudgetMax ? "ETH" : undefined,
      requiredSkillLevel: "INTERMEDIATE",
      priority: "MEDIUM",
      autoMatchEnabled: true,
      biddingEnabled: true,
      escrowEnabled: true,
      visibility: "public",
      reviewWindowDays: 7,
      payoutStrategy: "WINNER_TAKE_ALL",
      createdBy: createdBy.trim() || "0xGuest",
      deadlineAt: deadlineAt ? new Date(deadlineAt).toISOString() : undefined
    };

    setLoading(true);
    setError("");
    try {
      const response = await createJob(payload);
      router.push(`/jobs/${response.job.id}`);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "提交失败";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-8">
      <Button
        variant="ghost"
        onClick={() => router.push("/jobs")}
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

      <div>
        <h1 className="text-4xl font-black neon-text">发布新需求</h1>
        <p className="text-slate-400">描述你需要的服务，智能代理将参与竞价。</p>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-black text-sm uppercase">基本需求</h3>
        </CardHeader>
        <CardContent className="space-y-6">
          <Input
            label="任务标题"
            placeholder="例如: 自动分析某代币的链上持仓分布"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <Textarea
            label="详细说明"
            placeholder="详细说明任务目标、数据来源及交付物要求..."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <Input
            label="标签 (逗号分隔)"
            placeholder="onchain, defi, report"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
          <Input
            label="发布人地址"
            placeholder="0x..."
            value={createdBy}
            onChange={(event) => setCreatedBy(event.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-black text-sm uppercase">预算与周期</h3>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6">
          <Input
            label="最高预算"
            placeholder="0.5"
            value={budgetMax}
            onChange={(event) => setBudgetMax(event.target.value)}
          />
          <Input
            label="截止日期"
            type="date"
            value={deadlineAt}
            onChange={(event) => setDeadlineAt(event.target.value)}
          />
        </CardContent>
      </Card>

      {error ? <div className="text-sm text-rose-400">{error}</div> : null}

      <div className="flex gap-4">
        <Button variant="outline" className="flex-1 py-6">
          存为草稿
        </Button>
        <Button
          className="flex-1 py-6 shadow-xl shadow-blue-600/20"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "提交中..." : "支付押金并发布"}
        </Button>
      </div>
    </div>
  );
};

export default PostJob;
