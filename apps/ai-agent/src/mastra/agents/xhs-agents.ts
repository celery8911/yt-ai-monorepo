import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";

const models = [
	"codex-mini-latest",
	"gpt-3.5-turbo",
	"gpt-4",
	"gpt-4-turbo",
	"gpt-4.1",
	"gpt-4.1-mini",
	"gpt-4.1-nano",
	"gpt-4o",
	"gpt-4o-2024-05-13",
	"gpt-4o-2024-08-06",
	"gpt-4o-2024-11-20",
	"gpt-4o-mini",
	"gpt-5",
	"gpt-5-chat-latest",
	"gpt-5-codex",
	"gpt-5-mini",
	"gpt-5-nano",
	"gpt-5-pro",
	"gpt-5.1",
	"gpt-5.1-chat-latest",
	"gpt-5.1-codex",
	"gpt-5.1-codex-max",
	"gpt-5.1-codex-mini",
	"gpt-5.2",
	"gpt-5.2-chat-latest",
	"gpt-5.2-codex",
	"gpt-5.2-pro",
	"o1",
	"o1-mini",
	"o1-preview",
	"o1-pro",
	"o3",
	"o3-deep-research",
	"o3-mini",
	"o3-pro",
	"o4-mini",
	"o4-mini-deep-research",
	"text-embedding-3-large",
	"text-embedding-3-small",
	"text-embedding-ada-002",
];

const sharedInstructions = `
你是一个小红书爆款文案专家。你的任务是根据用户的主题，写出极具吸引力的“种草”文案。

**文案风格要求**：
1. **标题党**：标题必须吸睛，使用感叹号、夸张词汇（如“绝绝子”、“封神”、“救命”）。
2. **Emoji 含量高**：每一两句话后面必须带 Emoji，全文 Emoji 占比不低于 10%。
3. **语气亲切**：使用“集美们”、“家人们”、“宝子们”等称呼，语气也是第一人称分享。
4. **结构分明**：
   - 开头：直接抛出痛点或场景。
   - 中间：详细描述体验、效果、成分或亮点。
   - 结尾：引导收藏、关注、互动。
5. **标签**：文末附带 3-5 个相关话题标签 (Hashtag)。

**示例**:
主题：熬夜眼霜
文案：
熬夜党自救！！👀这瓶眼霜真的太牛了😭
家人们！谁懂啊！天天熬夜追剧，黑眼圈都要掉到下巴了🐼
还好被闺蜜安利了这个神器✨，涂上去冰冰凉凉的🧊，吸收巨快！
坚持用了一周，黑眼圈真的淡了好多！！素颜出门也毫无压力💖
不允许还有姐妹不知道它！买它买它买它！💸
#熬夜党必备 #眼霜测评 #好物分享 #护肤打卡
`;

export const xhsAgents: Record<string, Agent> = {};

models.forEach((modelId) => {
	// Replace characters like '-' and '.' with '_' to make a valid JS identifier suffix
	const safeSuffix = modelId.replace(/[-.]/g, "_");
	const agentKey = `xhsAgent_${safeSuffix}`;

	xhsAgents[agentKey] = new Agent({
		name: `XHS Copywriter (${modelId})`,
		instructions: sharedInstructions,
		model: `openai/${modelId}`,
		memory: new Memory({
			storage: new LibSQLStore({
				url: "file:../mastra.db",
			}),
		}),
	});
});
