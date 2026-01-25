import { draftSchema } from "../schemas/draft-schema";

export type DraftType = "agent" | "job";

const schemaNotes = `
Output must be valid JSON only.
For unknown fields, use empty string, empty array, or omit the field in fields.
Always include missing[] with dot-paths for required fields you could not infer.
Always include confidence for any field you set (0-1).
`;

const jobFieldNotes = `
Job required fields:
- title (string)
- tags (string[])
- paymentMethod (FREE | PER_TASK | HUMAN_HIRING | RESULT_BASED)
- requiredSkillLevel (BEGINNER | INTERMEDIATE | ADVANCED | EXPERT)
- priority (LOW | MEDIUM | HIGH | URGENT)
- autoMatchEnabled (boolean)
- biddingEnabled (boolean)
- escrowEnabled (boolean)
- visibility (public | private)
- payoutStrategy (WINNER_TAKE_ALL | SPLIT_IF_NO_SELECTION)
- createdBy (string)

Optional fields:
- description, category, budgetMin, budgetMax, currency, deliverables,
  acceptanceCriteria, deadlineAt, reviewWindowDays, status (DRAFT | OPEN)
`;

const agentFieldNotes = `
Agent required fields:
- name (string)
- tags (string[])
- endpointUrl (string)
- supportedPaymentMethods (PaymentMethod[])
- skillLevel (BEGINNER | INTERMEDIATE | ADVANCED | EXPERT)
- deliverableFormats (CODE | DOCUMENTATION | DEPLOYMENT | REPORT | DATASET | MODEL)
- owner (string)
- visibility (public | private)
- isActive (boolean)

Optional fields:
- description, category, pricePerTask, resultBasedMinPrice, minBid, currency,
  avgResponseTimeMs, successRate (0-1), rating (0-5)
`;

export function buildDraftPrompt(input: {
	text: string;
	draftType?: DraftType;
	createdBy?: string;
	owner?: string;
}): string {
	const target = input.draftType ?? "job";
	const inferredCreatedBy = input.createdBy ?? "";
	const inferredOwner = input.owner ?? "";

	const schemaHint =
		target === "job"
			? `{\n  "draftType": "job",\n  "fields": {\n    "title": "",\n    "description": "",\n    "category": "",\n    "tags": [],\n    "paymentMethod": "FREE",\n    "budgetMin": 0,\n    "budgetMax": 0,\n    "currency": "",\n    "requiredSkillLevel": "BEGINNER",\n    "deliverables": "",\n    "acceptanceCriteria": "",\n    "deadlineAt": "",\n    "priority": "LOW",\n    "autoMatchEnabled": false,\n    "biddingEnabled": false,\n    "escrowEnabled": false,\n    "visibility": "public",\n    "reviewWindowDays": 1,\n    "payoutStrategy": "WINNER_TAKE_ALL",\n    "status": "DRAFT",\n    "createdBy": ""\n  },\n  "missing": [],\n  "confidence": {},\n  "notes": []\n}`
			: `{\n  "draftType": "agent",\n  "fields": {\n    "name": "",\n    "description": "",\n    "category": "",\n    "tags": [],\n    "endpointUrl": "",\n    "supportedPaymentMethods": [],\n    "skillLevel": "BEGINNER",\n    "deliverableFormats": [],\n    "pricePerTask": 0,\n    "resultBasedMinPrice": 0,\n    "minBid": 0,\n    "currency": "",\n    "avgResponseTimeMs": 0,\n    "successRate": 0,\n    "rating": 0,\n    "owner": "",\n    "visibility": "public",\n    "isActive": true\n  },\n  "missing": [],\n  "confidence": {},\n  "notes": []\n}`;

	const fieldNotes = target === "job" ? jobFieldNotes : agentFieldNotes;

	return `You are a requirement parser. Convert user text into a ${target} draft.
${schemaNotes}
${fieldNotes}

If input includes a user id or owner, prefer it. Otherwise leave createdBy/owner empty.
createdBy hint: ${inferredCreatedBy}
owner hint: ${inferredOwner}

Return JSON only. Example schema shape (for reference, not literal):
${schemaHint}

User input:
${input.text}
`;
}

export function getDraftSchema() {
	return draftSchema;
}
