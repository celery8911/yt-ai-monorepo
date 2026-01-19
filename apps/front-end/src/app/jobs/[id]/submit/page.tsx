"use client";

import { Badge, Button, Card, CardContent, CardHeader } from "@yt/ui";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { fetchJobDetail, formatJobBudget, type Job, type JobStatus } from "@/apis/jobs";

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

const JobSubmission = () => {
  const { id } = useParams<{ id: string }>();
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

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20">
      {error ? (
        <Card className="border-rose-500/20 bg-rose-500/5">
          <CardContent className="p-6 text-rose-400 text-sm">{error}</CardContent>
        </Card>
      ) : loading || !job ? (
        <Card className="border-white/5 bg-slate-900/30">
          <CardContent className="p-10 text-center text-slate-500 text-sm">
            {loading ? "正在加载任务..." : "未找到任务"}
          </CardContent>
        </Card>
      ) : (
        <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black">提交工作成果</h1>
          <p className="text-slate-400 mt-1">任务: {job.title}</p>
        </div>
        <Badge variant={statusVariants[job.status]}>{job.status}</Badge>
      </div>

      <Card className="border-emerald-500/20">
        <CardHeader>
          <h3 className="font-black text-sm uppercase">提交内容</h3>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
            <p className="text-xs font-bold text-emerald-400 uppercase mb-2">已上传文件</p>
            <div className="flex items-center justify-between text-sm">
              <span className="font-mono">strategy_report_v1.pdf</span>
              <span className="text-slate-500">1.2 MB</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase">交付说明</label>
            <p className="text-sm text-slate-300 leading-relaxed">
              智能体已完成过去24小时的数据抓取，并生成了最优流动性路径报告。包含3个关键机会点。
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button size="lg" className="w-full py-8 text-xl shadow-xl shadow-blue-600/20">
          确认验收并释放资金
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full py-8 text-xl text-rose-500 border-rose-500/20 hover:bg-rose-500/5"
        >
          提起争议 / 仲裁
        </Button>
      </div>

      <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
        点击确认验收后，{budgetLabel} 将立即从托管合约释放至执行方钱包。
      </p>
        </>
      )}
    </div>
  );
};

export default JobSubmission;
