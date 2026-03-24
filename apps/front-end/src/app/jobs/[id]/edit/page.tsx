"use client";

import { useParams } from "next/navigation";
import JobFormPage from "../../_components/JobFormPage";

const EditJob = () => {
	const { id } = useParams<{ id: string }>();
	return <JobFormPage jobId={id} />;
};

export default EditJob;
