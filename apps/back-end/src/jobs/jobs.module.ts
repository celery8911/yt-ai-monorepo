import { Module } from "@nestjs/common";
import { AgentsModule } from "../agents/agents.module";
import { DaoModule } from "../dao/dao.module";
import { MatchingModule } from "../matching/matching.module";
import { JobsController } from "./jobs.controller";
import { JobsResolver } from "./jobs.resolver";
import { JobsService } from "./jobs.service";

@Module({
  imports: [AgentsModule, MatchingModule, DaoModule],
  controllers: [JobsController],
  providers: [JobsService, JobsResolver],
  exports: [JobsService]
})
export class JobsModule {}
