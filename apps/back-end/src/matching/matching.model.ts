import { Field, Float, ObjectType } from "@nestjs/graphql";
import { AgentType } from "../agents/agents.model";

@ObjectType()
export class MatchedAgentType extends AgentType {
	@Field(() => Float)
	score!: number;
}
