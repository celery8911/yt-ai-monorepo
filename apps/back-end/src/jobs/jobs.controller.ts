import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Put, Query } from "@nestjs/common";
import { AgentsService } from "../agents/agents.service";
import { DaoService } from "../dao/dao.service";
import { MatchingService } from "../matching/matching.service";
import { JobsService } from "./jobs.service";
import { CreateJobDto, DisputeJobDto, SelectAgentDto } from "./jobs.dto";

@Controller("jobs")
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly agentsService: AgentsService,
    private readonly matchingService: MatchingService,
    private readonly daoService: DaoService
  ) {}

  @Post()
  async create(@Body() payload: CreateJobDto) {
    const job = await this.jobsService.create(payload);
    const agents = await this.agentsService.all();
    const matches = payload.autoMatchEnabled ? this.matchingService.match(job, agents) : [];
    return { job, matches };
  }

  @Get()
  async list(
    @Query("status") status?: string,
    @Query("category") category?: string,
    @Query("tag") tag?: string,
    @Query("paymentMethod") paymentMethod?: string,
    @Query("priority") priority?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    const parsedPage = page ? Number(page) : undefined;
    const parsedLimit = limit ? Number(limit) : undefined;
    if (page && Number.isNaN(parsedPage)) {
      throw new BadRequestException("page must be a number");
    }
    if (limit && Number.isNaN(parsedLimit)) {
      throw new BadRequestException("limit must be a number");
    }
    if (parsedPage !== undefined && parsedPage < 1) {
      throw new BadRequestException("page must be >= 1");
    }
    if (parsedLimit !== undefined && parsedLimit < 1) {
      throw new BadRequestException("limit must be >= 1");
    }
    return this.jobsService.list({
      status: status as never,
      category,
      tag,
      paymentMethod,
      priority,
      page: parsedPage,
      limit: parsedLimit
    });
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    const job = await this.jobsService.findById(id);
    if (!job) {
      throw new NotFoundException("Job not found");
    }
    return job;
  }

  @Put(":id/select")
  async select(@Param("id") id: string, @Body() payload: SelectAgentDto) {
    const job = await this.jobsService.findById(id);
    if (!job) {
      throw new NotFoundException("Job not found");
    }
    const agents = await this.agentsService.all();
    const matches = this.matchingService.match(job, agents);
    const selectedId = payload.agentId ?? matches[0]?.id;
    if (selectedId) {
      await this.jobsService.selectAgent(id, selectedId);
    }
    return {
      job: await this.jobsService.findById(id),
      selectedAgentId: selectedId,
      matches
    };
  }

  @Post(":id/dispute")
  async dispute(@Param("id") id: string, @Body() payload: DisputeJobDto) {
    const job = await this.jobsService.findById(id);
    if (!job) {
      throw new NotFoundException("Job not found");
    }
    const dispute = await this.daoService.initiate({
      jobId: id,
      initiator: payload.initiator,
      reason: payload.reason
    });
    await this.jobsService.updateStatus(id, "DISPUTED");
    return { job: await this.jobsService.findById(id), dispute };
  }
}
