import { Suspense } from "react";
import CreateAgentForm from "./CreateAgentForm";

// 服务端组件作为页面入口，用 Suspense 包裹客户端组件
export default function CreatePage() {
	return (
		<Suspense fallback={<div className="text-center py-20">加载中...</div>}>
			<CreateAgentForm />
		</Suspense>
	);
}
