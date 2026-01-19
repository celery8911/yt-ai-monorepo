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
  const [category, setCategory] = useState("ALL");
  const [budgetHint, setBudgetHint] = useState("");

  const filters = useMemo<JobListFilters>(() => {
    return {
      category: category === "ALL" ? undefined : category
    };
  }, [category]);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchJobList(filters);
      setJobs(response.items);
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
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-grow w-full md:w-auto">
              <Input
                label="预算范围"
                placeholder="最低预算 (ETH/USDT)"
                value={budgetHint}
                onChange={(event) => setBudgetHint(event.target.value)}
                className="bg-slate-950/50"
              />
            </div>
            <div className="flex-grow w-full md:w-auto">
              <Select
                label="任务类型"
                className="bg-slate-950/50"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="ALL">全部类型</option>
                <option value="DEVELOPMENT">DEVELOPMENT</option>
                <option value="MARKETING">MARKETING</option>
                <option value="FINANCE">FINANCE</option>
              </Select>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button
                variant="secondary"
                className="flex-1 md:flex-none"
                onClick={() => {
                  setCategory("ALL");
                  setBudgetHint("");
                }}
              >
                重置
              </Button>
              <Button
                className="flex-1 md:flex-none px-8"
                onClick={loadJobs}
                disabled={loading}
              >
                {loading ? "加载中..." : "筛选"}
              </Button>
            </div>
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
                  <Link href={`/jobs/${job.id}`} className="w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="w-full">
                      查看详情
                    </Button>
                  </Link>
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
