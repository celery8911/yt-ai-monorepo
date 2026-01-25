import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { draftWorkflow } from "./workflows/draft-workflow";
import { draftAgent } from "./agents/draft-agent";

export const mastra = new Mastra({
	workflows: { draftWorkflow },
	agents: { draftAgent },
	storage: new LibSQLStore({
		url: ":memory:",
	}),
	logger: new PinoLogger({
		name: "Mastra",
		level: "info",
	}),
	telemetry: {
		enabled: false,
	},
	observability: {
		default: { enabled: true },
	},
});
