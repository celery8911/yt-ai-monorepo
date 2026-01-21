"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	Input,
	Textarea,
} from "@yt/ui";
import { useState } from "react";
import { createAgent, type CreateAgentPayload } from "@/apis/agent";
import { useWallet } from "@yt/hooks";

const CreateAgent = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const isEdit = searchParams.get("edit") === "true";
	const { address } = useWallet();

	// 表单状态
	const [formData, setFormData] = useState({
		name: "",
		category: "",
		description: "",
		endpointUrl: "",
		tags: [] as string[],
		skillLevel: "INTERMEDIATE" as
			| "BEGINNER"
			| "INTERMEDIATE"
			| "ADVANCED"
			| "EXPERT",
		visibility: "public" as "public" | "private",
		isActive: true,
		supportedPaymentMethods: ["CRYPTO"] as string[],
		deliverableFormats: ["JSON"] as string[],
		pricePerTask: undefined as number | undefined,
		currency: "USD",
	});

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// 处理输入变化
	const handleInputChange = (field: string, value: any) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	// 处理标签输入（逗号分隔）
	const handleTagsChange = (value: string) => {
		const tags = value
			.split(",")
			.map((tag) => tag.trim())
			.filter(Boolean);
		setFormData((prev) => ({ ...prev, tags }));
	};

	// 提交表单
	const handleSubmit = async () => {
		setError(null);

		// 验证必填字段
		if (!formData.name.trim()) {
			setError("请输入代理名称");
			return;
		}
		if (!formData.endpointUrl.trim()) {
			setError("请输入 Endpoint URL");
			return;
		}
		if (!address) {
			setError("请先连接钱包");
			return;
		}

		setIsSubmitting(true);

		try {
			const payload: CreateAgentPayload = {
				name: formData.name,
				description: formData.description || undefined,
				category: formData.category || undefined,
				tags: formData.tags,
				endpointUrl: formData.endpointUrl,
				supportedPaymentMethods: formData.supportedPaymentMethods,
				skillLevel: formData.skillLevel,
				deliverableFormats: formData.deliverableFormats,
				pricePerTask: formData.pricePerTask,
				currency: formData.currency,
				owner: address,
				visibility: formData.visibility,
				isActive: formData.isActive,
			};

			await createAgent(payload);

			// 创建成功后跳转到市场页面
			router.push("/market");
		} catch (err: any) {
			setError(err?.message || "创建失败，请重试");
			console.error("创建 Agent 失败:", err);
		} finally {
			setIsSubmitting(false);
		}
	};

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
					{isEdit ? "编辑" : "上传"}{" "}
					<span className="text-blue-500">智能体</span>
				</h1>
				<p className="text-slate-400">
					配置您的 AI 代理，连接全球去中心化算力网络。
				</p>
			</div>

			{error && (
				<div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
					{error}
				</div>
			)}

			<Card className="border-blue-500/20">
				<CardHeader>
					<div className="flex items-center gap-3">
						<span className="size-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black">
							1
						</span>
						<h3 className="font-black text-sm uppercase tracking-widest">
							元数据配置
						</h3>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<Input
							label="代理名称 *"
							placeholder="例如: CyberTrade Pro"
							value={formData.name}
							onChange={(e) => handleInputChange("name", e.target.value)}
						/>
						<Input
							label="分类"
							placeholder="DEFI / DEV / SOCIAL"
							value={formData.category}
							onChange={(e) => handleInputChange("category", e.target.value)}
						/>
					</div>
					<Textarea
						label="核心说明"
						placeholder="描述您的 AI 代理核心逻辑与优势..."
						value={formData.description}
						onChange={(e) => handleInputChange("description", e.target.value)}
					/>
					<Input
						label="标签（逗号分隔）"
						placeholder="例如: trading, defi, automation"
						value={formData.tags.join(", ")}
						onChange={(e) => handleTagsChange(e.target.value)}
					/>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label className="block text-sm font-bold mb-2">技能等级</label>
							<select
								className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
								value={formData.skillLevel}
								onChange={(e) =>
									handleInputChange("skillLevel", e.target.value)
								}
							>
								<option value="BEGINNER">初级</option>
								<option value="INTERMEDIATE">中级</option>
								<option value="ADVANCED">高级</option>
								<option value="EXPERT">专家</option>
							</select>
						</div>
						<div>
							<label className="block text-sm font-bold mb-2">可见性</label>
							<select
								className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
								value={formData.visibility}
								onChange={(e) =>
									handleInputChange("visibility", e.target.value)
								}
							>
								<option value="public">公开</option>
								<option value="private">私有</option>
							</select>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<div className="flex items-center gap-3">
						<span className="size-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black">
							2
						</span>
						<h3 className="font-black text-sm uppercase tracking-widest">
							模型接口与定价
						</h3>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					<Input
						label="Endpoint URL *"
						placeholder="https://api.your-model.ai/v1"
						value={formData.endpointUrl}
						onChange={(e) => handleInputChange("endpointUrl", e.target.value)}
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
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<Input
							label="每任务价格"
							type="number"
							placeholder="0.00"
							value={formData.pricePerTask || ""}
							onChange={(e) =>
								handleInputChange(
									"pricePerTask",
									e.target.value ? parseFloat(e.target.value) : undefined,
								)
							}
						/>
						<Input
							label="货币"
							placeholder="USD"
							value={formData.currency}
							onChange={(e) => handleInputChange("currency", e.target.value)}
						/>
					</div>
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
				<Button
					variant="outline"
					className="flex-grow py-6"
					onClick={() => router.back()}
					disabled={isSubmitting}
				>
					取消
				</Button>
				<Button
					className="flex-grow py-6 bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/30"
					onClick={handleSubmit}
					disabled={isSubmitting}
				>
					{isSubmitting ? "提交中..." : isEdit ? "保存更改" : "发布到市场"}
				</Button>
			</div>
		</div>
	);
};

export default CreateAgent;
