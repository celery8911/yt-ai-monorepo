import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const weatherWorkflowTool = createTool({
	id: "plan-weather-activities",
	description:
		"Get weather forecast and plan activities for a city based on weather conditions",
	inputSchema: z.object({
		city: z
			.string()
			.describe(
				"The city to get weather forecast and activity suggestions for",
			),
	}),
	outputSchema: z.object({
		activities: z
			.string()
			.describe("Detailed activity suggestions based on weather"),
	}),
	execute: async ({ context, mastra }) => {
		const workflow = mastra?.getWorkflow("weatherWorkflow");

		if (!workflow) {
			throw new Error("Weather workflow not found");
		}

		const run = await workflow.createRunAsync();
		const result = await run.start({
			inputData: {
				city: context.city,
			},
		});

		const planActivitiesStep = result.steps["plan-activities"];

		if (!planActivitiesStep || planActivitiesStep.status !== "success") {
			throw new Error("Plan activities step did not complete successfully");
		}

		return {
			activities: planActivitiesStep.output.activities as string,
		};
	},
});
