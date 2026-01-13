import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { NotFoundException } from "@nestjs/common";
import { AgentType } from "./agents.model";
import { AgentsService } from "./agents.service";
import { CreateAgentDto, UpdateAgentDto } from "./agents.dto";

@Resolver(() => AgentType)
export class AgentsResolver {
  constructor(private readonly agentsService: AgentsService) {}

  @Query(() => [AgentType])
  async agents(
    @Args("category", { nullable: true }) category?: string,
    @Args("tag", { nullable: true }) tag?: string,
    @Args("paymentMethod", { nullable: true }) paymentMethod?: string,
    @Args("skillLevel", { nullable: true }) skillLevel?: string,
    @Args("isActive", { nullable: true }) isActive?: boolean,
    @Args("visibility", { nullable: true }) visibility?: "public" | "private"
  ) {
    return this.agentsService.list({
      category,
      tag,
      paymentMethod,
      skillLevel: skillLevel as never,
      isActive,
      visibility
    });
  }

  @Query(() => AgentType)
  async agent(@Args("id") id: string) {
    const agent = await this.agentsService.findById(id);
    if (!agent) {
      throw new NotFoundException("Agent not found");
    }
    return agent;
  }

  @Mutation(() => AgentType)
  async createAgent(@Args("input") input: CreateAgentDto) {
    return this.agentsService.create(input);
  }

  @Mutation(() => AgentType)
  async updateAgent(@Args("id") id: string, @Args("input") input: UpdateAgentDto) {
    const agent = await this.agentsService.update(id, input);
    if (!agent) {
      throw new NotFoundException("Agent not found");
    }
    return agent;
  }
}
