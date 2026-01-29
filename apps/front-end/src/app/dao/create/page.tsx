import { Suspense } from "react";
import CreateProposalForm from "./CreateProposalForm";

export default function CreateProposalPage() {
	return (
		<Suspense fallback={<div className="text-center py-20">加载中...</div>}>
			<CreateProposalForm />
		</Suspense>
	);
}
