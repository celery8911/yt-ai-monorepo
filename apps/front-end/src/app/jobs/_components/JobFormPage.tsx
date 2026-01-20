"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, Input, Select, Switch, Textarea } from "@yt/ui";
import {
  createJob,
  fetchJobDetail,
  updateJob,
  type CreateJobPayload,
  type Job
} from "@/apis/jobs";
import { useWallet } from "@yt/hooks";

type JobFormPageProps = {
  jobId?: string;
};

const formatDateInput = (value?: string): string => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const JobFormPage = ({ jobId }: JobFormPageProps) => {
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<CreateJobPayload["paymentMethod"]>("PER_TASK");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [currency, setCurrency] = useState<CreateJobPayload["currency"]>("USD");
  const [requiredSkillLevel, setRequiredSkillLevel] =
    useState<CreateJobPayload["requiredSkillLevel"]>("INTERMEDIATE");
  const [deliverables, setDeliverables] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [deadlineAt, setDeadlineAt] = useState("");
  const [priority, setPriority] = useState<CreateJobPayload["priority"]>("MEDIUM");
  const [visibility, setVisibility] = useState<CreateJobPayload["visibility"]>("public");
  const [autoMatchEnabled, setAutoMatchEnabled] = useState(true);
  const [biddingEnabled, setBiddingEnabled] = useState(true);
  const [escrowEnabled, setEscrowEnabled] = useState(true);
  const [reviewWindowDays, setReviewWindowDays] = useState("7");
  const [payoutStrategy, setPayoutStrategy] =
    useState<CreateJobPayload["payoutStrategy"]>("WINNER_TAKE_ALL");
  const { address } = useWallet();

  useEffect(() => {
    if (!jobId) return;
    const loadJob = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchJobDetail(jobId);
        setJob(data);
        setTitle(data.title ?? "");
        setDescription(data.description ?? "");
        setCategory(data.category ?? "");
        setTags(data.tags.join(", "));
        setPaymentMethod(data.paymentMethod);
        setBudgetMin(data.budgetMin !== undefined ? String(data.budgetMin) : "");
        setBudgetMax(data.budgetMax !== undefined ? String(data.budgetMax) : "");
        setCurrency(data.currency ?? "USD");
        setRequiredSkillLevel(data.requiredSkillLevel);
        setDeliverables(data.deliverables ?? "");
        setAcceptanceCriteria(data.acceptanceCriteria ?? "");
        setDeadlineAt(formatDateInput(data.deadlineAt));
        setPriority(data.priority);
        setVisibility(data.visibility);
        setAutoMatchEnabled(data.autoMatchEnabled);
        setBiddingEnabled(data.biddingEnabled);
        setEscrowEnabled(data.escrowEnabled);
        setReviewWindowDays(String(data.reviewWindowDays ?? 7));
        setPayoutStrategy(data.payoutStrategy);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "请求失败";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    loadJob();
  }, [jobId]);

  const isEditing = Boolean(jobId);
  const canEditDraft = useMemo(
    () => (isEditing ? job?.status === "DRAFT" : true),
    [isEditing, job?.status]
  );

  const handleSubmit = async (status: CreateJobPayload["status"] = "OPEN") => {
    if (!title.trim()) {
      setError("请填写任务标题。");
      return;
    }
    if (!address) {
      setError("请先连接钱包。");
      return;
    }

    const parsedBudgetMin = budgetMin !== "" ? Number(budgetMin) : undefined;
    const parsedBudgetMax = budgetMax !== "" ? Number(budgetMax) : undefined;
    const hasBudgetMin =
      parsedBudgetMin !== undefined && !Number.isNaN(parsedBudgetMin);
    const hasBudgetMax =
      parsedBudgetMax !== undefined && !Number.isNaN(parsedBudgetMax);
    const parsedReviewWindowDays =
      reviewWindowDays !== "" ? Number(reviewWindowDays) : undefined;
    const hasReviewWindowDays =
      parsedReviewWindowDays !== undefined && !Number.isNaN(parsedReviewWindowDays);
    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      category: category.trim() || undefined,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      paymentMethod,
      budgetMin: hasBudgetMin ? parsedBudgetMin : undefined,
      budgetMax: hasBudgetMax ? parsedBudgetMax : undefined,
      currency: paymentMethod === "FREE" ? undefined : currency,
      requiredSkillLevel,
      deliverables: deliverables.trim() || undefined,
      acceptanceCriteria: acceptanceCriteria.trim() || undefined,
      deadlineAt: deadlineAt ? new Date(deadlineAt).toISOString() : undefined,
      priority,
      autoMatchEnabled,
      biddingEnabled,
      escrowEnabled,
      visibility,
      reviewWindowDays: hasReviewWindowDays ? parsedReviewWindowDays : undefined,
      payoutStrategy,
      status,
      createdBy: address
    } satisfies CreateJobPayload;

    setLoading(true);
    setError("");
    try {
      if (jobId) {
        await updateJob(jobId, payload);
        router.push(status === "DRAFT" ? "/jobs" : `/jobs/${jobId}`);
      } else {
        const response = await createJob(payload);
        router.push(status === "DRAFT" ? "/jobs" : `/jobs/${response.job.id}`);
      }
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
        onClick={() => router.push(isEditing ? `/jobs/${jobId}` : "/jobs")}
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
        <h1 className="text-4xl font-black neon-text">
          {isEditing ? "修改任务" : "发布新需求"}
        </h1>
        <p className="text-slate-400">
          {isEditing ? "更新草稿内容并发布到任务大厅。" : "描述你需要的服务，智能代理将参与竞价。"}
        </p>
      </div>

      {error ? <div className="text-sm text-rose-400">{error}</div> : null}

      {!loading && isEditing && job && !canEditDraft ? (
        <Card className="border-rose-500/20 bg-rose-500/5">
          <CardContent className="p-6 text-rose-400 text-sm">
            当前任务不是草稿状态，无法编辑。
          </CardContent>
        </Card>
      ) : null}

      {loading && isEditing && !job ? (
        <Card className="border-white/5 bg-slate-900/30">
          <CardContent className="p-8 text-center text-slate-500 text-sm">
            正在加载任务信息...
          </CardContent>
        </Card>
      ) : null}

      {!canEditDraft ? null : (
        <>
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
              <Select
                label="分类"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="">选择任务分类</option>
                <option value="数据分析">数据分析</option>
                <option value="合约开发">合约开发</option>
                <option value="产品设计">产品设计</option>
                <option value="运营增长">运营增长</option>
                <option value="内容与研究">内容与研究</option>
              </Select>
              <Input
                label="标签 (逗号分隔)"
                placeholder="onchain, defi, report"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
              />
              <Textarea
                label="详细说明"
                placeholder="详细说明任务目标、数据来源及交付物要求..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-black text-sm uppercase">支付设置</h3>
            </CardHeader>
            <CardContent className="space-y-6">
              <Select
                label="支付方式"
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(event.target.value as CreateJobPayload["paymentMethod"])
                }
              >
                <option value="FREE">免费</option>
                <option value="PER_TASK">按任务支付</option>
                <option value="HUMAN_HIRING">人工雇佣</option>
                <option value="RESULT_BASED">结果付费</option>
              </Select>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="预算下限"
                  placeholder="100"
                  value={budgetMin}
                  onChange={(event) => setBudgetMin(event.target.value)}
                  disabled={paymentMethod === "FREE"}
                />
                <Input
                  label="预算上限"
                  placeholder="500"
                  value={budgetMax}
                  onChange={(event) => setBudgetMax(event.target.value)}
                  disabled={paymentMethod === "FREE"}
                />
              </div>
              <Select
                label="币种"
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                disabled={paymentMethod === "FREE"}
              >
                <option value="USD">USD</option>
                <option value="TOKEN">TOKEN</option>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-black text-sm uppercase">任务要求</h3>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="截止日期"
                  type="date"
                  value={deadlineAt}
                  onChange={(event) => setDeadlineAt(event.target.value)}
                  iconPosition="right"
                  icon={
                    <svg
                      className="w-4 h-4 text-white pointer-events-none"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10m-12 9h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"
                      />
                    </svg>
                  }
                  className="[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-90 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
                <Select
                  label="优先级"
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value as CreateJobPayload["priority"])
                  }
                >
                  <option value="LOW">低</option>
                  <option value="MEDIUM">中</option>
                  <option value="HIGH">高</option>
                  <option value="URGENT">紧急</option>
                </Select>
              </div>
              <Select
                label="技能等级"
                value={requiredSkillLevel}
                onChange={(event) =>
                  setRequiredSkillLevel(
                    event.target.value as CreateJobPayload["requiredSkillLevel"]
                  )
                }
              >
                <option value="BEGINNER">新手</option>
                <option value="INTERMEDIATE">中级</option>
                <option value="ADVANCED">高级</option>
                <option value="EXPERT">专家</option>
              </Select>
              <Textarea
                label="交付物说明"
                placeholder="列出需要交付的内容，例如代码仓库、部署文档、测试报告等..."
                value={deliverables}
                onChange={(event) => setDeliverables(event.target.value)}
              />
              <Textarea
                label="验收标准"
                placeholder="描述验收方式与标准，例如功能清单、性能指标、验收流程等..."
                value={acceptanceCriteria}
                onChange={(event) => setAcceptanceCriteria(event.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-black text-sm uppercase">高级选项</h3>
            </CardHeader>
            <CardContent className="space-y-6">
              <Select
                label="任务可见性"
                value={visibility}
                onChange={(event) =>
                  setVisibility(event.target.value as CreateJobPayload["visibility"])
                }
              >
                <option value="public">公开</option>
                <option value="private">私密</option>
              </Select>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="验收期 (天)"
                  placeholder="7"
                  value={reviewWindowDays}
                  onChange={(event) => setReviewWindowDays(event.target.value)}
                />
                <Select
                  label="结算策略"
                  value={payoutStrategy}
                  onChange={(event) =>
                    setPayoutStrategy(
                      event.target.value as CreateJobPayload["payoutStrategy"]
                    )
                  }
                >
                  <option value="WINNER_TAKE_ALL">优胜者获得全部</option>
                  <option value="SPLIT_IF_NO_SELECTION">未选中则拆分</option>
                </Select>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold">自动匹配</h4>
                    <p className="text-[10px] text-slate-500 uppercase">
                      由系统自动筛选最合适的智能体
                    </p>
                  </div>
                  <Switch checked={autoMatchEnabled} onChange={setAutoMatchEnabled} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold">开启竞价</h4>
                    <p className="text-[10px] text-slate-500 uppercase">
                      允许智能体提交投标方案
                    </p>
                  </div>
                  <Switch checked={biddingEnabled} onChange={setBiddingEnabled} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold">资金托管</h4>
                    <p className="text-[10px] text-slate-500 uppercase">
                      由平台托管资金并按验收释放
                    </p>
                  </div>
                  <Switch checked={escrowEnabled} onChange={setEscrowEnabled} />
                </div>
              </div>
              <Input
                label="发布人地址"
                placeholder="未连接钱包"
                value={address ?? ""}
                disabled
              />
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1 py-6"
              onClick={() => handleSubmit("DRAFT")}
              disabled={loading}
            >
              {isEditing ? "保存草稿" : "存为草稿"}
            </Button>
            <Button
              className="flex-1 py-6 shadow-xl shadow-blue-600/20"
              onClick={() => handleSubmit("OPEN")}
              disabled={loading}
            >
              {loading ? "提交中..." : "发布"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default JobFormPage;
