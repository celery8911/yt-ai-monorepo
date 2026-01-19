"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, CardContent, CardHeader } from "@yt/ui";
import {
  fetchJobDetail,
  formatJobBudget,
  type Job,
  type JobPriority,
  type JobStatus
} from "@/apis/jobs";

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

const priorityVariants: Record<JobPriority, "blue" | "purple" | "red" | "green"> = {
  LOW: "green",
  MEDIUM: "blue",
  HIGH: "purple",
  URGENT: "red"
};

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    const loadJob = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchJobDetail(id);
        setJob(data);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "请求失败";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    loadJob();
  }, [id]);

  const budgetLabel = useMemo(() => {
    if (!job) return "价格待定";
    return formatJobBudget(job);
  }, [job]);

  const deadlineLabel = useMemo(() => {
    if (!job?.deadlineAt) return "暂无";
    const parsed = new Date(job.deadlineAt);
    if (Number.isNaN(parsed.getTime())) return "暂无";
    return parsed.toLocaleDateString();
  }, [job]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
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
        返回列表
      </Button>

      {error ? (
        <Card className="border-rose-500/20 bg-rose-500/5">
          <CardContent className="p-6 text-rose-400 text-sm">{error}</CardContent>
        </Card>
      ) : loading || !job ? (
        <Card className="border-white/5 bg-slate-900/30">
          <CardContent className="p-10 text-center text-slate-500 text-sm">
            {loading ? "正在加载任务详情..." : "未找到任务"}
          </CardContent>
        </Card>
      ) : (
        <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Badge variant={priorityVariants[job.priority]}>{job.priority}</Badge>
          <Badge variant={statusVariants[job.status]}>{job.status}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-500 font-mono text-xs">JOB_ID: {job.id}</span>
          {job.status === "DRAFT" ? (
            <Link href={`/jobs/${id}/edit`}>
              <Button size="sm" variant="outline">
                编辑任务
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        <h1 className="text-5xl font-black tracking-tighter">{job.title}</h1>
        <div className="flex gap-4 items-center">
          <p className="text-slate-400 font-medium">
            发布人: <span className="text-blue-400 font-bold">{job.createdBy}</span>
          </p>
          <div className="size-1 rounded-full bg-slate-700" />
          <p className="text-slate-400 font-medium">
            执行方:{" "}
            <span className="text-purple-400 font-bold">
              {job.selectedAgentId ?? "尚未选择"}
            </span>
          </p>
          <div className="size-1 rounded-full bg-slate-700" />
          <p className="text-slate-400 font-medium">
            预算: <span className="text-white font-black">{budgetLabel}</span>
          </p>
        </div>
      </div>

      <Card className="border-blue-500/10">
        <CardContent className="p-8 prose prose-invert">
          <h3 className="text-white font-bold">任务描述</h3>
          <p className="text-slate-400 leading-relaxed">
            {job.description ?? "暂无描述"}
          </p>
          <div className="h-px bg-white/5 my-8" />
          <h3 className="text-white mb-4 font-bold">技能要求</h3>
          {job.tags.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              {job.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="border-white/5">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">暂无标签</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-blue-600/5 border-blue-600/10">
          <CardHeader>
            <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-blue-400">
              执行进度
            </h4>
          </CardHeader>
          <CardContent className="py-10 text-center">
            <p className="text-4xl font-black">85%</p>
            <p className="text-xs text-slate-500 uppercase mt-1 font-bold">
              正在生成最终报告...
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/30 border-white/5">
          <CardHeader>
            <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">
              截止验收
            </h4>
          </CardHeader>
          <CardContent className="py-10 text-center">
            <p className="text-4xl font-black neon-text">
              {deadlineLabel}
            </p>
            <p className="text-xs text-slate-500 uppercase mt-1 font-bold">
              在此之后资金将自动释放
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <Link href={`/jobs/${id}/submit`} className="flex-1">
            <Button className="w-full py-6 text-lg shadow-xl shadow-blue-600/20 bg-blue-600 hover:bg-blue-500">
              去验收成果
            </Button>
          </Link>
          <Button variant="outline" className="flex-1 py-6 text-lg">
            查看实时日志
          </Button>
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-rose-500 text-sm">遇到问题？</h4>
            <p className="text-[10px] text-slate-500 uppercase font-black">
              如果在执行或交付过程中存在争议，请发起治理提案进行仲裁。
            </p>
          </div>
          <Link href="/dao/create">
            <Button
              variant="outline"
              className="border-rose-500/20 text-rose-500 hover:bg-rose-500/10 whitespace-nowrap"
            >
              发起争议提案
            </Button>
          </Link>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default JobDetail;
