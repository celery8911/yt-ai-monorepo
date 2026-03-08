"use client";

/**
 * EIP-712 签名演示页面
 *
 * 展示完整的 EIP-712 签名流程：
 * 1. 填写报价参数
 * 2. 签名 (MetaMask 弹出 typed data 确认)
 * 3. 显示签名结果 (r, s, v 分解)
 * 4. 链上验证 (调用 SignatureVerifier 合约)
 */

import dynamic from "next/dynamic";

const SignatureDemoContent = dynamic(() => import("./SignatureDemoContent"), {
	ssr: false,
	loading: () => (
		<div className="text-center py-20 text-slate-400">加载中...</div>
	),
});

const SignatureDemoPage = () => {
	return <SignatureDemoContent />;
};

export default SignatureDemoPage;
