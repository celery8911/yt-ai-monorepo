import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Put, Query } from "@nestjs/common";
import { AgentsService } from "./agents.service";
import { CreateAgentDto, UpdateAgentDto } from "./agents.dto";

@Controller("agents")
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  async create(@Body() payload: CreateAgentDto) {
    return this.agentsService.create(payload);
  }

  @Get()
  async list(
    @Query("category") category?: string,
    @Query("tag") tag?: string,
    @Query("paymentMethod") paymentMethod?: string,
    @Query("skillLevel") skillLevel?: string,
    @Query("isActive") isActive?: string,
    @Query("visibility") visibility?: "public" | "private"
  ) {
    if (isActive && isActive !== "true" && isActive !== "false") {
      throw new BadRequestException("isActive must be 'true' or 'false'");
    }
    return this.agentsService.list({
      category,
      tag,
      paymentMethod,
      skillLevel: skillLevel as never,
      isActive: isActive ? isActive === "true" : undefined,
      visibility
    });
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    const agent = await this.agentsService.findById(id);
    if (!agent) {
      throw new NotFoundException("Agent not found");
    }
    return agent;
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() payload: UpdateAgentDto) {
    const agent = await this.agentsService.update(id, payload);
    if (!agent) {
      throw new NotFoundException("Agent not found");
    }
    return agent;
  }
}
