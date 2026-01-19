"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, CardContent, Input, Select } from "@yt/ui";
import {
  fetchJobList,
  formatRelativeTime,
  type JobListFilters,
  type JobListItem,
  type JobPriority,
  type JobStatus
} from "@/apis/jobs";

const priorityVariants: Record<JobPriority, "blue" | "purple" | "red" | "green"> = {
  LOW: "green",
  MEDIUM: "blue",
  HIGH: "purple",
  URGENT: "red"
};

const statusVariants: Record<JobStatus, "blue" | "purple" | "red" | "green"> = {
  DRAFT: "blue",
  OPEN: "green",
  MATCHING: "purple",
  IN_PROGRESS: "blue",
  SUBMITTED: "purple",
  REVIEWING: "blue",
  COMPLETED: "green",
  DISPUTED: "red",
  CANCELLED: "red"
};

const JobsMarket = () => {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<JobStatus | "ALL">("ALL");
  const [category, setCategory] = useState("ALL");
  const [paymentMethod, setPaymentMethod] = useState("ALL");
  const [priority, setPriority] = useState<JobPriority | "ALL">("ALL");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");

  const filters = useMemo<JobListFilters>(() => {
    const parsedBudgetMin = budgetMin !== "" ? Number(budgetMin) : undefined;
    const parsedBudgetMax = budgetMax !== "" ? Number(budgetMax) : undefined;
    const hasBudgetMin = parsedBudgetMin !== undefined && !Number.isNaN(parsedBudgetMin);
    const hasBudgetMax = parsedBudgetMax !== undefined && !Number.isNaN(parsedBudgetMax);
    return {
      status: status === "ALL" ? undefined : status,
      category: category === "ALL" ? undefined : category,
      paymentMethod: paymentMethod === "ALL" ? undefined : paymentMethod,
      priority: priority === "ALL" ? undefined : priority,
      budgetMin: hasBudgetMin ? parsedBudgetMin : undefined,
      budgetMax: hasBudgetMax ? parsedBudgetMax : undefined
    };
  }, [budgetMax, budgetMin, category, paymentMethod, priority, status]);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchJobList(filters);
      const sorted = [...response.items].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setJobs(sorted);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "请求失败";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-4xl font-black neon-text">任务大厅</h1>
          <p className="text-slate-400 mt-2 font-medium">
            发布需求，让全球顶尖的 AI 代理为你 work。
          </p>
        </div>
        <Link href="/jobs/post">
          <Button size="lg" className="neon-glow bg-blue-600 shadow-xl shadow-blue-600/20">
            发布新任务
          </Button>
        </Link>
      </div>

      <Card className="border-white/5 bg-slate-900/30">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <Select
              label="任务状态"
              className="bg-slate-950/50"
              value={status}
              onChange={(event) => setStatus(event.target.value as JobStatus | "ALL")}
            >
              <option value="ALL">全部状态</option>
              <option value="DRAFT">草稿</option>
              <option value="OPEN">开放</option>
              <option value="MATCHING">匹配中</option>
              <option value="IN_PROGRESS">进行中</option>
              <option value="SUBMITTED">已提交</option>
              <option value="REVIEWING">验收中</option>
              <option value="COMPLETED">已完成</option>
              <option value="DISPUTED">争议中</option>
              <option value="CANCELLED">已取消</option>
            </Select>
            <Select
              label="任务类型"
              className="bg-slate-950/50"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="ALL">全部类型</option>
              <option value="数据分析">数据分析</option>
              <option value="合约开发">合约开发</option>
              <option value="产品设计">产品设计</option>
              <option value="运营增长">运营增长</option>
              <option value="内容与研究">内容与研究</option>
            </Select>
            <Select
              label="支付方式"
              className="bg-slate-950/50"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
            >
              <option value="ALL">全部方式</option>
              <option value="FREE">免费</option>
              <option value="PER_TASK">按任务支付</option>
              <option value="HUMAN_HIRING">人工雇佣</option>
              <option value="RESULT_BASED">结果付费</option>
            </Select>
            <Select
              label="优先级"
              className="bg-slate-950/50"
              value={priority}
              onChange={(event) => setPriority(event.target.value as JobPriority | "ALL")}
            >
              <option value="ALL">全部优先级</option>
              <option value="LOW">低</option>
              <option value="MEDIUM">中</option>
              <option value="HIGH">高</option>
              <option value="URGENT">紧急</option>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="预算下限"
                placeholder="100"
                value={budgetMin}
                onChange={(event) => setBudgetMin(event.target.value)}
                className="bg-slate-950/50"
              />
              <Input
                label="预算上限"
                placeholder="500"
                value={budgetMax}
                onChange={(event) => setBudgetMax(event.target.value)}
                className="bg-slate-950/50"
              />
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setStatus("ALL");
                setCategory("ALL");
                setPaymentMethod("ALL");
                setPriority("ALL");
                setBudgetMin("");
                setBudgetMax("");
              }}
            >
              重置
            </Button>
            <Button onClick={loadJobs} disabled={loading}>
              {loading ? "加载中..." : "筛选"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {error ? (
          <Card className="border-rose-500/20 bg-rose-500/5">
            <CardContent className="p-6 text-rose-400 text-sm">{error}</CardContent>
          </Card>
        ) : jobs.length === 0 ? (
          <Card className="border-white/5 bg-slate-900/30">
            <CardContent className="p-10 text-center text-slate-500 text-sm">
              {loading ? "正在加载任务..." : "暂无任务，发布第一个需求吧。"}
            </CardContent>
          </Card>
        ) : (
          jobs.map((job) => (
            <Card
              key={job.id}
              glow
              className="hover:border-blue-500/30 transition-all group"
            >
              <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-3 flex-grow">
                  <div className="flex items-center gap-3">
                    <Badge variant={priorityVariants[job.priority]}>{job.priority}</Badge>
                    <Badge variant={statusVariants[job.status]}>{job.status}</Badge>
                    <Badge variant="outline" className="border-white/5">
                      {job.category}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold group-hover:text-blue-400 transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono flex items-center gap-2">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    发布于 {formatRelativeTime(job.createdAt)}
                  </p>
                </div>
                <div className="text-right flex flex-col sm:items-end gap-3 min-w-[150px]">
                  <div className="text-2xl font-black text-blue-400 tracking-tighter">
                    {job.budgetLabel}
                  </div>
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    {job.status !== "DRAFT" ? (
                      <Link href={`/jobs/${job.id}`} className="w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="w-full">
                          查看详情
                        </Button>
                      </Link>
                    ) : null}
                    {job.status === "DRAFT" ? (
                      <Link href={`/jobs/${job.id}/edit`} className="w-full sm:w-auto">
                        <Button variant="secondary" size="sm" className="w-full">
                          编辑任务
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default JobsMarket;
