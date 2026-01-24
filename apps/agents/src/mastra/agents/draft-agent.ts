import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";

export const draftAgent = new Agent({
	name: "Draft Agent",
	instructions: `
You convert user requests into a structured draft JSON.
Return JSON only. No markdown, no code fences.
If a value is unknown, keep it empty and add it to missing[].
Always add confidence scores (0-1) for any field you set.
`,
	model: "openai/gpt-4o-mini",
	tools: {},
	memory: new Memory({
		storage: new LibSQLStore({
			url: "file:../mastra.db",
		}),
	}),
});
